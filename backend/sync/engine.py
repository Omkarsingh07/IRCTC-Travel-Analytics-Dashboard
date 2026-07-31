"""
sync/engine.py

SyncEngine: orchestrates the full incremental sync pipeline.

Sync modes:
    FULL        - fetches ALL matching emails via search_emails().
                  Used when no historyId is stored or historyId has expired (>7 days).

    INCREMENTAL - fetches ONLY messages added since the last sync via get_history().
                  First inspects lightweight headers (From, Subject) to filter out
                  non-IRCTC emails BEFORE fetching full bodies or running parsers.

Flow:
    1. Check sync_metadata for the last gmail_history_id
    2. If found and valid  -> INCREMENTAL mode via get_history()
    3. If missing/expired  -> FULL mode via search_emails()
    4. Filter new message IDs against booking and cancellation criteria via metadata
    5. Run BookingSyncer on verified booking stubs only
    6. Run CancellationSyncer on verified cancellation stubs only
    7. Store the latest historyId for next run
    8. Return a SyncReport with all stats
"""

import time
import sqlite3
from dataclasses import dataclass, field

from gmail import (
    search_emails,
    get_history,
    get_email_metadata,
    extract_headers_dict,
    is_booking_email,
    is_cancellation_email,
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
        print(f"Sync complete in {report.duration_s:.1f}s  [{report.mode} mode]")
        print(f"{'='*60}\n")

        return report

    # ─────────────────────────────────────────────────────────────────────────
    # Incremental sync
    # ─────────────────────────────────────────────────────────────────────────

    def _run_incremental(self, history_id: str) -> SyncReport:
        """
        Fetch only messages added since history_id via Gmail History API.
        Pre-filters messages using lightweight header metadata before calling syncers.
        Falls back to full sync if historyId has expired.
        """
        print(f"\n{'='*60}")
        print(f"IRCTC Sync - INCREMENTAL mode (historyId: {history_id})")
        print(f"{'='*60}")

        new_message_ids = get_history(self.service, history_id)

        if new_message_ids is None:
            print("Warning: historyId expired - falling back to FULL sync")
            return self._run_full()

        total_received = len(new_message_ids)

        if not new_message_ids:
            print("\nIncremental Sync")
            print("   0 Gmail messages received")
            print("   0 IRCTC Booking emails")
            print("   0 IRCTC Cancellation emails")
            print("   0 non-IRCTC emails skipped")
            return SyncReport(
                mode="incremental",
                bookings      = {"found": 0, "new": 0, "skipped": 0, "failed": 0},
                cancellations = {"found": 0, "new": 0, "skipped": 0, "failed": 0},
            )

        booking_stubs      = []
        cancellation_stubs = []
        non_irctc_skipped  = 0

        # Step 1: Lightweight Header Filtering (From, Subject)
        for mid in new_message_ids:
            try:
                meta = get_email_metadata(self.service, mid)
                headers = extract_headers_dict(meta)

                if is_booking_email(headers):
                    booking_stubs.append({"id": mid})
                elif is_cancellation_email(headers):
                    cancellation_stubs.append({"id": mid})
                else:
                    non_irctc_skipped += 1
            except Exception:
                non_irctc_skipped += 1

        print(f"\nIncremental Sync")
        print(f"   {total_received} Gmail messages received")
        print(f"   {len(booking_stubs)} IRCTC Booking emails")
        print(f"   {len(cancellation_stubs)} IRCTC Cancellation emails")
        print(f"   {non_irctc_skipped} non-IRCTC emails skipped")

        # Step 2: Pass only verified stubs to syncers
        booking_stats      = BookingSyncer(self.service, self.conn).run(booking_stubs)
        cancellation_stats = CancellationSyncer(self.service, self.conn).run(cancellation_stubs)

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
        print(f"IRCTC Sync - FULL mode")
        print(f"{'='*60}")

        booking_stubs      = search_emails(self.service, BOOKING_QUERY)
        cancellation_stubs = search_emails(self.service, CANCELLATION_QUERY)

        booking_stats      = BookingSyncer(self.service, self.conn).run(booking_stubs)
        cancellation_stats = CancellationSyncer(self.service, self.conn).run(cancellation_stubs)

        self._store_current_history_id()

        return SyncReport(
            mode          = "full",
            bookings      = booking_stats,
            cancellations = cancellation_stats,
        )

    def _store_current_history_id(self) -> None:
        """
        Retrieve and store current Gmail historyId via users.getProfile endpoint.
        """
        try:
            profile = self.service.users().getProfile(userId="me").execute()
            history_id = str(profile.get("historyId", ""))
            if history_id:
                save_history_id(self.conn, history_id)
                print(f"\nhistoryId {history_id} stored for next incremental sync")
        except Exception as e:
            print(f"\nWarning: Could not store historyId: {e}")
