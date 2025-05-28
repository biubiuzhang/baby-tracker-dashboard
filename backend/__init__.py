from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from .models import db, User, Device
from .app import api
from .esp_sync import start_mqtt
from .sync_txt_db import sync_txt_to_db
import os

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configure PostgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize DB
    db.init_app(app)
    Migrate(app, db)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    with app.app_context():
        # ✅ Ensure all tables are created first
        db.create_all()

        # ✅ Create default user and device if none exist
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

        # ✅ Sync legacy TXT logs to new DB structure (optional logic)
        sync_txt_to_db()

    # ✅ Start MQTT background sync process if enabled
    if os.environ.get("ENABLE_MQTT") == "1":
        start_mqtt(app)

    # ✅ Register API routes
    app.register_blueprint(api)

    return app
