"""
sync/cancellation_sync.py

CancellationSyncer: processes Gmail cancellation emails incrementally.

For each new cancellation email:
  1. Parse PNR and refund amount
  2. Insert refund record
  3. Update corresponding booking status to 'CANCELLED'

Two deduplication guards:
    Guard 1 (email_id set): skip if email already processed
    Guard 2 (pnr set):      skip if this PNR already has a refund row
"""

import sqlite3

from gmail import get_email
from parsers.html_parser import decode_email, get_soup
from parsers.cancellation_parser import parse_cancellation
from database.models import (
    insert_refund,
    update_booking_status,
    get_known_refund_email_ids,
    get_known_refund_pnrs,
    start_sync_log,
    finish_sync_log,
)


class CancellationSyncer:
    """
    Processes a list of Gmail message stubs and inserts only new refunds,
    then updates the corresponding booking status to 'CANCELLED'.

    Usage:
        syncer = CancellationSyncer(service, conn)
        stats  = syncer.run(message_stubs)
    """

    def __init__(self, service, conn: sqlite3.Connection):
        self.service = service
        self.conn    = conn

    def run(self, message_stubs: list[dict]) -> dict:
        """
        Process every cancellation stub.

        Returns:
            {found, new, skipped, failed}
        """
        found  = len(message_stubs)
        log_id = start_sync_log(self.conn, "cancellations")

        known_email_ids = get_known_refund_email_ids(self.conn)
        known_pnrs      = get_known_refund_pnrs(self.conn)

        new_count = 0
        skipped   = 0
        failed    = 0

        print(f"\nCancellation Sync")
        print(f"   {found} cancellation emails found")

        for stub in message_stubs:
            email_id = stub["id"]

            # Guard 1: email already processed
            if email_id in known_email_ids:
                skipped += 1
                continue

            try:
                raw  = get_email(self.service, email_id)
                html = decode_email(raw)

                if not html:
                    raise ValueError("No HTML body found in cancellation email")

                soup          = get_soup(html)
                data          = parse_cancellation(soup)
                pnr           = (data.get("pnr") or "").strip()
                refund_amount = data.get("refund_amount", 0.0)

                if not pnr:
                    raise ValueError("PNR empty in cancellation email")

                # Guard 2: PNR already has a refund row
                if pnr in known_pnrs:
                    skipped += 1
                    continue

                # Insert refund + update booking status atomically
                insert_refund(self.conn, pnr, refund_amount, email_id)
                update_booking_status(self.conn, pnr, "CANCELLED")
                self.conn.commit()

                known_email_ids.add(email_id)
                known_pnrs.add(pnr)

                print(f"   NEW - PNR {pnr} | Refund ₹{refund_amount:,.2f}")
                new_count += 1

            except sqlite3.IntegrityError as e:
                self.conn.rollback()
                print(f"   SKIP - IntegrityError {email_id}: {e}")
                skipped += 1

            except Exception as e:
                self.conn.rollback()
                print(f"   FAIL - {email_id}: {e}")
                failed += 1

        finish_sync_log(
            self.conn, log_id, found, new_count, skipped, failed
        )

        print(f"   {new_count} new cancellation")
        print(f"   {skipped} skipped")
        print(f"   {failed} failed")

        return {
            "found":   found,
            "new":     new_count,
            "skipped": skipped,
            "failed":  failed,
        }
