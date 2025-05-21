from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from pathlib import Path
from .models import db, LogEntry

api = Blueprint('api', __name__)
LOG_DIR = Path.home() / "baby-logs"
CHINA_TZ = timezone(timedelta(hours=8))

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

    return jsonify({"date": today_start.strftime("%Y-%m-%d"), "counts": counts})


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

    return jsonify({"message": "Entry saved", "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")})


@api.route("/api/logs/export/<date_str>", methods=["GET"])
def export_txt_log(date_str):
    log_file = LOG_DIR / f"log-{date_str}.txt"
    if not log_file.exists():
        return jsonify({"error": "Log file not found."}), 404

    with open(log_file) as f:
        lines = f.readlines()

    return jsonify({"date": date_str, "entries": [line.strip() for line in lines]})
