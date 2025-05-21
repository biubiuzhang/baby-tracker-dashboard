from flask import Blueprint, render_template, request, redirect, url_for
from datetime import datetime, timezone, timedelta
from pathlib import Path
import requests
from .models import db, LogEntry

main = Blueprint('main', __name__)
LOG_DIR = Path.home() / "baby-logs"
ESP32_URL = "http://192.168.50.144"
CHINA_TZ = timezone(timedelta(hours=8))

ACTIVITY_MAP = {
    "Blue": "Feeding",
    "Red": "Diaper Change",
    "Green": "Pee",
    "Yellow": "Poo",
    "Black": "Bath"
}

def fetch_log_lines(date_str):
    log_name = f"log-{date_str}.txt"
    try:
        url = f"{ESP32_URL}/log?file={log_name}"
        resp = requests.get(url, timeout=3)
        if resp.status_code == 200:
            return resp.text.strip().splitlines()
        else:
            raise Exception("HTTP status not 200")
    except Exception as e:
        print(f"⚠️ Could not fetch from ESP32: {e}")
        # Fallback to local
        local_file = LOG_DIR / log_name
        if local_file.exists():
            with open(local_file) as f:
                return f.readlines()
    return []

@main.route("/")
def index():
    now = datetime.now(CHINA_TZ)
    today_date = now.strftime("%Y-%m-%d")
    today_str_display = now.strftime("%Y-%m-%d %H:%M:%S")
    lines = fetch_log_lines(today_date)

    for line in lines:
        try:
            ts_str, color = line.strip().rsplit(" ", 1)
            ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=CHINA_TZ)
            if color in ACTIVITY_MAP:
                exists = LogEntry.query.filter_by(timestamp=ts, color=color).first()
                if not exists:
                    db.session.add(LogEntry(timestamp=ts, color=color))
        except Exception as e:
            print(f"⚠️ Skipping line: {line.strip()} ({e})")

    db.session.commit()

    today_start = datetime.strptime(today_date, "%Y-%m-%d").replace(tzinfo=CHINA_TZ)
    today_end = datetime.combine(today_start, datetime.max.time()).replace(tzinfo=CHINA_TZ)

    logs = LogEntry.query.filter(
        LogEntry.timestamp >= today_start,
        LogEntry.timestamp <= today_end
    ).all()

    counts = {activity: 0 for activity in ACTIVITY_MAP.values()}
    for log in logs:
        activity = ACTIVITY_MAP.get(log.color)
        if activity:
            counts[activity] += 1

    return render_template("index.html", counts=counts, today=today_str_display)

@main.route("/add", methods=["POST"])
def add_entry():
    color = request.form.get("color")
    if color not in ACTIVITY_MAP:
        return "Invalid input", 400

    now = datetime.now(CHINA_TZ).replace(microsecond=0)
    timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"{timestamp_str} {color}\n"

    # Save to file
    today = now.strftime("%Y-%m-%d")
    log_file = LOG_DIR / f"log-{today}.txt"
    with open(log_file, "a") as f:
        f.write(log_line)

    # Save to DB
    db.session.add(LogEntry(timestamp=now, color=color))
    db.session.commit()

    return redirect(url_for("main.index"))
