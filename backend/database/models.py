"""
database/models.py

Contains:
  1. CREATE_TABLES_SQL  — all DDL (used for fresh database init)
  2. Insert helpers     — insert_booking(), insert_passengers(), insert_refund()
  3. Update helpers     — update_booking_status(), backfill_email_id()
  4. Query helpers      — pnr_exists(), get_known_booking_email_ids(),
                          get_known_refund_email_ids(), get_known_refund_pnrs(),
                          get_known_booking_pnrs()
  5. Sync metadata      — start_sync_log(), finish_sync_log(),
                          get_last_history_id(), save_history_id()

All functions accept a sqlite3.Connection as their first argument.
Transaction management (commit/rollback) is the caller's responsibility.
"""

import sqlite3
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


# ─────────────────────────────────────────────────────────────────────────────
# DDL  (used by connection.init_db() on a fresh database only)
# ─────────────────────────────────────────────────────────────────────────────

CREATE_TABLES_SQL = """
-- bookings: one row per booking confirmation email
CREATE TABLE IF NOT EXISTS bookings (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    pnr              TEXT    NOT NULL UNIQUE,
    transaction_id   TEXT,
    booking_date     TEXT,
    journey_date     TEXT,
    train_number     TEXT,
    train_name       TEXT,
    quota            TEXT,
    travel_class     TEXT,
    from_station     TEXT,
    to_station       TEXT,
    boarding_station TEXT,
    departure        TEXT,
    arrival          TEXT,
    distance         TEXT,
    ticket_fare      REAL    NOT NULL DEFAULT 0.0,
    convenience_fee  REAL    NOT NULL DEFAULT 0.0,
    wallet_charge    REAL    NOT NULL DEFAULT 0.0,
    insurance        REAL    NOT NULL DEFAULT 0.0,
    total_fare       REAL    NOT NULL DEFAULT 0.0,
    status           TEXT    NOT NULL DEFAULT 'ACTIVE',
    email_id         TEXT    UNIQUE,
    created_at       TEXT,
    updated_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_pnr          ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_bookings_journey_date ON bookings(journey_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_email_id     ON bookings(email_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);

-- passengers: one row per passenger per booking
CREATE TABLE IF NOT EXISTS passengers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    serial_no   INTEGER,
    name        TEXT,
    age         INTEGER,
    gender      TEXT,
    catering    TEXT,
    status      TEXT,
    coach       TEXT,
    seat        TEXT
);

CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON passengers(booking_id);

-- refunds: one row per cancellation email
-- pnr UNIQUE ensures one refund per booking regardless of how many
-- cancellation emails Gmail contains
CREATE TABLE IF NOT EXISTS refunds (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    pnr           TEXT    NOT NULL UNIQUE,
    refund_amount REAL    NOT NULL DEFAULT 0.0,
    email_id      TEXT    UNIQUE,
    created_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_refunds_pnr      ON refunds(pnr);
CREATE INDEX IF NOT EXISTS idx_refunds_email_id ON refunds(email_id);

-- sync_metadata: diagnostic log of every sync run
CREATE TABLE IF NOT EXISTS sync_metadata (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type        TEXT    NOT NULL,
    started_at       TEXT    NOT NULL,
    completed_at     TEXT,
    emails_found     INTEGER NOT NULL DEFAULT 0,
    emails_new       INTEGER NOT NULL DEFAULT 0,
    emails_skipped   INTEGER NOT NULL DEFAULT 0,
    emails_failed    INTEGER NOT NULL DEFAULT 0,
    status           TEXT    NOT NULL DEFAULT 'running',
    gmail_history_id TEXT
);
"""


# ─────────────────────────────────────────────────────────────────────────────
# Insert helpers
# ─────────────────────────────────────────────────────────────────────────────

