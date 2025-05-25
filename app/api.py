from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from pathlib import Path
from .models import db, LogEntry
from .sync_txt_db import sync_txt_to_db
import requests

api = Blueprint('api', __name__)
LOG_DIR = Path.home() / "baby-logs"
CHINA_TZ = timezone(timedelta(hours=8))
ESP32_URL = "http://esp32.local"  # or the IP address of your ESP32

ACTIVITY_MAP = {
    "Blue": "Feeding",
    "Red": "Diaper Change",
    "Green": "Pee",
    "Yellow": "Poo",
    "Black": "Bath"
}

@api.route("/api/logs/today", methods=["GET"])
def get_today_logs():
    now = datetime.now(CHINA_TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    logs = LogEntry.query.filter(
        LogEntry.timestamp >= today_start,
        LogEntry.timestamp <= today_end
    ).all()

    counts = {activity: 0 for activity in ACTIVITY_MAP.values()}
    for log in logs:
        activity = ACTIVITY_MAP.get(log.color)
        if activity:
            counts[activity] += 1

    return jsonify({
        "date": today_start.strftime("%Y-%m-%d"),
        "logs": [{"activity": key, "count": value} for key, value in counts.items()]
    })


@api.route("/api/logs/<date_str>", methods=["GET"])
def get_logs_by_date(date_str):
    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=CHINA_TZ)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    start = day.replace(hour=0, minute=0, second=0, microsecond=0)
    end = day.replace(hour=23, minute=59, second=59, microsecond=999999)

    logs = LogEntry.query.filter(
        LogEntry.timestamp >= start,
        LogEntry.timestamp <= end
    ).all()

    results = [
        {"timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"), "color": log.color}
        for log in logs
    ]
    return jsonify({"date": date_str, "logs": results})


@api.route("/api/logs", methods=["POST"])
def add_log():
    data = request.get_json()
    color = data.get("color")
    if color not in ACTIVITY_MAP:
        return jsonify({"error": "Invalid color"}), 400

    now = datetime.now(CHINA_TZ).replace(microsecond=0)
    log_line = f"{now.strftime('%Y-%m-%d %H:%M:%S')} {color}\n"

    today = now.strftime("%Y-%m-%d")
    log_file = LOG_DIR / f"log-{today}.txt"
    with open(log_file, "a") as f:
        f.write(log_line)

    db.session.add(LogEntry(timestamp=now, color=color))
    db.session.commit()
    sync_txt_to_db()

    return jsonify({"message": "Entry saved", "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")})

@api.route('/api/esp-status', methods=['GET'])
def esp_status():
    try:
        resp = requests.get(f"{ESP32_URL}/", timeout=2)
        if resp.status_code == 200:
            return jsonify({"online": True})
    except Exception as e:
        print(f"[ESP CHECK] Failed: {e}")
    return jsonify({"online": False})

@api.route("/api/logs/export/<date>", methods=["GET"])
def export_logs_from_db(date):
    try:
        day = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=CHINA_TZ)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    start = day.replace(hour=0, minute=0, second=0, microsecond=0)
    end = day.replace(hour=23, minute=59, second=59, microsecond=999999)

    logs = LogEntry.query.filter(
        LogEntry.timestamp >= start,
        LogEntry.timestamp <= end
    ).order_by(LogEntry.timestamp.asc()).all()

    entries = []
    for log in logs:
        entries.append({
            "time": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "activity": ACTIVITY_MAP.get(log.color, "Power-on" if "[Boot]" in log.color else log.color)
        })

    return jsonify({
        "date": date,
        "entries": entries
    })
