import re
from bs4 import BeautifulSoup


def parse_cancellation(soup: BeautifulSoup):
    """
    Extract refund amount from cancellation email.
    """

    text = soup.get_text(" ", strip=True)

    pnr_match = re.search(
        r"PNR\s*Number\s*:\s*(\d+)",
        text,
        re.IGNORECASE
    )

    refund_match = re.search(
        r"refund amount of\s*Rs\.?\s*([\d.]+)",
        text,
        re.IGNORECASE
    )

    return {
        "pnr": pnr_match.group(1) if pnr_match else None,
        "refund_amount": float(refund_match.group(1)) if refund_match else 0.0
    }