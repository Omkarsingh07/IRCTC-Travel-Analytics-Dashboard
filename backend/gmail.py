from googleapiclient.discovery import build

BOOKING_QUERY = 'from:ticketadmin@irctc.co.in subject:"Booking Confirmation on IRCTC"'
CANCELLATION_QUERY = 'from:ticketadmin@irctc.co.in subject:"Cancel Ticket"'


def get_gmail_service(creds):
    return build("gmail", "v1", credentials=creds)


def search_emails(service, query):
    messages = []
    page_token = None

    while True:
        response = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=100,
            pageToken=page_token
        ).execute()

        messages.extend(response.get("messages", []))

        page_token = response.get("nextPageToken")

        if not page_token:
            break

    return messages


def get_email(service, message_id):
    return service.users().messages().get(
        userId="me",
        id=message_id,
        format="full"
    ).execute()