"""
main.py

CLI entry point for IRCTC Travel Analytics Dashboard.

On every run:
    1. Initialise database (idempotent)
    2. Authenticate Gmail
    3. Run SyncEngine (full or incremental automatically)
    4. Read all analytics from SQLite
    5. Print the dashboard summary
"""

from auth import authenticate
from gmail import get_gmail_service

from database.connection import init_db, get_db
from sync.engine import SyncEngine
from analytics.dashboard import get_summary


def main():
    print("=" * 60)
    print("IRCTC Travel Analytics")
    print("=" * 60)

    # 1. Initialise database (creates tables if not present)
    init_db()

    # 2. Authenticate Gmail
    print("\nConnecting to Gmail...")
    creds   = authenticate()
    service = get_gmail_service(creds)
    print("Connected Successfully!")

    # 3. Sync — full or incremental decided automatically by SyncEngine
    conn = get_db()
    try:
        SyncEngine(service, conn).run()
    finally:
        conn.close()

    # 4. Read analytics from SQLite
    conn = get_db()
    try:
        summary = get_summary(conn)
    finally:
        conn.close()

    # 5. Print dashboard
    print("\n" + "=" * 60)
    print("IRCTC TRAVEL SUMMARY")
    print("=" * 60)

    print(f"Total Bookings      : {summary['total_bookings']}")
    print(f"Cancelled Tickets   : {summary['cancelled_tickets']}")
    print(f"Completed Trips     : {summary['completed_trips']}")

    print("-" * 60)

    print(f"Total Ticket Cost   : ₹{summary['total_ticket_cost']:,.2f}")
    print(f"Total Refund        : ₹{summary['total_refund']:,.2f}")
    print(f"Net Amount Spent    : ₹{summary['net_amount_spent']:,.2f}")

    print("=" * 60)
    print("Analysis Completed Successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()