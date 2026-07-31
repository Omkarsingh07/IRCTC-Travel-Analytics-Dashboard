"""
services/booking_service.py  — DEPRECATED

This module has been superseded by sync/booking_sync.py.

The sync logic now lives in:
    sync/booking_sync.py    → BookingSyncer
    sync/engine.py          → SyncEngine (orchestrator)

This file is kept as a compatibility shim. Delete it once you have
confirmed that nothing else imports from services.booking_service.
"""
from sync.booking_sync import BookingSyncer  # noqa: F401 — re-export for backward compat


def sync_bookings(service, conn):
    """Deprecated. Use SyncEngine instead."""
    from gmail import search_emails, BOOKING_QUERY
    stubs = search_emails(service, BOOKING_QUERY)
    return BookingSyncer(service, conn).run(stubs)