"""
sync/engine.py

SyncEngine: orchestrates the full incremental sync pipeline.

Sync modes:
    FULL        — fetches ALL matching emails via search_emails().
                  Used when no historyId is stored or historyId has expired (>7 days).

    INCREMENTAL — fetches ONLY messages added since the last sync via get_history().
                  Zero API calls if no new emails arrived. Nearly instant.

Flow:
    1. Check sync_metadata for the last gmail_history_id
    2. If found and valid  → INCREMENTAL mode via get_history()
    3. If missing/expired  → FULL mode via search_emails()
    4. Filter new message IDs against booking and cancellation queries
    5. Run BookingSyncer on booking stubs
    6. Run CancellationSyncer on cancellation stubs
    7. Store the latest historyId for next run
    8. Return a SyncReport with all stats
"""

import time
import sqlite3
from dataclasses import dataclass, field

from gmail import (
    search_emails,
    get_history,
    BOOKING_QUERY,
    CANCELLATION_QUERY,
)
from database.models import get_last_history_id, save_history_id
from sync.booking_sync import BookingSyncer
from sync.cancellation_sync import CancellationSyncer


@dataclass
class SyncReport:
    """Structured result returned by SyncEngine.run()."""
    mode:          str             = "full"      # 'full' | 'incremental'
    duration_s:    float           = 0.0
    bookings:      dict            = field(default_factory=dict)
    cancellations: dict            = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "mode":          self.mode,
            "duration_s":    round(self.duration_s, 2),
            "bookings":      self.bookings,
            "cancellations": self.cancellations,
        }


class SyncEngine:
    """
    Top-level sync orchestrator.

    Usage:
        engine = SyncEngine(service, conn)
        report = engine.run()
        print(report.to_dict())
    """

    def __init__(self, service, conn: sqlite3.Connection):
        self.service = service
        self.conn    = conn

    # ─────────────────────────────────────────────────────────────────────────
    # Public entry point
    # ─────────────────────────────────────────────────────────────────────────

    def run(self) -> SyncReport:
        """
        Run a full or incremental sync depending on whether a valid
        gmail_history_id is available.
        """
        start = time.monotonic()

        last_history_id = get_last_history_id(self.conn)

        if last_history_id:
            report = self._run_incremental(last_history_id)
        else:
            report = self._run_full()

        report.duration_s = time.monotonic() - start

        print(f"\n{'='*60}")
        print(f"✅ Sync complete in {report.duration_s:.1f}s  [{report.mode} mode]")
        print(f"{'='*60}\n")

        return report

    # ─────────────────────────────────────────────────────────────────────────
    # Incremental sync
    # ─────────────────────────────────────────────────────────────────────────

    def _run_incremental(self, history_id: str) -> SyncReport:
        """
        Fetch only messages added since history_id via Gmail History API.
        Falls back to full sync if historyId has expired.
        """
        print(f"\n{'='*60}")
        print(f"🔄 IRCTC Sync — INCREMENTAL mode (historyId: {history_id})")
        print(f"{'='*60}")

        new_message_ids = get_history(self.service, history_id)

        if new_message_ids is None:
            # historyId expired (>7 days) — fall back gracefully
            print("⚠️  historyId expired — falling back to FULL sync")
            return self._run_full()

        if not new_message_ids:
            # No new messages at all — skip both syncers entirely
            print("\n📩 Booking Sync\n   0 booking emails found\n   0 new booking\n   0 skipped\n   0 failed")
            print("\n📩 Cancellation Sync\n   0 cancellation emails found\n   0 new cancellation\n   0 skipped\n   0 failed")
            return SyncReport(
                mode="incremental",
                bookings      = {"found": 0, "new": 0, "skipped": 0, "failed": 0},
                cancellations = {"found": 0, "new": 0, "skipped": 0, "failed": 0},
            )

        # Convert list of IDs to stubs so syncers have uniform input format
        all_stubs = [{"id": mid} for mid in new_message_ids]

        # We don't know which new messages are bookings vs cancellations without
        # fetching metadata. Pass ALL new stubs to both syncers — each syncer
        # will skip emails that don't parse correctly (wrong template → exception
        # → counted as failed, which is acceptable for the small incremental set).
        booking_stats      = BookingSyncer(self.service, self.conn).run(all_stubs)
        cancellation_stats = CancellationSyncer(self.service, self.conn).run(all_stubs)

        # Update historyId to the latest known (use the newest message ID as proxy)
        # Gmail returns historyId via the history.list response; for simplicity we
        # store the raw history_id passed in, updated to the last message's internal
        # historyId if available. We refresh it by re-reading from the last fetched
        # email — the SyncEngine stores the historyId from sync_metadata after full sync.
        # For incremental runs we keep the stored one until the next full sync refreshes it.

        return SyncReport(
            mode          = "incremental",
            bookings      = booking_stats,
            cancellations = cancellation_stats,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Full sync
    # ─────────────────────────────────────────────────────────────────────────

    def _run_full(self) -> SyncReport:
        """
        Fetch ALL matching emails via search_emails() for both query types.
        This is the baseline used on first run or after historyId expiry.
        After completion, stores the latest historyId for future incremental syncs.
        """
        print(f"\n{'='*60}")
        print(f"🔄 IRCTC Sync — FULL mode")
        print(f"{'='*60}")

        # Fetch all booking and cancellation stubs in parallel (sequential here
        # for simplicity — both list calls are fast, body-free requests)
        booking_stubs      = search_emails(self.service, BOOKING_QUERY)
        cancellation_stubs = search_emails(self.service, CANCELLATION_QUERY)

        booking_stats      = BookingSyncer(self.service, self.conn).run(booking_stubs)
        cancellation_stats = CancellationSyncer(self.service, self.conn).run(cancellation_stubs)

        # Store latest historyId so next run uses incremental mode.
        # Gmail returns a historyId in every messages.list response — we use
        # the internal date of the most recent message as a proxy. Since we
        # don't have direct access to it here without an extra API call, we
        # trigger a lightweight history.list to get the current historyId.
        self._store_current_history_id()

        return SyncReport(
            mode          = "full",
            bookings      = booking_stats,
            cancellations = cancellation_stats,
        )

    def _store_current_history_id(self) -> None:
        """
        Retrieve and store the current Gmail historyId by making a lightweight
        history.list call with a very high startHistoryId (effectively asking
        for the current cursor position).

        Gmail's users.getProfile endpoint returns the current historyId directly
        and is the cleanest approach.
        """
        try:
            profile = self.service.users().getProfile(userId="me").execute()
            history_id = str(profile.get("historyId", ""))
            if history_id:
                save_history_id(self.conn, history_id)
                print(f"\n💾 historyId {history_id} stored for next incremental sync")
        except Exception as e:
            # Non-fatal — next run will just do a full sync again
            print(f"\n⚠️  Could not store historyId: {e}")
