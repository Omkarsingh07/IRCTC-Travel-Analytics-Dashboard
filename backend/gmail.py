"""
gmail.py

Gmail API integration layer.

Functions:
    get_gmail_service(creds)              -> Gmail API resource
    search_emails(service, query)         -> list of {id, threadId} stubs (paginated)
    get_email(service, message_id)        -> full email payload (format=full)
    get_email_metadata(service, message_id) -> lightweight headers only (From, Subject)
    get_history(service, history_id)      -> list of new message IDs since history_id
                                           Returns None if historyId is expired/invalid
    is_irctc_email(headers)               -> bool
    is_booking_email(headers)             -> bool
    is_cancellation_email(headers)        -> bool

Constants:
    BOOKING_QUERY      - Gmail search filter for booking confirmation emails
    CANCELLATION_QUERY - Gmail search filter for cancellation emails
"""

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

BOOKING_QUERY      = 'from:ticketadmin@irctc.co.in subject:"Booking Confirmation on IRCTC"'
CANCELLATION_QUERY = 'from:ticketadmin@irctc.co.in subject:"Cancel Ticket"'


def get_gmail_service(creds):
    """Build and return an authenticated Gmail API service resource."""
    return build("gmail", "v1", credentials=creds)


def search_emails(service, query: str) -> list[dict]:
    """
    Return all Gmail message stubs matching the query.
    Handles pagination automatically. Each stub is {id, threadId}.
    Only message IDs are returned - no body content is fetched.
    """
    messages   = []
    page_token = None

    while True:
        response = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=100,
            pageToken=page_token,
        ).execute()

        messages.extend(response.get("messages", []))
        page_token = response.get("nextPageToken")

        if not page_token:
            break

    return messages


def get_email(service, message_id: str) -> dict:
    """
    Fetch the full email payload for a single message.
    This is the expensive call - only invoke for messages confirmed to be IRCTC emails.
    """
    return service.users().messages().get(
        userId="me",
        id=message_id,
        format="full",
    ).execute()


def get_email_metadata(service, message_id: str) -> dict:
    """
    Fetch lightweight metadata for a single message (headers only: From, Subject).
    Avoids downloading full HTML body for non-IRCTC emails.
    """
    return service.users().messages().get(
        userId="me",
        id=message_id,
        format="metadata",
        metadataHeaders=["From", "Subject"],
    ).execute()


def get_history(service, history_id: str) -> list[str] | None:
    """
    Return a list of Gmail message IDs that were ADDED to the mailbox
    since the given historyId.

    Gmail's History API only tracks events for ~7 days. If the historyId
    is older than that, the API returns HTTP 404 with 'historyId too old'.
    In that case, this function returns None to signal that a full sync
    is required.
    """
    message_ids = []
    page_token  = None

    try:
        while True:
            response = service.users().history().list(
                userId="me",
                startHistoryId=history_id,
                historyTypes=["messageAdded"],
                pageToken=page_token,
            ).execute()

            for record in response.get("history", []):
                for msg in record.get("messagesAdded", []):
                    msg_id = msg["message"]["id"]
                    if msg_id not in message_ids:
                        message_ids.append(msg_id)

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return message_ids

    except HttpError as e:
        if e.resp.status == 404:
            # historyId expired (> ~7 days) - caller must fall back to full sync
            return None
        raise


def extract_headers_dict(raw_email_or_metadata: dict) -> dict:
    """Helper to convert payload headers list into a case-insensitive lookup dict."""
    headers_list = raw_email_or_metadata.get("payload", {}).get("headers", [])
    return {h.get("name", ""): h.get("value", "") for h in headers_list}


def is_irctc_email(headers: dict) -> bool:
    """Check if sender contains ticketadmin@irctc.co.in (case-insensitive)."""
    sender = headers.get("From", "").lower()
    return "ticketadmin@irctc.co.in" in sender


def is_booking_email(headers: dict) -> bool:
    """Check if sender is IRCTC and subject relates to booking confirmation."""
    if not is_irctc_email(headers):
        return False
    subject = headers.get("Subject", "").lower()
    return "booking" in subject


def is_cancellation_email(headers: dict) -> bool:
    """Check if sender is IRCTC and subject relates to ticket cancellation."""
    if not is_irctc_email(headers):
        return False
    subject = headers.get("Subject", "").lower()
    return "cancel" in subject