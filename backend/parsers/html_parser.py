import base64
from bs4 import BeautifulSoup


def decode_email(email):
    """
    Decode Gmail Base64 email body into HTML.
    """
    data = email["payload"]["body"]["data"]

    html = base64.urlsafe_b64decode(data).decode("utf-8")

    return html


def get_soup(html):
    """
    Convert HTML into BeautifulSoup object.
    """
    return BeautifulSoup(html, "lxml")