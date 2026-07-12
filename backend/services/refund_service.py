from gmail import (
    search_emails,
    get_email,
    CANCELLATION_QUERY
)

from parsers.html_parser import (
    decode_email,
    get_soup
)

from parsers.cancellation_parser import (
    parse_cancellation
)


def calculate_total_refund(service):

    cancelled_emails = search_emails(
        service,
        CANCELLATION_QUERY
    )

    total_refund = 0.0

    for email_info in cancelled_emails:

        email = get_email(
            service,
            email_info["id"]
        )

        html = decode_email(email)

        soup = get_soup(html)

        data = parse_cancellation(soup)

        total_refund += data["refund_amount"]

    return len(cancelled_emails), round(total_refund, 2)