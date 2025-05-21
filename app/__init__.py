from flask import Flask
from flask_cors import CORS
from .models import db
from .api import api
from apscheduler.schedulers.background import BackgroundScheduler
from .esp_sync import fetch_and_sync_logs  # ✅ import your sync function

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://babyuser:supersecret@localhost/babytracker'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()

        # ✅ Start the background sync scheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(lambda: fetch_and_sync_logs(app), 'interval', seconds=5)
        scheduler.start()

    # ✅ Register routes and APIs
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    app.register_blueprint(api)

    return app
