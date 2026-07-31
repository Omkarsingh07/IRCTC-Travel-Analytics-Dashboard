"""
parsers/booking_parser.py

Parses IRCTC booking confirmation email HTML into structured Python dicts.

Three public functions — all accept a BeautifulSoup object:
    parse_ticket_details(soup) → dict   (PNR, train, route, dates, ...)
    parse_passengers(soup)     → list   (one dict per passenger)
    parse_fare(soup)           → dict   (ticket_fare, convenience_fee, ...)

The HTML is a table-based layout:
    Table 0 — header / banner
    Table 1 — ticket details (PNR, train, route)
    Table 2 — passenger details
    Table 3 — fare breakdown
"""

import re
from bs4 import BeautifulSoup


# ─────────────────────────────────────────────────────────────────────────────
# Internal helper
# ─────────────────────────────────────────────────────────────────────────────

def _get_tables(soup: BeautifulSoup) -> list:
    return soup.find_all("table")


# ─────────────────────────────────────────────────────────────────────────────
# Ticket details — Table 1
# ─────────────────────────────────────────────────────────────────────────────

def parse_ticket_details(soup: BeautifulSoup) -> dict:
    """
    Extract PNR, train, route, dates and distance from the ticket details table.
    Raises Exception if the table is not present (caller must catch this).
    """
    tables = _get_tables(soup)

    if len(tables) < 2:
        raise Exception("Ticket details table not found (expected at least 2 tables).")

    text = tables[1].get_text(" ", strip=True)

    def extract(pattern: str) -> str:
        match = re.search(pattern, text)
        return match.group(1).strip() if match else ""

    # Train No. / Name is a combined field — split on first "/"
    train     = extract(r"Train No\. / Name\s*:\s*(.*?)\s*Quota")
    train_number = ""
    train_name   = ""

    if "/" in train:
        train_number, train_name = [x.strip() for x in train.split("/", 1)]

    return {
        "pnr":              extract(r"PNR No\.\s*:\s*(.*?)\s*Train No"),
        "transaction_id":   extract(r"Transaction ID\s*:\s*(.*?)\s*Date & Time of Booking"),
        "booking_date":     extract(r"Date & Time of Booking\s*:\s*(.*?)\s*Class"),
        "train_number":     train_number,
        "train_name":       train_name,
        "quota":            extract(r"Quota\s*:\s*(.*?)\s*Transaction ID"),
        "travel_class":     extract(r"Class\s*:\s*(.*?)\s*From"),
        "from_station":     extract(r"From\s*:\s*(.*?)\s*Date of Journey"),
        "journey_date":     extract(r"Date of Journey\s*:\s*(.*?)\s*To"),
        "to_station":       extract(r"To\s*:\s*(.*?)\s*Boarding At"),
        "boarding_station": extract(r"Boarding At\s*:\s*(.*?)\s*Date Of Boarding"),
        "departure":        extract(r"Scheduled Departure\*\s*:\s*(.*?)\s*Reservation Up to"),
        "arrival":          extract(r"Scheduled Arrival\s*:\s*(.*?)\s*Adult:"),
        "distance":         extract(r"Distance\s*:\s*(.*?)\s*Insurance"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Passenger details — Table 2
# ─────────────────────────────────────────────────────────────────────────────

# Extended status set covering all known IRCTC booking statuses:
#   CNF  — Confirmed
#   RAC  — Reservation Against Cancellation
#   WL   — General Waitlist
#   GNWL — General Waitlist (explicit prefix)
#   RLWL — Remote Location Waitlist
#   PQWL — Premium Quota Waitlist
#   TQWL — Tatkal Quota Waitlist
#   RSWL — Roadside Window Lower
#   REGRET — No accommodation possible
#   CAN  — Cancelled after chart preparation
_PASSENGER_PATTERN = re.compile(
    r"(\d+)\s+"                                                         # Sl. No.
    r"(.+?)\s+"                                                         # Name
    r"(\d+)\s+"                                                         # Age
    r"(Male|Female|Transgender)\s+"                                     # Gender
    r"(.*?)\s+"                                                         # Catering
    r"(CNF|RAC|WL\d*|GNWL\d*|RLWL\d*|PQWL\d*|TQWL\d*|RSWL\d*|REGRET|CAN)\s+"  # Status
    r"([A-Z0-9]+)\s+"                                                   # Coach
    r"([A-Z0-9/-]+)"                                                    # Seat/Berth
)

_HEADER_PATTERN = re.compile(
    r"Sl\.\s*No\.\s*Name\s*Age\s*Gender\s*Catering\s*Service\s*Option\s*"
    r"Status\s*Coach\s*Seat\s*/\s*Berth\s*/\s*WL\s*No",
    re.IGNORECASE
)


def parse_passengers(soup: BeautifulSoup) -> list[dict]:
    """
    Extract passenger rows from the passenger details table (Table 2).
    Returns an empty list if the table is missing or no rows match.
    """
    tables = _get_tables(soup)

    if len(tables) < 3:
        return []

    text = tables[2].get_text(" ", strip=True)

    # Strip the header row so it does not interfere with matching
    text = _HEADER_PATTERN.sub("", text).strip()

    passengers = []

    for match in _PASSENGER_PATTERN.finditer(text):
        passengers.append({
            "serial_no": int(match.group(1)),
            "name":      match.group(2).strip(),
            "age":       int(match.group(3)),
            "gender":    match.group(4),
            "catering":  match.group(5).strip(),
            "status":    match.group(6),
            "coach":     match.group(7),
            "seat":      match.group(8),
        })

    return passengers


# ─────────────────────────────────────────────────────────────────────────────
# Fare details — Table 3
# ─────────────────────────────────────────────────────────────────────────────

_FARE_DEFAULTS = {
    "ticket_fare":    0.0,
    "convenience_fee": 0.0,
    "wallet_charge":  0.0,
    "insurance":      0.0,
    "total_fare":     0.0,
}


def parse_fare(soup: BeautifulSoup) -> dict:
    """
    Extract fare breakdown from the fare details table (Table 3).

    Columns: Ticket Fare | Convenience Fee | eWallet Charge | Insurance | Total Fare

    Returns a dict with all five values. Falls back to the last detected
    amount as total_fare if fewer than 5 amounts are found. Warns to
    stdout if total_fare is 0 (indicates a parsing issue).
    """
    tables = _get_tables(soup)

    if len(tables) < 4:
        return dict(_FARE_DEFAULTS)

    text = tables[3].get_text(" ", strip=True)

    amounts = [
        float(x.replace(",", ""))
        for x in re.findall(r"Rs\.?\s*([\d,.]+)", text)
    ]

    fare = dict(_FARE_DEFAULTS)

    if len(amounts) >= 1: fare["ticket_fare"]    = amounts[0]
    if len(amounts) >= 2: fare["convenience_fee"] = amounts[1]
    if len(amounts) >= 3: fare["wallet_charge"]   = amounts[2]
    if len(amounts) >= 4: fare["insurance"]       = amounts[3]

    if len(amounts) >= 5:
        fare["total_fare"] = amounts[4]
    elif amounts:
        # Fallback: last detected amount is typically the total
        fare["total_fare"] = amounts[-1]

    if fare["total_fare"] == 0:
        print("Warning: Fare not found - raw fare table text:")
        print(text)
        print("-" * 80)

    return fare