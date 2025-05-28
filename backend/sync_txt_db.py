from pathlib import Path
from datetime import datetime, timezone, timedelta
from .models import db, User, Device, Event, FeedDetail, BootDetail

LOG_DIR = Path.home() / "baby-logs"
CHINA_TZ = timezone(timedelta(hours=8))

def sync_txt_to_db():
    today_str = datetime.now(CHINA_TZ).strftime("%Y-%m-%d")
    log_file = LOG_DIR / f"log-{today_str}.txt"

    if not log_file.exists():
        print(f"[Sync] No log file found for today: {log_file}")
        return

    user = User.query.first()
    device = Device.query.filter_by(user_id=user.id).first()

    new_entries = 0
    with open(log_file) as f:
        for line in f:
            try:
                parts = line.strip().split()
                if len(parts) < 3:
                    continue

                ts_str = f"{parts[0]} {parts[1]}"
                event_text = " ".join(parts[2:]).lower()
                ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA_TZ)

                # Skip if already inserted
                existing = Event.query.filter_by(timestamp=ts, event_type=event_text).first()
                if existing:
                    continue

                # Basic event structure
                new_event = Event(
                    user_id=user.id,
                    device_id=device.id,
                    event_type=None,
                    action=None,
                    timestamp=ts
                )

                # Determine event type and details
                if event_text in ["pee", "poo", "pee+poo", "reserved"]:
                    new_event.event_type = event_text

                elif "feed" in event_text.lower():
                    new_event.event_type = "feed"
                    new_event.action = "start" if "start" in event_text else "stop"
                    new_event.volume = 0  # Unknown from txt
                elif "sleep" in event_text.lower():
                    new_event.event_type = "sleep"
                    new_event.action = "start" if "start" in event_text else "stop"
                elif event_text.startswith("[boot]"):
                    new_event.event_type = "boot"
                    reason = event_text.replace("[boot]", "").strip()

                else:
                    continue  # Skip unknown lines

                db.session.add(new_event)
                db.session.flush()  # Get new_event.id before committing

                if new_event.event_type == "feed":
                    db.session.add(FeedDetail(event_id=new_event.id, volume=0))
                elif new_event.event_type == "boot":
                    db.session.add(BootDetail(event_id=new_event.id, reason=reason))

                new_entries += 1

            except Exception as e:
                print(f"[Sync] Failed to parse line: {line.strip()} → {e}")

    if new_entries > 0:
        db.session.commit()
        print(f"[Sync] ✅ Inserted {new_entries} new entries from txt.")
    else:
        print("[Sync] No new entries found in txt.")
