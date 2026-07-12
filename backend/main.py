import os

from auth import authenticate
from gmail import (
    get_gmail_service,
    search_emails,
    BOOKING_QUERY
)

from services.booking_service import (
    generate_tickets,
    calculate_total_spent
)

from services.refund_service import (
    calculate_total_refund
)


def main():

    print("=" * 60)
    print("🚆 IRCTC Travel Analytics")
    print("=" * 60)

    # Gmail Authentication
    print("\n🔐 Connecting to Gmail...")

    creds = authenticate()
    service = get_gmail_service(creds)

    print("✅ Connected Successfully!")

    # Generate tickets.json if it doesn't exist
    if not os.path.exists("tickets.json"):

        print("\n📦 tickets.json not found.")
        print("Generating ticket database from Gmail...\n")

        generate_tickets(service)

        print("\n✅ Ticket database generated successfully!")

    # Booking Summary
    booking_emails = search_emails(service, BOOKING_QUERY)
    total_bookings = len(booking_emails)

    # Ticket Cost
    total_spent = calculate_total_spent()

    # Refund Summary
    cancelled_tickets, total_refund = calculate_total_refund(service)

    # Final Calculations
    completed_trips = total_bookings - cancelled_tickets
    net_spent = total_spent - total_refund

    # Dashboard
    print("\n" + "=" * 60)
    print("📊 IRCTC TRAVEL SUMMARY")
    print("=" * 60)

    print(f"🚆 Total Bookings      : {total_bookings}")
    print(f"❌ Cancelled Tickets   : {cancelled_tickets}")
    print(f"✅ Completed Trips     : {completed_trips}")

    print("-" * 60)

    print(f"💰 Total Ticket Cost   : ₹{total_spent:,.2f}")
    print(f"💸 Total Refund        : ₹{total_refund:,.2f}")
    print(f"🧾 Net Amount Spent    : ₹{net_spent:,.2f}")

    print("=" * 60)
    print("✅ Analysis Completed Successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()