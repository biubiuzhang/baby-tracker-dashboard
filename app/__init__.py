from flask import Flask
from flask_cors import CORS
from .models import db
from .api import api
from .esp_sync import start_mqtt
from .sync_txt_db import sync_txt_to_db

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configure your PostgreSQL DB
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://babyuser:supersecret@localhost/babytracker'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize DB and create tables
    db.init_app(app)
    with app.app_context():
        db.create_all()
        sync_txt_to_db()

    # Start MQTT sync background process
    start_mqtt(app)

    # Register API routes
    app.register_blueprint(api)

    return app