def insert_booking(
    conn: sqlite3.Connection,
    ticket: dict,
    fare: dict,
    email_id: str | None,
) -> int:
    """
    Insert a single booking row. Returns the new row's id.
    Raises sqlite3.IntegrityError if pnr or email_id already exists.
    """
    now = _now()
    cursor = conn.execute(
        """
        INSERT INTO bookings (
            pnr, transaction_id, booking_date, journey_date,
            train_number, train_name, quota, travel_class,
            from_station, to_station, boarding_station,
            departure, arrival, distance,
            ticket_fare, convenience_fee, wallet_charge, insurance, total_fare,
            status, email_id, created_at, updated_at
        ) VALUES (
            :pnr, :transaction_id, :booking_date, :journey_date,
            :train_number, :train_name, :quota, :travel_class,
            :from_station, :to_station, :boarding_station,
            :departure, :arrival, :distance,
            :ticket_fare, :convenience_fee, :wallet_charge, :insurance, :total_fare,
            'ACTIVE', :email_id, :created_at, :updated_at
        )
        """,
        {
            "pnr":              ticket.get("pnr", ""),
            "transaction_id":   ticket.get("transaction_id", ""),
            "booking_date":     ticket.get("booking_date", ""),
            "journey_date":     ticket.get("journey_date", ""),
            "train_number":     ticket.get("train_number", ""),
            "train_name":       ticket.get("train_name", ""),
            "quota":            ticket.get("quota", ""),
            "travel_class":     ticket.get("travel_class", ""),
            "from_station":     ticket.get("from_station", ""),
            "to_station":       ticket.get("to_station", ""),
            "boarding_station": ticket.get("boarding_station", ""),
            "departure":        ticket.get("departure", ""),
            "arrival":          ticket.get("arrival", ""),
            "distance":         ticket.get("distance", ""),
            "ticket_fare":      fare.get("ticket_fare", 0.0),
            "convenience_fee":  fare.get("convenience_fee", 0.0),
            "wallet_charge":    fare.get("wallet_charge", 0.0),
            "insurance":        fare.get("insurance", 0.0),
            "total_fare":       fare.get("total_fare", 0.0),
            "email_id":         email_id,
            "created_at":       now,
            "updated_at":       now,
        }
    )
    return cursor.lastrowid


def insert_passengers(
    conn: sqlite3.Connection,
    booking_id: int,
    passengers: list[dict],
) -> None:
    """
    Bulk-insert all passengers for a given booking_id.
    Silently skips if passengers list is empty.
    """
    if not passengers:
        return

    conn.executemany(
        """
        INSERT INTO passengers
            (booking_id, serial_no, name, age, gender, catering, status, coach, seat)
        VALUES
            (:booking_id, :serial_no, :name, :age, :gender, :catering, :status, :coach, :seat)
        """,
        [
            {
                "booking_id": booking_id,
                "serial_no":  p.get("serial_no"),
                "name":       p.get("name", ""),
                "age":        p.get("age"),
                "gender":     p.get("gender", ""),
                "catering":   p.get("catering", ""),
                "status":     p.get("status", ""),
                "coach":      p.get("coach", ""),
                "seat":       p.get("seat", ""),
            }
            for p in passengers
        ]
    )


def insert_refund(
    conn: sqlite3.Connection,
    pnr: str,
    refund_amount: float,
    email_id: str,
) -> int:
    """
    Insert a refund row. Returns the new row id.
    Raises sqlite3.IntegrityError if pnr or email_id already exists.
    """
    cursor = conn.execute(
        """
        INSERT INTO refunds (pnr, refund_amount, email_id, created_at)
        VALUES (:pnr, :refund_amount, :email_id, :created_at)
        """,
        {
            "pnr":           pnr or "",
            "refund_amount": refund_amount,
            "email_id":      email_id,
            "created_at":    _now(),
        }
    )
    return cursor.lastrowid


# ─────────────────────────────────────────────────────────────────────────────
# Update helpers
# ─────────────────────────────────────────────────────────────────────────────

def update_booking_status(
    conn: sqlite3.Connection,
    pnr: str,
    status: str,
) -> None:
    """
    Update bookings.status for the given PNR.
    status must be 'ACTIVE' or 'CANCELLED'.
    No-op if the PNR does not exist in bookings.
    """
    conn.execute(
        """
        UPDATE bookings
        SET status = ?, updated_at = ?
        WHERE pnr = ?
        """,
        (status, _now(), pnr)
    )


def backfill_email_id(
    conn: sqlite3.Connection,
    pnr: str,
    email_id: str,
) -> None:
    """
    Write a real Gmail message ID back into a booking row that was migrated
    from tickets.json with email_id = NULL.

    This is the fix for the NULL email_id performance problem:
    after this backfill, subsequent syncs will skip this email at Guard 1
    (before calling get_email()) instead of wasting an API call.
    """
    conn.execute(
        """
        UPDATE bookings
        SET email_id = ?, updated_at = ?
        WHERE pnr = ? AND email_id IS NULL
        """,
        (email_id, _now(), pnr)
    )


