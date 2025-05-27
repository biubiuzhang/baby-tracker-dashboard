import json
import pytz
import paho.mqtt.client as mqtt
from datetime import datetime
from flask import Flask
from .models import db, User, Device, Event, FeedDetail, BootDetail

CHINA_TZ = pytz.timezone("Asia/Shanghai")
MQTT_BROKER = "localhost"

def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe("esp32/babytracker/logs")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        app = userdata["app"]

        with app.app_context():
            user = User.query.first()
            device = Device.query.filter_by(user_id=user.id).first()

            # Parse timestamp
            ts = datetime.strptime(payload["timestamp"], "%Y-%m-%d %H:%M:%S")
            ts = CHINA_TZ.localize(ts)

            event_type = payload.get("event")
            action = payload.get("action")
            volume = payload.get("volume", None)
            reason = payload.get("reason", None)

            # Check if already inserted
            exists = Event.query.filter_by(timestamp=ts, event_type=event_type).first()
            if exists:
                print(f"[MQTT] Skipped duplicate: {ts} - {event_type}")
                return

            # Create main event row
            new_event = Event(
                user_id=user.id,
                device_id=device.id,
                event_type=event_type,
                action=action,
                timestamp=ts
            )
            db.session.add(new_event)
            db.session.flush()  # Get event.id before committing

            # Add optional details
            if event_type == "feed":
                db.session.add(FeedDetail(event_id=new_event.id, volume_ml=volume or 0))
            elif event_type == "boot" and reason:
                db.session.add(BootDetail(event_id=new_event.id, reason=reason))

            db.session.commit()
            print(f"[MQTT] ✅ Inserted: {ts} - {event_type}")

    except Exception as e:
        print(f"[MQTT] ❌ Error: {e}")

def start_mqtt(app: Flask):
    client = mqtt.Client(userdata={"app": app})
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_start()
