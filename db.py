"""
Модуль работы с SQLite для хранения истории цен IPv4
"""

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict
import json

DB_PATH = Path(__file__).parent / "ipv4_prices.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Создаём таблицы при первом запуске"""
    conn = get_connection()
    cur = conn.cursor()

    # История аренды (LARUS)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lease_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            block_size TEXT NOT NULL,          -- "/24", "/22" и т.д.
            ips INTEGER NOT NULL,
            base_per_ip REAL NOT NULL,
            base_total REAL NOT NULL,
            production_per_ip REAL,
            production_total REAL,
            source TEXT DEFAULT 'LARUS'
        )
    """)

    # История покупки (по регионам)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS purchase_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            region TEXT NOT NULL,              -- "RIPE NCC", "ARIN" и т.д.
            block_size TEXT NOT NULL,
            min_price REAL,
            avg_price REAL,
            max_price REAL,
            source TEXT DEFAULT 'market'
        )
    """)

    # Метаданные последнего обновления
    cur.execute("""
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    conn.commit()
    conn.close()


def save_lease_snapshot(lease_data: Dict):
    """Сохраняем снимок цен аренды"""
    conn = get_connection()
    cur = conn.cursor()
    ts = datetime.utcnow().isoformat()

    for label, data in lease_data.items():
        if "error" in data:
            continue

        # Извлекаем размер блока из label (" /24 (256 IP)" → "/24")
        block_size = label.split()[0] if label else "unknown"

        cur.execute("""
            INSERT INTO lease_history 
            (timestamp, block_size, ips, base_per_ip, base_total, production_per_ip, production_total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            ts,
            block_size,
            data.get("ips", 0),
            data.get("base_per_ip", 0),
            data.get("base_total", 0),
            data.get("production_per_ip"),
            data.get("production_total"),
        ))

    cur.execute("""
        INSERT OR REPLACE INTO meta (key, value) VALUES ('last_lease_update', ?)
    """, (ts,))

    conn.commit()
    conn.close()


def save_purchase_snapshot(purchase_data: Dict):
    """Сохраняем снимок цен покупки"""
    conn = get_connection()
    cur = conn.cursor()
    ts = datetime.utcnow().isoformat()

    for region, blocks in purchase_data.items():
        for block_size, prices in blocks.items():
            cur.execute("""
                INSERT INTO purchase_history 
                (timestamp, region, block_size, min_price, avg_price, max_price)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                ts,
                region,
                block_size,
                prices.get("min"),
                prices.get("avg"),
                prices.get("max"),
            ))

    cur.execute("""
        INSERT OR REPLACE INTO meta (key, value) VALUES ('last_purchase_update', ?)
    """, (ts,))

    conn.commit()
    conn.close()


def get_lease_history(block_size: Optional[str] = None, days: int = 30) -> List[Dict]:
    """Получаем историю аренды"""
    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT * FROM lease_history 
        WHERE timestamp >= datetime('now', ?)
    """
    params = [f"-{days} days"]

    if block_size:
        query += " AND block_size = ?"
        params.append(block_size)

    query += " ORDER BY timestamp ASC"

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def get_purchase_history(region: Optional[str] = None, block_size: Optional[str] = None, days: int = 90) -> List[Dict]:
    """Получаем историю покупки"""
    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT * FROM purchase_history 
        WHERE timestamp >= datetime('now', ?)
    """
    params = [f"-{days} days"]

    if region:
        query += " AND region = ?"
        params.append(region)
    if block_size:
        query += " AND block_size = ?"
        params.append(block_size)

    query += " ORDER BY timestamp ASC"

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def get_last_update(key: str = "last_lease_update") -> Optional[str]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT value FROM meta WHERE key = ?", (key,))
    row = cur.fetchone()
    conn.close()
    return row["value"] if row else None


def get_latest_lease() -> Dict:
    """Возвращает последний сохранённый снимок аренды в удобном виде"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT block_size, ips, base_per_ip, base_total, production_per_ip, production_total, timestamp
        FROM lease_history
        WHERE timestamp = (SELECT MAX(timestamp) FROM lease_history)
        ORDER BY ips
    """)
    rows = cur.fetchall()
    conn.close()

    result = {}
    for row in rows:
        label = f"{row['block_size']} ({row['ips']:,} IP)"
        result[label] = {
            "ips": row["ips"],
            "base_per_ip": row["base_per_ip"],
            "base_total": row["base_total"],
            "production_per_ip": row["production_per_ip"],
            "production_total": row["production_total"],
            "timestamp": row["timestamp"],
        }
    return result
