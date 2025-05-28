import os
import json
import pytz
import paho.mqtt.client as mqtt
from datetime import datetime
from flask import Flask
from sqlalchemy.orm import scoped_session, sessionmaker

from .models import db, User, Device, Event, FeedDetail, BootDetail

CHINA_TZ = pytz.timezone("Asia/Shanghai")
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")

def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe("esp32/babytracker/logs")

def on_message(client, userdata, msg):
    session = None
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        app = userdata["app"]

        with app.app_context():
            Session = sessionmaker(bind=db.engine)
            session = Session()

            user = session.query(User).first()
            if not user:
                print("[MQTT] ❌ No user found")
                return

            device = session.query(Device).filter_by(user_id=user.id).first()
            if not device:
                print("[MQTT] ❌ No device found for user")
                return

            ts = datetime.strptime(payload["timestamp"], "%Y-%m-%d %H:%M:%S")
            ts = CHINA_TZ.localize(ts)

            event_type = payload.get("event")
            action = payload.get("action")
            volume = payload.get("volume", None)
            reason = payload.get("reason", None)

            exists = session.query(Event).filter_by(timestamp=ts, event_type=event_type).first()
            if exists:
                print(f"[MQTT] Skipped duplicate: {ts} - {event_type}")
                return

            new_event = Event(
                user_id=user.id,
                device_id=device.id,
                event_type=event_type,
                action=action,
                timestamp=ts
            )
            session.add(new_event)
            session.flush()

            if event_type == "feed":
                session.add(FeedDetail(event_id=new_event.id, volume=volume or 0))
            elif event_type == "boot" and reason:
                session.add(BootDetail(event_id=new_event.id, reason=reason))

            session.commit()
            print(f"[MQTT] ✅ Inserted: {ts} - {event_type}")
    except Exception as e:
        print(f"[MQTT] ❌ Error processing MQTT message: {e}")
        if session:
            session.rollback()
    finally:
        if session:
            session.close()

def start_mqtt(app: Flask):
    client = mqtt.Client(userdata={"app": app})
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_start()
