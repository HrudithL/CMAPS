"""Append new Bitcoin daily prices from CoinGecko to the local CSV."""

from __future__ import annotations

import csv
import datetime
from pathlib import Path

import requests


def convert_date_format(date_str: str) -> str:
    year, month, day = date_str.split("-")
    return f"{month}/{day}/{year}"


def fetch_bitcoin_price_history(start_date: str, end_date: str) -> list[dict]:
    url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range"
    start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
    end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
    today = datetime.date.today()
    min_public_start = today - datetime.timedelta(days=365)

    if start_dt > end_dt:
        return []

    if start_dt < min_public_start:
        print(
            "CoinGecko public API allows historical queries only for the past 365 days."
        )
        print(f"Adjusting start date from {start_dt} to {min_public_start}.")
        start_dt = min_public_start

    chunk_days = 300
    all_points: dict[datetime.date, float] = {}
    current_start = start_dt

    while current_start <= end_dt:
        current_end = min(current_start + datetime.timedelta(days=chunk_days), end_dt)
        params = {
            "vs_currency": "usd",
            "from": int(
                datetime.datetime.combine(
                    current_start, datetime.time.min, tzinfo=datetime.timezone.utc
                ).timestamp()
            ),
            "to": int(
                datetime.datetime.combine(
                    current_end, datetime.time.max, tzinfo=datetime.timezone.utc
                ).timestamp()
            ),
        }

        response = requests.get(url, params=params, timeout=30)
        if response.status_code != 200:
            print(f"Failed to fetch data: {response.status_code} - {response.reason}")
            print(response.text)
            return []

        data = response.json()
        for price in data.get("prices", []):
            price_date = datetime.datetime.utcfromtimestamp(price[0] / 1000).date()
            if start_dt <= price_date <= end_dt:
                all_points[price_date] = price[1]

        current_start = current_end + datetime.timedelta(days=1)

    return [
        {"date": d.strftime("%Y-%m-%d"), "price": all_points[d]}
        for d in sorted(all_points)
    ]


def get_last_date_from_sorted_csv(csv_path: Path) -> datetime.date:
    with csv_path.open("rb") as handle:
        handle.seek(0, 2)
        file_size = handle.tell()
        read_size = min(8192, file_size)
        handle.seek(-read_size, 2)
        chunk = handle.read().decode("utf-8", errors="ignore")

    lines = [line.strip() for line in chunk.splitlines() if line.strip()]
    if len(lines) <= 1:
        raise ValueError("CSV does not contain data rows.")
    last_line = lines[-1]
    last_date_text = last_line.split(",", 1)[0]
    return datetime.datetime.strptime(last_date_text, "%m/%d/%Y").date()


def ensure_file_ends_with_newline(csv_path: Path) -> None:
    with csv_path.open("rb+") as handle:
        handle.seek(0, 2)
        if handle.tell() == 0:
            return
        handle.seek(-1, 2)
        if handle.read(1) != b"\n":
            handle.write(b"\n")


def main() -> None:
    csv_path = Path(__file__).resolve().parents[2] / "data" / "Bitcoin_2010.csv"
    last_date = get_last_date_from_sorted_csv(csv_path)
    start_date = str(last_date + datetime.timedelta(days=1))
    end_date = str(datetime.date.today())
    bitcoin_prices = fetch_bitcoin_price_history(start_date, end_date)

    data_list: list[list] = []
    for entry in bitcoin_prices:
        formatted_date = convert_date_format(str(entry["date"]))
        data_list.append([formatted_date, round(entry["price"], 2)])

    if data_list:
        ensure_file_ends_with_newline(csv_path)
        with csv_path.open("a", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerows(data_list)
        print(f"Added {len(data_list)} new rows to Bitcoin_2010.csv")
    else:
        print("No new rows found in requested date range.")


if __name__ == "__main__":
    main()
