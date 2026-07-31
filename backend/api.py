"""
api.py

FastAPI application for IRCTC Travel Analytics Dashboard.

Endpoints:
    GET /          — health check
    GET /sync      — trigger Gmail sync, return sync stats only
    GET /summary   — trigger Gmail sync, then return full dashboard analytics
    GET /analytics — extended analytics (monthly spend, top routes, trains)
    GET /bookings  — paginated list of all bookings from SQLite
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from auth import authenticate
from gmail import get_gmail_service

from database.connection import init_db, get_db
from analytics.dashboard import (
    get_summary,
    get_monthly_spend,
    get_top_routes,
    get_favorite_trains,
    get_class_distribution,
)
from sync.engine import SyncEngine


# ─────────────────────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="IRCTC Travel Analytics API",
    version="3.0.0",
    description="Personal IRCTC travel analytics — incremental sync engine.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initialise the database on every server start (idempotent)."""
    init_db()


# ─────────────────────────────────────────────────────────────────────────────
# Internal helper
# ─────────────────────────────────────────────────────────────────────────────

def _run_sync() -> dict:
    """Authenticate Gmail, run SyncEngine, return the report dict."""
    creds   = authenticate()
    service = get_gmail_service(creds)
    conn    = get_db()
    try:
        report = SyncEngine(service, conn).run()
    finally:
        conn.close()
    return report.to_dict()


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "status":  "success",
        "message": "🚆 IRCTC Travel Analytics API v3.0 — Incremental Sync Engine",
    }


@app.get("/sync")
def trigger_sync():
    """
    Manually trigger a Gmail sync (full or incremental depending on historyId).
    Returns sync stats only — no analytics data.
    Use this for a 'Refresh' button in the React UI.
    """
    try:
        return {"status": "success", "sync": _run_sync()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/summary")
def get_dashboard_summary():
    """
    Trigger a Gmail sync, then return all headline dashboard KPIs from SQLite.
    Every dashboard load is always in sync with Gmail.
    """
    try:
        sync_report = _run_sync()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {e}")

    conn = get_db()
    try:
        summary = get_summary(conn)
    finally:
        conn.close()

    return {**summary, "sync": sync_report}


@app.get("/analytics")
def get_analytics(top_n: int = Query(default=5, ge=1, le=20)):
    """
    Return extended analytics from SQLite without triggering a sync.
    Call after /summary has already synced.
    """
    conn = get_db()
    try:
        return {
            "monthly_spend":      get_monthly_spend(conn),
            "top_routes":         get_top_routes(conn, top_n),
            "favorite_trains":    get_favorite_trains(conn, top_n),
            "class_distribution": get_class_distribution(conn),
        }
    finally:
        conn.close()


@app.get("/bookings")
def list_bookings(
    page:     int = Query(default=1,   ge=1),
    per_page: int = Query(default=20,  ge=1, le=100),
    status:   str = Query(default="",  description="Filter by status: ACTIVE or CANCELLED"),
):
    """
    Return a paginated list of all bookings from SQLite.
    Optionally filter by status=ACTIVE or status=CANCELLED.
    """
    offset = (page - 1) * per_page
    where  = "WHERE status = ?" if status.upper() in ("ACTIVE", "CANCELLED") else ""
    params = (status.upper(), per_page, offset) if where else (per_page, offset)

    conn = get_db()
    try:
        total_q = f"SELECT COUNT(*) FROM bookings {where}"
        total   = conn.execute(total_q, (status.upper(),) if where else ()).fetchone()[0]

        rows = conn.execute(
            f"""
            SELECT
                pnr, train_name, train_number, travel_class, quota,
                from_station, to_station, journey_date, booking_date,
                departure, arrival, distance, status,
                ticket_fare, convenience_fee, wallet_charge, insurance, total_fare
            FROM bookings
            {where}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
            """,
            params
        ).fetchall()

        bookings = [dict(row) for row in rows]

    finally:
        conn.close()

    return {
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "pages":    max(1, (total + per_page - 1) // per_page),
        "bookings": bookings,
    }