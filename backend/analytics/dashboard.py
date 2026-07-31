"""
analytics/dashboard.py

All dashboard analytics read exclusively from SQLite.
No Gmail API calls. No file reads. Pure SQL.

Public API:
    get_summary(conn)           → dict  (headline KPIs)
    get_monthly_spend(conn)     → list  (monthly breakdown)
    get_top_routes(conn, n)     → list  (most travelled station pairs)
    get_favorite_trains(conn, n)→ list  (trains booked most often)
"""

import sqlite3


# ─────────────────────────────────────────────────────────────────────────────
# Headline KPIs
# ─────────────────────────────────────────────────────────────────────────────

def get_summary(conn: sqlite3.Connection) -> dict:
    """
    Return the six headline metrics shown on the dashboard.

    total_bookings    = COUNT(*) FROM bookings
    cancelled_tickets = COUNT(*) WHERE status = 'CANCELLED'
    completed_trips   = COUNT(*) WHERE status = 'ACTIVE'
    total_ticket_cost = SUM(total_fare) across ALL bookings
    total_refund      = SUM(refund_amount) across all refunds
    net_amount_spent  = total_ticket_cost - total_refund

    Uses bookings.status (set by CancellationSyncer) for accurate counts
    without requiring a JOIN to the refunds table.
    """
    row = conn.execute(
        """
        SELECT
            COUNT(*)                                              AS total_bookings,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_tickets,
            SUM(CASE WHEN status = 'ACTIVE'    THEN 1 ELSE 0 END) AS completed_trips,
            COALESCE(SUM(total_fare), 0.0)                        AS total_ticket_cost
        FROM bookings
        """
    ).fetchone()

    total_refund = conn.execute(
        "SELECT COALESCE(SUM(refund_amount), 0.0) FROM refunds"
    ).fetchone()[0]

    total_bookings    = row["total_bookings"]    or 0
    cancelled_tickets = row["cancelled_tickets"] or 0
    completed_trips   = row["completed_trips"]   or 0
    total_ticket_cost = row["total_ticket_cost"] or 0.0
    net_amount_spent  = total_ticket_cost - total_refund

    return {
        "total_bookings":    total_bookings,
        "cancelled_tickets": cancelled_tickets,
        "completed_trips":   completed_trips,
        "total_ticket_cost": round(total_ticket_cost, 2),
        "total_refund":      round(total_refund, 2),
        "net_amount_spent":  round(net_amount_spent, 2),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Monthly spend breakdown
# ─────────────────────────────────────────────────────────────────────────────

def get_monthly_spend(conn: sqlite3.Connection) -> list[dict]:
    """
    Return monthly spending aggregated from booking_date.

    booking_date is stored as "11-Jul-2026 11:02:05 am HRS" — SQLite cannot
    natively parse this format. We extract the month/year by splitting on
    the space and using substr pattern matching via LIKE for grouping.

    Returns a list of dicts ordered chronologically:
        [{"month": "Jul-2026", "total": 4823.50, "count": 5}, ...]
    """
    rows = conn.execute(
        """
        SELECT
            -- Extract "Mon-YYYY" from "DD-Mon-YYYY HH:MM:SS ..."
            SUBSTR(booking_date, 4, 8)          AS month,
            COUNT(*)                            AS count,
            ROUND(SUM(total_fare), 2)           AS total
        FROM bookings
        WHERE booking_date IS NOT NULL
          AND booking_date != ''
        GROUP BY SUBSTR(booking_date, 4, 8)
        ORDER BY
            -- Sort by year then month number
            SUBSTR(booking_date, 8, 4),         -- year
            CASE SUBSTR(booking_date, 4, 3)
                WHEN 'Jan' THEN 1  WHEN 'Feb' THEN 2  WHEN 'Mar' THEN 3
                WHEN 'Apr' THEN 4  WHEN 'May' THEN 5  WHEN 'Jun' THEN 6
                WHEN 'Jul' THEN 7  WHEN 'Aug' THEN 8  WHEN 'Sep' THEN 9
                WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
                ELSE 0
            END
        """
    ).fetchall()

    return [
        {
            "month": row["month"].strip(),
            "count": row["count"],
            "total": row["total"],
        }
        for row in rows
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Top routes
# ─────────────────────────────────────────────────────────────────────────────

def get_top_routes(conn: sqlite3.Connection, n: int = 5) -> list[dict]:
    """
    Return the n most frequently travelled station pairs (from → to),
    ordered by booking count descending.

        [{"from_station": "PATNA JN (PNBE)", "to_station": "NEW DELHI (NDLS)", "count": 8}, ...]
    """
    rows = conn.execute(
        """
        SELECT
            from_station,
            to_station,
            COUNT(*) AS count
        FROM bookings
        WHERE from_station != '' AND to_station != ''
        GROUP BY from_station, to_station
        ORDER BY count DESC
        LIMIT ?
        """,
        (n,)
    ).fetchall()

    return [
        {
            "from_station": row["from_station"],
            "to_station":   row["to_station"],
            "count":        row["count"],
        }
        for row in rows
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Favourite trains
# ─────────────────────────────────────────────────────────────────────────────

def get_favorite_trains(conn: sqlite3.Connection, n: int = 5) -> list[dict]:
    """
    Return the n trains booked most often, ordered by booking count descending.

        [{"train_name": "AMRIT BHARAT EXP", "train_number": "22361", "count": 6}, ...]
    """
    rows = conn.execute(
        """
        SELECT
            train_name,
            train_number,
            COUNT(*) AS count
        FROM bookings
        WHERE train_name != '' OR train_number != ''
        GROUP BY train_name, train_number
        ORDER BY count DESC
        LIMIT ?
        """,
        (n,)
    ).fetchall()

    return [
        {
            "train_name":   row["train_name"],
            "train_number": row["train_number"],
            "count":        row["count"],
        }
        for row in rows
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Class distribution
# ─────────────────────────────────────────────────────────────────────────────

def get_class_distribution(conn: sqlite3.Connection) -> list[dict]:
    """
    Return booking counts grouped by travel class.

        [{"travel_class": "SLEEPER CLASS", "count": 40}, ...]
    """
    rows = conn.execute(
        """
        SELECT travel_class, COUNT(*) AS count
        FROM bookings
        WHERE travel_class != ''
        GROUP BY travel_class
        ORDER BY count DESC
        """
    ).fetchall()

    return [
        {"travel_class": row["travel_class"], "count": row["count"]}
        for row in rows
    ]
