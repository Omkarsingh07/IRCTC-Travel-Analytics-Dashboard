"""
migrate_json_to_sqlite.py

One-time migration utility.

Reads the existing tickets.json and bulk-inserts all records into
the new SQLite database (irctc.db).

Usage:
    cd backend/
    python migrate_json_to_sqlite.py

Safe to run multiple times — duplicate PNRs and email_ids are skipped.
Delete this file after the migration is confirmed successful.
"""

import json
import os
import sys
import sqlite3

# Ensure backend/ is on the path so database imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import init_db, get_db
from database.models import (
    insert_booking,
    insert_passengers,
    pnr_exists,
)

# Path to tickets.json — resolved relative to this script
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TICKETS_JSON = os.path.join(_BASE_DIR, "tickets.json")


def migrate() -> None:
    print("=" * 60)
    print("📦 IRCTC tickets.json → SQLite Migration")
    print("=" * 60)

    # 1. Verify source file exists
    if not os.path.exists(TICKETS_JSON):
        print(f"❌ tickets.json not found at: {TICKETS_JSON}")
        print("   Nothing to migrate.")
        return

    # 2. Initialise database (creates tables if they don't exist)
    init_db()

    # 3. Load JSON
    with open(TICKETS_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"\n📄 Found {len(records)} records in tickets.json\n")

    inserted = 0
    skipped  = 0
    failed   = 0

    conn = get_db()

    try:
        for i, record in enumerate(records, start=1):
            ticket     = record.get("ticket", {})
            passengers = record.get("passengers", [])
            fare       = record.get("fare", {})

            pnr = ticket.get("pnr", "").strip()

            if not pnr:
                print(f"  [{i:>3}] ⚠️  SKIP — PNR is empty")
                skipped += 1
                continue

            if pnr_exists(conn, pnr):
                print(f"  [{i:>3}] ⏭️  SKIP — PNR {pnr} already in database")
                skipped += 1
                continue

            try:
                # email_id is not stored in tickets.json (it was never saved).
                # We use None here; the sync process will fill it in when it
                # processes the corresponding Gmail email (via the PNR guard).
                booking_id = insert_booking(
                    conn,
                    ticket=ticket,
                    fare=fare,
                    email_id=None,       # unknown — set by sync later
                )
                insert_passengers(conn, booking_id, passengers)
                conn.commit()

                print(f"  [{i:>3}] ✅ INSERT — PNR {pnr}")
                inserted += 1

            except sqlite3.IntegrityError as e:
                conn.rollback()
                print(f"  [{i:>3}] ⚠️  SKIP — Integrity error for PNR {pnr}: {e}")
                skipped += 1

            except Exception as e:
                conn.rollback()
                print(f"  [{i:>3}] ❌ FAIL  — PNR {pnr}: {e}")
                failed += 1

    finally:
        conn.close()

    # Summary
    print()
    print("=" * 60)
    print("📊 Migration Complete")
    print("=" * 60)
    print(f"  ✅ Inserted : {inserted}")
    print(f"  ⏭️  Skipped  : {skipped}")
    print(f"  ❌ Failed   : {failed}")
    print("=" * 60)

    if failed == 0:
        print("\n✅ Migration successful! You can now run the application.")
        print("   tickets.json is no longer used but kept as a backup.")
    else:
        print(f"\n⚠️  {failed} records failed. Review the output above.")


if __name__ == "__main__":
    migrate()
