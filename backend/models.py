from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Device(db.Model):
    __tablename__ = 'devices'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    name = db.Column(db.String, nullable=False)
    hostname = db.Column(db.String)
    mac_address = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    device_id = db.Column(UUID(as_uuid=True), db.ForeignKey('devices.id'))
    event_type = db.Column(db.String, nullable=False)  # e.g., 'feed', 'sleep', 'pee'
    action = db.Column(db.String)  # 'start' or 'stop' (optional)
    timestamp = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FeedDetail(db.Model):
    __tablename__ = 'feed_details'
    event_id = db.Column(UUID(as_uuid=True), db.ForeignKey('events.id'), primary_key=True)
    volume = db.Column(db.Integer, nullable=False, default=0)

class BootDetail(db.Model):
    __tablename__ = 'boot_details'
    event_id = db.Column(UUID(as_uuid=True), db.ForeignKey('events.id'), primary_key=True)
    reason = db.Column(db.String, nullable=False)
