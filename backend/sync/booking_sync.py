"""
sync/booking_sync.py

BookingSyncer: processes Gmail booking confirmation emails incrementally.

Algorithm - three deduplication guards + header validation:

    Guard 1 (email_id set, O(1)):
        If this Gmail message ID is already in bookings.email_id -> skip.
        No API call made. Fastest possible path.

    Guard 2 (pnr set, O(1)):
        If this PNR is already in bookings -> email_id backfill + skip.
        Fixes the NULL email_id problem for tickets.json-migrated records.

    Guard 3 (IntegrityError catch):
        Database UNIQUE constraints on pnr and email_id are the final safety net.

Safety Layer:
    Validates that the email is an authentic IRCTC booking email before parsing.
    Returns gracefully if validation fails instead of raising parser exceptions.
"""

import sqlite3

from gmail import (
    get_email,
    extract_headers_dict,
    is_irctc_email,
    is_booking_email,
)
from parsers.html_parser import decode_email, get_soup
from parsers.booking_parser import (
    parse_ticket_details,
    parse_passengers,
    parse_fare,
)
from database.models import (
    insert_booking,
    insert_passengers,
    backfill_email_id,
    get_known_booking_email_ids,
    get_known_booking_pnrs,
    start_sync_log,
    finish_sync_log,
)


class BookingSyncer:
    """
    Processes a list of Gmail message stubs and inserts only new bookings.

    Usage:
        syncer = BookingSyncer(service, conn)
        stats  = syncer.run(message_stubs)
    """

    def __init__(self, service, conn: sqlite3.Connection):
        self.service = service
        self.conn    = conn

    def run(self, message_stubs: list[dict]) -> dict:
        """
        Process every stub in message_stubs.

        Returns:
            {found, new, skipped, failed, backfilled}
        """
        found   = len(message_stubs)
        log_id  = start_sync_log(self.conn, "bookings")

        known_email_ids = get_known_booking_email_ids(self.conn)
        known_pnrs      = get_known_booking_pnrs(self.conn)

        new_count   = 0
        skipped     = 0
        failed      = 0
        backfilled  = 0

        print(f"\nBooking Sync")
        print(f"   {found} booking emails")

        for stub in message_stubs:
            email_id = stub["id"]

            # Guard 1: email_id already in DB
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

                if not is_booking_email(headers):
                    print(f"   SKIP - Non-booking IRCTC email {email_id} skipped")
                    skipped += 1
                    continue

                html = decode_email(raw)
                if not html:
                    print(f"   SKIP - Email {email_id} has no HTML body")
                    skipped += 1
                    continue

                soup   = get_soup(html)
                ticket = parse_ticket_details(soup)
                pnr    = ticket.get("pnr", "").strip()

                if not pnr:
                    print(f"   FAIL - IRCTC Booking PNR extraction failed for {email_id}")
                    failed += 1
                    continue

                # Guard 2: PNR already in DB (email_id was NULL)
                if pnr in known_pnrs:
                    backfill_email_id(self.conn, pnr, email_id)
                    self.conn.commit()
                    known_email_ids.add(email_id)
                    print(f"   BACKFILL - PNR {pnr} (email_id written)")
                    backfilled += 1
                    skipped    += 1
                    continue

                passengers = parse_passengers(soup)
                fare       = parse_fare(soup)

                # Guard 3: DB constraint (final safety net)
                booking_id = insert_booking(self.conn, ticket, fare, email_id)
                insert_passengers(self.conn, booking_id, passengers)
                self.conn.commit()

                known_email_ids.add(email_id)
                known_pnrs.add(pnr)

                print(f"   NEW - PNR {pnr}")
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
            "found":      found,
            "new":        new_count,
            "skipped":    skipped,
            "failed":     failed,
            "backfilled": backfilled,
        }
