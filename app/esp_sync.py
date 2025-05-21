# esp_sync.py
from datetime import datetime, timezone, timedelta
import requests
from flask import current_app
from apscheduler.schedulers.background import BackgroundScheduler
from .models import db, LogEntry

ESP_IP = "192.168.50.144"
CHINA_TZ = timezone(timedelta(hours=8))

def fetch_and_sync_logs(app):
    with app.app_context():
        now = datetime.now(CHINA_TZ)
        today_str = now.strftime("%Y-%m-%d")
        esp_url = f"http://{ESP_IP}/log?file=log-{today_str}.txt"

        try:
            response = requests.get(esp_url, timeout=3)
            if response.status_code != 200:
                print(f"[ESP Sync] Failed to fetch log: {response.status_code}")
                return
    
            lines = response.text.strip().splitlines()

            new_entries = 0
            for line in lines:
                parts = line.strip().split()
                if len(parts) != 3:
                    print(f"[ESP Sync] Skipping malformed line: {line}")
                    continue

                try:
                    ts_str = f"{parts[0]} {parts[1]}"
                    color = parts[2]

                    ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
                    ts = ts.replace(tzinfo=CHINA_TZ)

                    exists = LogEntry.query.filter_by(timestamp=ts, color=color).first()
                    if not exists:
                        db.session.add(LogEntry(timestamp=ts, color=color))
                        new_entries += 1
                except Exception as e:
                    print(f"[ESP Sync] Error parsing or inserting line: {line} -> {e}")

            if new_entries > 0:
                db.session.commit()
                print(f"[ESP Sync] ✅ Committed {new_entries} new entries.")
            else:
                print("[ESP Sync] No new entries.")
        except Exception as e:
            print(f"[ESP Sync] ❌ Failed to complete sync: {e}")
