"""
parsers/html_parser.py

Utilities for decoding Gmail email payloads into HTML and BeautifulSoup objects.

decode_email() handles both flat text/html payloads AND multipart MIME
structures (multipart/alternative, multipart/mixed) by recursively searching
for the first text/html part.
"""

import base64
from bs4 import BeautifulSoup


def decode_email(email: dict) -> str:
    """
    Decode a Gmail API email payload into an HTML string.

    Handles two payload structures:
      1. Flat:      payload.mimeType = "text/html", body.data = "<base64>"
      2. Multipart: payload.mimeType = "multipart/alternative|mixed",
                    payload.parts = [{mimeType: "text/html", body.data: ...}, ...]

    Returns the decoded HTML string, or an empty string if no HTML part found.
    """
    def _find_html(payload: dict) -> str:
        mime = payload.get("mimeType", "")
        body_data = payload.get("body", {}).get("data", "")

        # Direct text/html part with data
        if mime == "text/html" and body_data:
            return base64.urlsafe_b64decode(body_data).decode("utf-8")

        # Recurse into multipart children
        for part in payload.get("parts", []):
            result = _find_html(part)
            if result:
                return result

        return ""

    return _find_html(email.get("payload", {}))


def get_soup(html: str) -> BeautifulSoup:
    """
    Convert an HTML string into a BeautifulSoup object.
    Uses lxml parser for speed and robustness.
    """
    return BeautifulSoup(html, "lxml")