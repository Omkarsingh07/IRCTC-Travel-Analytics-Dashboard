import json

from gmail import (
    search_emails,
    get_email,
    BOOKING_QUERY
)

from parsers.html_parser import (
    decode_email,
    get_soup
)

from parsers.booking_parser import (
    parse_ticket_details,
    parse_passengers,
    parse_fare
)


def parse_all_bookings(service):

    booking_emails = search_emails(
        service,
        BOOKING_QUERY
    )

    print(f"\n📩 Found {len(booking_emails)} booking emails\n")

    tickets = []

    for index, message in enumerate(booking_emails, start=1):

        print(f"Parsing {index}/{len(booking_emails)}")

        email = get_email(
            service,
            message["id"]
        )

        html = decode_email(email)

        soup = get_soup(html)

        ticket = parse_ticket_details(soup)

        passengers = parse_passengers(soup)

        fare = parse_fare(soup)

        tickets.append({

            "ticket": ticket,

            "passengers": passengers,

            "fare": fare

        })

    return tickets

import json


def load_tickets():

    with open("tickets.json", "r", encoding="utf-8") as file:
        return json.load(file)


def calculate_total_spent():

    tickets = load_tickets()

    total = sum(
        ticket["fare"]["total_fare"]
        for ticket in tickets
    )

    return round(total, 2)

def save_tickets(tickets):

    with open(
        "tickets.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            tickets,
            file,
            indent=4,
            ensure_ascii=False
        )
def generate_tickets(service):

    tickets = parse_all_bookings(service)

    save_tickets(tickets)

    return tickets
    print("\n✅ tickets.json created successfully!")