# ─────────────────────────────────────────────────────────────────────────────
# Query helpers — loaded once per sync for O(1) in-loop lookups
# ─────────────────────────────────────────────────────────────────────────────

def pnr_exists(conn: sqlite3.Connection, pnr: str) -> bool:
    """Return True if this PNR already has a row in bookings."""
    row = conn.execute(
        "SELECT 1 FROM bookings WHERE pnr = ? LIMIT 1", (pnr,)
    ).fetchone()
    return row is not None


def get_known_booking_email_ids(conn: sqlite3.Connection) -> set[str]:
    """
    Return a set of all non-NULL email_ids in bookings.
    Used for Guard 1 — skip before any get_email() call.
    """
    rows = conn.execute(
        "SELECT email_id FROM bookings WHERE email_id IS NOT NULL"
    ).fetchall()
    return {row["email_id"] for row in rows}


def get_known_booking_pnrs(conn: sqlite3.Connection) -> set[str]:
    """
    Return a set of ALL PNRs in bookings (including those with NULL email_id).
    Used for Guard 2 — catch rows migrated from tickets.json.
    """
    rows = conn.execute("SELECT pnr FROM bookings").fetchall()
    return {row["pnr"] for row in rows}


def get_known_refund_email_ids(conn: sqlite3.Connection) -> set[str]:
    """Return a set of all non-NULL email_ids in refunds (Guard 1 for cancellations)."""
    rows = conn.execute(
        "SELECT email_id FROM refunds WHERE email_id IS NOT NULL"
    ).fetchall()
    return {row["email_id"] for row in rows}


def get_known_refund_pnrs(conn: sqlite3.Connection) -> set[str]:
    """Return a set of all PNRs in refunds (Guard 2 for cancellations)."""
    rows = conn.execute("SELECT pnr FROM refunds").fetchall()
    return {row["pnr"] for row in rows}


# ─────────────────────────────────────────────────────────────────────────────
# Sync metadata helpers
# ─────────────────────────────────────────────────────────────────────────────

def start_sync_log(conn: sqlite3.Connection, sync_type: str) -> int:
    """
    Insert a sync_metadata row with status='running'.
    Returns the row id so we can update it when done.
    sync_type: 'full' | 'incremental'
    """
    cursor = conn.execute(
        "INSERT INTO sync_metadata (sync_type, started_at, status) VALUES (?, ?, 'running')",
        (sync_type, _now())
    )
    conn.commit()
    return cursor.lastrowid


def finish_sync_log(
    conn: sqlite3.Connection,
    log_id: int,
    emails_found: int,
    emails_new: int,
    emails_skipped: int,
    emails_failed: int,
    gmail_history_id: str | None = None,
) -> None:
    """Update the sync_metadata row when a sync run completes."""
    status = "success" if emails_failed == 0 else "partial"
    conn.execute(
        """
        UPDATE sync_metadata
        SET completed_at     = ?,
            emails_found     = ?,
            emails_new       = ?,
            emails_skipped   = ?,
            emails_failed    = ?,
            status           = ?,
            gmail_history_id = ?
        WHERE id = ?
        """,
        (_now(), emails_found, emails_new, emails_skipped, emails_failed,
         status, gmail_history_id, log_id)
    )
    conn.commit()


def get_last_history_id(conn: sqlite3.Connection) -> str | None:
    """
    Return the gmail_history_id from the most recent successful sync run,
    or None if no successful sync exists yet.
    """
    row = conn.execute(
        """
        SELECT gmail_history_id
        FROM sync_metadata
        WHERE status IN ('success', 'partial')
          AND gmail_history_id IS NOT NULL
        ORDER BY id DESC
        LIMIT 1
        """
    ).fetchone()
    return row["gmail_history_id"] if row else None


def save_history_id(conn: sqlite3.Connection, history_id: str) -> None:
    """
    Persist the latest Gmail historyId in the most recent sync_metadata row.
    Called by SyncEngine after a successful full sync to enable incremental
    syncs on subsequent runs.
    """
    conn.execute(
        """
        UPDATE sync_metadata
        SET gmail_history_id = ?
        WHERE id = (SELECT MAX(id) FROM sync_metadata)
        """,
        (history_id,)
    )
    conn.commit()
