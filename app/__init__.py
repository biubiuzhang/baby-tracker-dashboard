from flask import Flask
from flask_cors import CORS
from .models import db, User, Device
from .api import api
from .esp_sync import start_mqtt
from .sync_txt_db import sync_txt_to_db

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configure PostgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://babyuser:supersecret@localhost/babytracker'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize DB
    db.init_app(app)
    with app.app_context():
        # Create all tables from models.py
        db.create_all()

        # Create default user and device if none exist
        if not User.query.first():
            dev_user = User(name="Dev", email="dev@example.com")
            db.session.add(dev_user)
            db.session.commit()

            dev_device = Device(
                user_id=dev_user.id,
                name="Dev ESP32",
                hostname="esp32.local"
            )
            db.session.add(dev_device)
            db.session.commit()

        # Sync legacy TXT logs to new DB structure
        sync_txt_to_db()

    # Start MQTT background sync process
    start_mqtt(app)

    # Register API routes
    app.register_blueprint(api)

    return app
