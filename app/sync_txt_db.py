from pathlib import Path
from datetime import datetime, timezone, timedelta
from .models import db, LogEntry

LOG_DIR = Path.home() / "baby-logs"
CHINA_TZ = timezone(timedelta(hours=8))

def sync_txt_to_db():
    today_str = datetime.now(CHINA_TZ).strftime("%Y-%m-%d")
    log_file = LOG_DIR / f"log-{today_str}.txt"

    if not log_file.exists():
        print(f"[Sync] No log file found for today: {log_file}")
        return

    new_entries = 0
    with open(log_file) as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 3:
                continue

            try:
                ts_str = f"{parts[0]} {parts[1]}"
                color = " ".join(parts[2:])
                ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA_TZ)

                exists = LogEntry.query.filter_by(timestamp=ts, color=color).first()
                if not exists:
                    db.session.add(LogEntry(timestamp=ts, color=color))
                    new_entries += 1
            except Exception as e:
                print(f"[Sync] Failed to parse line: {line.strip()} → {e}")

    if new_entries > 0:
        db.session.commit()
        print(f"[Sync] ✅ Inserted {new_entries} new entries from txt.")
    else:
        print("[Sync] No new entries found in txt.")
