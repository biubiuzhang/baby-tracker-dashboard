from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from pathlib import Path
from collections import Counter
import requests

from .models import db, User, Device, Event, FeedDetail, BootDetail

api = Blueprint("api", __name__)
CHINA_TZ = timezone(timedelta(hours=8))
ESP32_URL = "http://esp32.local"  # Update as needed


# === Utilities ===

def get_today_range():
    now = datetime.now(CHINA_TZ)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    return start, end


# === LOG APIs ===

@api.route("/api/logs/today", methods=["GET"])
def get_today_logs():
    now = datetime.now(CHINA_TZ)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    events = Event.query.filter(
        Event.timestamp >= start,
        Event.timestamp <= end
    ).all()

    counter = Counter()
    for e in events:
        # Count always for pee/poo/reserved/pee+poo
        if e.event_type in ["pee", "poo", "reserved", "pee+poo"]:
            counter[e.event_type] += 1

        # Count feed/sleep only if it's a "start" action
        elif e.event_type in ["feed", "sleep"]:
            if e.action and e.action.lower() == "start":
                counter[e.event_type] += 1

    summary = [{"activity": k.capitalize(), "count": v} for k, v in counter.items()]
    return jsonify({
        "date": now.strftime("%Y-%m-%d"),
        "logs": summary
    })

@api.route("/api/logs/<date_str>", methods=["GET"])
def get_logs_by_date(date_str):
    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=CHINA_TZ)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    start = day.replace(hour=0, minute=0, second=0)
    end = day.replace(hour=23, minute=59, second=59)

    events = Event.query.filter(Event.timestamp >= start, Event.timestamp <= end).order_by(Event.timestamp.asc()).all()
    results = []
    for e in events:
        entry = {
            "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "event": e.event_type,
            "action": e.action
        }
        if e.event_type == "feed":
            detail = FeedDetail.query.filter_by(event_id=e.id).first()
            if detail:
                entry["volume_ml"] = detail.volume_ml
        elif e.event_type == "boot":
            detail = BootDetail.query.filter_by(event_id=e.id).first()
            if detail:
                entry["reason"] = detail.reason
        results.append(entry)

    return jsonify({"date": date_str, "logs": results})


@api.route("/api/logs", methods=["POST"])
def add_log():
    data = request.get_json()
    event_type = data.get("event")
    action = data.get("action")
    volume = data.get("volume", 0)
    reason = data.get("reason")

    now = datetime.now(CHINA_TZ).replace(microsecond=0)

    user = User.query.first()
    device = Device.query.filter_by(user_id=user.id).first()

    new_event = Event(
        user_id=user.id,
        device_id=device.id,
        event_type=event_type,
        action=action,
        timestamp=now
    )
    db.session.add(new_event)
    db.session.flush()

    if event_type == "feed":
        db.session.add(FeedDetail(event_id=new_event.id, volume_ml=volume))
    elif event_type == "boot" and reason:
        db.session.add(BootDetail(event_id=new_event.id, reason=reason))

    db.session.commit()

    return jsonify({
        "message": "Event added",
        "event": event_type,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    })


@api.route("/api/logs/export/<date>", methods=["GET"])
def export_logs_from_db(date):
    try:
        day = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=CHINA_TZ)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    start = day.replace(hour=0, minute=0, second=0)
    end = day.replace(hour=23, minute=59, second=59)

    events = Event.query.filter(Event.timestamp >= start, Event.timestamp <= end).order_by(Event.timestamp.asc()).all()
    entries = []

    for e in events:
        entry = {
            "time": e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "activity": e.event_type
        }
        if e.event_type == "feed":
            detail = FeedDetail.query.filter_by(event_id=e.id).first()
            if detail:
                entry["volume_ml"] = detail.volume_ml
        elif e.event_type == "boot":
            detail = BootDetail.query.filter_by(event_id=e.id).first()
            if detail:
                entry["reason"] = detail.reason
        entries.append(entry)

    return jsonify({"date": date, "entries": entries})


# === DEVICE STATUS ===

@api.route('/api/esp-status', methods=['GET'])
def esp_status():
    try:
        resp = requests.get(f"{ESP32_URL}/", timeout=2)
        if resp.status_code == 200:
            return jsonify({"online": True})
    except Exception as e:
        print(f"[ESP CHECK] Failed: {e}")
    return jsonify({"online": False})


# === DAILY STATS ===

@api.route("/api/stats/summary/today", methods=["GET"])
def get_today_summary():
    start, end = get_today_range()
    events = Event.query.filter(Event.timestamp >= start, Event.timestamp <= end).all()

    total_volume = 0
    diaper_count = 0

    for e in events:
        if e.event_type in ["pee", "poo", "pee+poo"]:
            diaper_count += 1
        elif e.event_type == "feed":
            detail = FeedDetail.query.filter_by(event_id=e.id).first()
            if detail:
                total_volume += detail.volume_ml

    return jsonify({
        "date": start.strftime("%Y-%m-%d"),
        "diapers_used": diaper_count,
        "formula_ml_total": total_volume
    })


@api.route("/api/stats/days", methods=["GET"])
def get_daily_overview():
    today = datetime.now(CHINA_TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    result = []

    for i in range(7):  # Last 7 days
        day = today - timedelta(days=i)
        start = day
        end = day.replace(hour=23, minute=59, second=59)
        events = Event.query.filter(Event.timestamp >= start, Event.timestamp <= end).all()

        diapers = sum(1 for e in events if e.event_type in ["pee", "poo", "pee+poo"])
        total_feed = 0
        for e in events:
            if e.event_type == "feed":
                d = FeedDetail.query.filter_by(event_id=e.id).first()
                if d:
                    total_feed += d.volume_ml

        result.append({
            "date": day.strftime("%Y-%m-%d"),
            "diapers": diapers,
            "formula_ml": total_feed
        })

    return jsonify({"days": list(reversed(result))})
