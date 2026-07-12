import re
from bs4 import BeautifulSoup


def get_tables(soup: BeautifulSoup):
    return soup.find_all("table")


def parse_ticket_details(soup: BeautifulSoup):

    tables = get_tables(soup)

    if len(tables) < 2:
        raise Exception("Ticket details table not found.")

    text = tables[1].get_text(" ", strip=True)

    def extract(pattern):
        match = re.search(pattern, text)

        if match:
            return match.group(1).strip()

        return ""

    train = extract(r"Train No\. / Name\s*:\s*(.*?)\s*Quota")

    train_number = ""
    train_name = ""

    if "/" in train:
        train_number, train_name = [
            x.strip() for x in train.split("/", 1)
        ]

    return {

        "pnr": extract(r"PNR No\.\s*:\s*(.*?)\s*Train No"),

        "transaction_id": extract(
            r"Transaction ID\s*:\s*(.*?)\s*Date & Time of Booking"
        ),

        "booking_date": extract(
            r"Date & Time of Booking\s*:\s*(.*?)\s*Class"
        ),

        "train_number": train_number,

        "train_name": train_name,

        "quota": extract(
            r"Quota\s*:\s*(.*?)\s*Transaction ID"
        ),

        "travel_class": extract(
            r"Class\s*:\s*(.*?)\s*From"
        ),

        "from_station": extract(
            r"From\s*:\s*(.*?)\s*Date of Journey"
        ),

        "journey_date": extract(
            r"Date of Journey\s*:\s*(.*?)\s*To"
        ),

        "to_station": extract(
            r"To\s*:\s*(.*?)\s*Boarding At"
        ),

        "boarding_station": extract(
            r"Boarding At\s*:\s*(.*?)\s*Date Of Boarding"
        ),

        "departure": extract(
            r"Scheduled Departure\*\s*:\s*(.*?)\s*Reservation Up to"
        ),

        "arrival": extract(
            r"Scheduled Arrival\s*:\s*(.*?)\s*Adult:"
        ),

        "distance": extract(
            r"Distance\s*:\s*(.*?)\s*Insurance"
        )
    }
def parse_passengers(soup: BeautifulSoup):
    """
    Parse passenger details from Table 3
    """

    tables = soup.find_all("table")

    if len(tables) < 3:
        return []

    passenger_table = tables[2]

    text = passenger_table.get_text(" ", strip=True)

    # Remove header
    text = re.sub(
        r"Sl\.\s*No\.\s*Name\s*Age\s*Gender\s*Catering\s*Service\s*Option\s*Status\s*Coach\s*Seat\s*/\s*Berth\s*/\s*WL\s*No",
        "",
        text,
        flags=re.IGNORECASE
    ).strip()

    pattern = re.compile(
        r"(\d+)\s+"                      # Serial No
        r"(.+?)\s+"                      # Name
        r"(\d+)\s+"                      # Age
        r"(Male|Female|Transgender)\s+"  # Gender
        r"(.*?)\s+"                      # Catering
        r"(CNF|RAC|WL\d*|GNWL\d*|RLWL\d*)\s+"  # Status
        r"([A-Z0-9]+)\s+"                # Coach
        r"([A-Z0-9/-]+)"                 # Seat/Berth
    )

    passengers = []

    for match in pattern.finditer(text):

        passenger = {
            "serial_no": int(match.group(1)),
            "name": match.group(2).strip(),
            "age": int(match.group(3)),
            "gender": match.group(4),
            "catering": match.group(5).strip(),
            "status": match.group(6),
            "coach": match.group(7),
            "seat": match.group(8)
        }

        passengers.append(passenger)

    return passengers

def parse_fare(soup: BeautifulSoup):
    """
    Parse fare details from Table 4
    """

    tables = soup.find_all("table")

    if len(tables) < 4:
        return {
            "ticket_fare": 0.0,
            "convenience_fee": 0.0,
            "wallet_charge": 0.0,
            "insurance": 0.0,
            "total_fare": 0.0
        }

    fare_table = tables[3]

    text = fare_table.get_text(" ", strip=True)

    amounts = [
        float(x.replace(",", ""))
        for x in re.findall(r"Rs\.?\s*([\d,.]+)", text)
    ]

    fare = {
        "ticket_fare": 0.0,
        "convenience_fee": 0.0,
        "wallet_charge": 0.0,
        "insurance": 0.0,
        "total_fare": 0.0
    }

    # Ticket Fare
    if len(amounts) >= 1:
        fare["ticket_fare"] = amounts[0]

    # Convenience Fee
    if len(amounts) >= 2:
        fare["convenience_fee"] = amounts[1]

    # Wallet Charge
    if len(amounts) >= 3:
        fare["wallet_charge"] = amounts[2]

    # Insurance
    if len(amounts) >= 4:
        fare["insurance"] = amounts[3]

    # Total Fare
    if len(amounts) >= 5:
        fare["total_fare"] = amounts[4]

    elif len(amounts) > 0:
        # Fallback: last amount is usually the total
        fare["total_fare"] = amounts[-1]
    if fare["total_fare"] == 0:
        print("\n⚠️ Fare not found")
        print(text)
        print("-" * 80)
    return fare