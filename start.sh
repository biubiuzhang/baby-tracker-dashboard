#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for db..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is up!"

# Start Flask backend via Gunicorn (1 worker to avoid DB corruption / MQTT threading issue)
gunicorn --preload -w 1 -b 0.0.0.0:5000 'backend:create_app()' &

# Start Nginx
nginx -g "daemon off;"
