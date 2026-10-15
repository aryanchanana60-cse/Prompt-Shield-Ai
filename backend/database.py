
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "promptshield.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                action TEXT NOT NULL,
                risk TEXT NOT NULL,
                ml_prediction TEXT,
                findings TEXT NOT NULL
            )
        """)


def save_scan(action, risk, ml_prediction, findings):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO scans (action, risk, ml_prediction, findings)
            VALUES (?, ?, ?, ?)
            """,
            (action, risk, ml_prediction, findings),
        )
        return cursor.lastrowid


def get_dashboard_stats():
    with get_connection() as connection:
        total = connection.execute(
            "SELECT COUNT(*) FROM scans"
        ).fetchone()[0]

        actions = connection.execute(
            "SELECT action, COUNT(*) AS count FROM scans GROUP BY action"
        ).fetchall()

        risks = connection.execute(
            "SELECT risk, COUNT(*) AS count FROM scans GROUP BY risk"
        ).fetchall()

        recent = connection.execute(
            """
            SELECT id, created_at, action, risk, ml_prediction, findings
            FROM scans
            ORDER BY id DESC
            LIMIT 20
            """
        ).fetchall()

    return {
        "total_scans": total,
        "actions": {row["action"]: row["count"] for row in actions},
        "risks": {row["risk"]: row["count"] for row in risks},
        "recent_scans": [dict(row) for row in recent],
    }
