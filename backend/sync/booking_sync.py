"""
sync/booking_sync.py

BookingSyncer: processes Gmail booking confirmation emails incrementally.

Algorithm - three deduplication guards:

    Guard 1 (email_id set, O(1)):
        If this Gmail message ID is already in bookings.email_id -> skip.
        No API call made. Fastest possible path.

    Guard 2 (pnr set, O(1)):
        If this PNR is already in bookings -> email_id backfill + skip.
        Fixes the NULL email_id problem for tickets.json-migrated records.
        After backfill, this booking will be caught by Guard 1 on all future syncs.

    Guard 3 (IntegrityError catch):
        Database UNIQUE constraints on pnr and email_id are the final safety net.
        Even if Guards 1 & 2 somehow miss, the DB will reject the duplicate INSERT.

Only new emails (those that pass all three guards) trigger a get_email() API call.
"""

import sqlite3

from gmail import get_email, BOOKING_QUERY, search_emails
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

        # Load lookup sets once - O(1) per email in the loop
        known_email_ids = get_known_booking_email_ids(self.conn)
        known_pnrs      = get_known_booking_pnrs(self.conn)

        new_count   = 0
        skipped     = 0
        failed      = 0
        backfilled  = 0

        print(f"\n{'='*60}")
        print(f"Booking Sync")
        print(f"   {found} booking emails found")

        for stub in message_stubs:
            email_id = stub["id"]

            # Guard 1: email_id already in DB
            if email_id in known_email_ids:
                skipped += 1
                continue

            # Unknown email_id - fetch full body from Gmail
            try:
                raw  = get_email(self.service, email_id)
                html = decode_email(raw)

                if not html:
                    raise ValueError("No HTML body found (multipart with no text/html part)")

                soup   = get_soup(html)
                ticket = parse_ticket_details(soup)
                pnr    = ticket.get("pnr", "").strip()

                if not pnr:
                    raise ValueError("PNR is empty - email HTML structure may have changed")

                # Guard 2: PNR already in DB (email_id was NULL)
                if pnr in known_pnrs:
                    # Backfill the real email_id into the existing row so
                    # this email is caught by Guard 1 on all future syncs.
                    backfill_email_id(self.conn, pnr, email_id)
                    self.conn.commit()
                    known_email_ids.add(email_id)   # update in-memory set
                    print(f"   BACKFILL - PNR {pnr} (email_id written)")
                    backfilled += 1
                    skipped    += 1
                    continue

                # New booking - parse remaining fields
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

        print(f"   {new_count} new booking")
        print(f"   {skipped} skipped  ({backfilled} email_id backfilled)")
        print(f"   {failed} failed")

        return {
            "found":      found,
            "new":        new_count,
            "skipped":    skipped,
            "failed":     failed,
            "backfilled": backfilled,
        }
