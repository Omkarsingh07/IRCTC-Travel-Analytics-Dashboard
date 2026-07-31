"""
services/refund_service.py  — DEPRECATED

This module has been superseded by sync/cancellation_sync.py.

The sync logic now lives in:
    sync/cancellation_sync.py → CancellationSyncer
    sync/engine.py            → SyncEngine (orchestrator)

This file is kept as a compatibility shim. Delete it once you have
confirmed that nothing else imports from services.refund_service.
"""
from sync.cancellation_sync import CancellationSyncer  # noqa: F401


def sync_refunds(service, conn):
    """Deprecated. Use SyncEngine instead."""
    from gmail import search_emails, CANCELLATION_QUERY
    stubs = search_emails(service, CANCELLATION_QUERY)
    return CancellationSyncer(service, conn).run(stubs)