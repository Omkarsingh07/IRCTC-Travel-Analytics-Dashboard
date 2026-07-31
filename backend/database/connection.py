"""
database/connection.py

Manages the SQLite connection lifecycle and database initialisation.

- DB file is always resolved relative to this file's directory,
  so it works regardless of the CWD from which the app is launched.
- Call init_db() once on startup; it is idempotent.
- Call get_db() anywhere you need a connection; caller is responsible
  for closing it (or use it as a context manager).
"""

import sqlite3
import os

# irctc.db lives in the same backend/ directory as this file
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(_BASE_DIR, "..", "irctc.db")
DB_PATH = os.path.normpath(DB_PATH)   # resolve ../ → clean absolute path


def get_db() -> sqlite3.Connection:
    """
    Return a new SQLite connection with:
      - Row factory so columns are accessible by name (row["pnr"])
      - Foreign key enforcement enabled
      - WAL journal mode for better concurrent read performance
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db() -> None:
    """
    Create all tables and indexes if they do not already exist.
    Safe to call on every application startup — fully idempotent.
    """
    from database.models import CREATE_TABLES_SQL

    conn = get_db()
    try:
        conn.executescript(CREATE_TABLES_SQL)
        conn.commit()
        print(f"Database ready: {DB_PATH}")
    finally:
        conn.close()
