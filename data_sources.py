"""
Источники данных: LARUS API + рыночные цены покупки
"""

import requests
from typing import Dict
from datetime import datetime

# ====================== LARUS Live Lease API ======================

def fetch_larus_lease_prices(location: str = "US") -> Dict:
    """
    Получаем живые цены аренды с LARUS API.
    location: "US", "EU" и т.д. (влияет на доступность, цены пока одинаковые)
    """
    base_url = "https://larus.net/ipv4/api/price/continuity-quote"

    sizes = {
        1: "/24",
        2: "/23",
        4: "/22",
        8: "/21",
        16: "/20",
        32: "/19",
        64: "/18",
        128: "/17",
        256: "/16",
    }

    results = {}

    for num, block_size in sizes.items():
        try:
            params = {
                "num": num,
                "months": 1,
                "location": location,
            }
            r = requests.get(base_url, params=params, timeout=12)
            data = r.json()

            if data.get("status") == "success":
                plans = data["plans"]
                capacity = plans.get("CAPACITY_ONLY", {})
                production = plans.get("CONTINUITY_PRODUCTION", {})

                ips = num * 256
                label = f"{block_size} ({ips:,} IP)"

                results[label] = {
                    "block_size": block_size,
                    "ips": ips,
                    "base_per_ip": float(capacity.get("base_unit_price", 0)),
                    "base_total": float(capacity.get("monthly_total", 0)),
                    "production_per_ip": float(production.get("final_unit_price", 0)),
                    "production_total": float(production.get("monthly_total", 0)),
                    "source": "LARUS",
                    "fetched_at": datetime.utcnow().isoformat(),
                }
            else:
                results[f"{block_size}"] = {"error": "API returned non-success"}
        except Exception as e:
            results[f"{block_size}"] = {"error": str(e)}

    return results


# ====================== Рыночные цены покупки ======================
# Обновляются вручную по отчётам IPv4Center / IPv4.Global / CircleID
# Актуальные данные на сентябрь 2026

PURCHASE_PRICES = {
    "RIPE NCC (Европа)": {
        "/24": {"min": 22.0, "avg": 26.8, "max": 38.0},
        "/23": {"min": 20.0, "avg": 24.5, "max": 34.0},
        "/22": {"min": 18.0, "avg": 21.0, "max": 30.0},
        "/21": {"min": 16.5, "avg": 19.0, "max": 27.0},
        "/20": {"min": 15.0, "avg": 17.5, "max": 25.0},
        "/19": {"min": 14.0, "avg": 16.0, "max": 22.0},
        "/18": {"min": 13.0, "avg": 14.8, "max": 20.0},
        "/17": {"min": 12.5, "avg": 14.0, "max": 18.0},
        "/16": {"min": 12.0, "avg": 13.5, "max": 17.0},
    },
    "ARIN (Северная Америка)": {
        "/24": {"min": 20.0, "avg": 25.5, "max": 36.0},
        "/23": {"min": 18.5, "avg": 23.0, "max": 32.0},
        "/22": {"min": 17.0, "avg": 20.5, "max": 28.0},
        "/21": {"min": 15.5, "avg": 18.5, "max": 25.0},
        "/20": {"min": 14.0, "avg": 16.8, "max": 23.0},
        "/19": {"min": 13.0, "avg": 15.5, "max": 21.0},
        "/18": {"min": 12.0, "avg": 14.2, "max": 19.0},
        "/17": {"min": 11.5, "avg": 13.5, "max": 17.0},
        "/16": {"min": 11.0, "avg": 13.2, "max": 16.0},
    },
    "APNIC (Азия-Тихий океан)": {
        "/24": {"min": 21.0, "avg": 24.0, "max": 32.0},
        "/23": {"min": 19.0, "avg": 22.0, "max": 29.0},
        "/22": {"min": 18.0, "avg": 20.0, "max": 27.0},
        "/21": {"min": 16.0, "avg": 18.5, "max": 24.0},
        "/20": {"min": 15.0, "avg": 17.0, "max": 24.0},
        "/19": {"min": 14.0, "avg": 15.8, "max": 21.0},
        "/18": {"min": 13.0, "avg": 14.5, "max": 19.0},
        "/17": {"min": 12.5, "avg": 13.8, "max": 17.5},
        "/16": {"min": 12.0, "avg": 13.5, "max": 17.0},
    },
    "LACNIC (Латинская Америка)": {
        "/24": {"min": 20.0, "avg": 25.0, "max": 33.0},
        "/23": {"min": 18.0, "avg": 22.5, "max": 30.0},
        "/22": {"min": 17.0, "avg": 20.0, "max": 27.0},
        "/21": {"min": 15.5, "avg": 18.0, "max": 24.0},
        "/20": {"min": 14.0, "avg": 16.5, "max": 23.0},
        "/19": {"min": 13.0, "avg": 15.0, "max": 20.0},
        "/18": {"min": 12.0, "avg": 14.0, "max": 18.0},
        "/17": {"min": 11.5, "avg": 13.2, "max": 16.5},
        "/16": {"min": 11.0, "avg": 13.0, "max": 16.0},
    },
    "AFRINIC (Африка)": {
        "/24": {"min": 18.0, "avg": 22.0, "max": 30.0},
        "/23": {"min": 16.5, "avg": 20.0, "max": 27.0},
        "/22": {"min": 15.0, "avg": 18.0, "max": 24.0},
        "/21": {"min": 14.0, "avg": 16.5, "max": 22.0},
        "/20": {"min": 13.0, "avg": 15.0, "max": 20.0},
        "/19": {"min": 12.0, "avg": 14.0, "max": 18.0},
        "/18": {"min": 11.0, "avg": 13.0, "max": 16.5},
        "/17": {"min": 10.5, "avg": 12.5, "max": 15.5},
        "/16": {"min": 10.0, "avg": 12.0, "max": 15.0},
    },
}


def get_purchase_prices(region: str = None) -> Dict:
    """Возвращает цены покупки. Если region указан — только его."""
    if region and region in PURCHASE_PRICES:
        return {region: PURCHASE_PRICES[region]}
    return PURCHASE_PRICES


def get_all_regions() -> list:
    return list(PURCHASE_PRICES.keys())
