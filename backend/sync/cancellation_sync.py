"""
sync/cancellation_sync.py

CancellationSyncer: processes Gmail cancellation emails incrementally.

Algorithm - two deduplication guards + header validation:
    Guard 1 (email_id set): skip if email already processed
    Guard 2 (pnr set):      skip if this PNR already has a refund row

Safety Layer:
    Validates that the email is an authentic IRCTC cancellation email before parsing.
    Returns gracefully if validation fails instead of raising parser exceptions.
"""

import sqlite3

from gmail import (
    get_email,
    extract_headers_dict,
    is_irctc_email,
    is_cancellation_email,
)
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
        print(f"   {found} cancellation emails")

        for stub in message_stubs:
            email_id = stub["id"]

            # Guard 1: email already processed
            if email_id in known_email_ids:
                skipped += 1
                continue

            try:
                raw = get_email(self.service, email_id)
                headers = extract_headers_dict(raw)

                # Safety Layer: verify sender and subject before parsing HTML
                if not is_irctc_email(headers):
                    print(f"   SKIP - Non-IRCTC email {email_id} skipped")
                    skipped += 1
                    continue

                if not is_cancellation_email(headers):
                    print(f"   SKIP - Non-cancellation IRCTC email {email_id} skipped")
                    skipped += 1
                    continue

                html = decode_email(raw)
                if not html:
                    print(f"   SKIP - Cancellation email {email_id} has no HTML body")
                    skipped += 1
                    continue

                soup          = get_soup(html)
                data          = parse_cancellation(soup)
                pnr           = (data.get("pnr") or "").strip()
                refund_amount = data.get("refund_amount", 0.0)

                if not pnr:
                    print(f"   FAIL - IRCTC Cancellation PNR extraction failed for {email_id}")
                    failed += 1
                    continue

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

        print(f"   {new_count} new")
        print(f"   {skipped} skipped")
        print(f"   {failed} failed")

        return {
            "found":   found,
            "new":     new_count,
            "skipped": skipped,
            "failed":  failed,
        }
