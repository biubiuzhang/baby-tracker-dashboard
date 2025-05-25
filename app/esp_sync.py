import json
import pytz
import paho.mqtt.client as mqtt
from datetime import datetime
from .models import db, LogEntry
from .sync_txt_db import sync_txt_to_db
from flask import Flask

CHINA_TZ = pytz.timezone("Asia/Shanghai")
MQTT_BROKER = "localhost"  # or IP of your MQTT broker

def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe("esp32/babytracker/logs")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        ts = datetime.strptime(payload["timestamp"], "%Y-%m-%d %H:%M:%S")
        ts = CHINA_TZ.localize(ts)
        color = payload["color"]

        with userdata["app"].app_context():
            exists = LogEntry.query.filter_by(timestamp=ts, color=color).first()
            if not exists:
                db.session.add(LogEntry(timestamp=ts, color=color))
                db.session.commit()
                print(f"[MQTT] ✅ Inserted: {ts} - {color}")
            else:
                print(f"[MQTT] Skipped duplicate: {ts} - {color}")
            sync_txt_to_db()
    except Exception as e:
        print(f"[MQTT] ❌ Error: {e}")

def start_mqtt(app: Flask):
    client = mqtt.Client(userdata={"app": app})
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_start()
