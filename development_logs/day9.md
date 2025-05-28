# Day 9 - Dockerization & Persistent Background Service

## Full Docker Integration Achieved

* Refactored backend (Flask + PostgreSQL + MQTT) into **Dockerized services** using `docker-compose`
* Services include:

  * `web`: Flask backend served via **Gunicorn**
  * `db`: PostgreSQL with persistent data volume
  * `mqtt`: Mosquitto MQTT broker
* Ensured all components **start automatically and stay running** in the background:

  * `gunicorn --preload -w 1 -b 0.0.0.0:5000 'backend:create_app()'` setup
  * Health checks and port mapping working
* No need to manually start Flask or MQTT anymore — system is fully **self-contained**

## Stability & Refactor Work

### Scoped Session Management

* Eliminated SQLAlchemy crashes by properly using:

  * `scoped_session(sessionmaker(...))` in MQTT handler
  * `@app.teardown_appcontext` for automatic cleanup

### Error Handling Fixes

* Fixed critical bug with `volume=None` crashing POST `/api/logs`

  * Now safely defaults to `0` if missing or malformed

### Database Reliability

* Rebuilt DB without losing structure during container rebuild
* Confirmed restart safety:

  ```bash
  docker compose down
  docker compose build
  docker compose up -d
  ```

## UI and UX Polish

### Temperature Page Improvements

* Introduced **zoomable time brush** for navigating multi-day data
* Shaded alternating days for visual clarity
* Dynamic Y-axis and 25°C threshold line help highlight abnormal readings

### Past Activity Logs

* Feed volumes now correctly shown (previously showing 0ml due to mismatch)
* Normalized API and display logic to use correct field

## Final Outcome

* ✅ System now runs **permanently in background**
* ✅ **Web UI stable**, logs handled correctly, MQTT inserts won't crash
* ✅ Infrastructure is now **production-like** — easy to maintain, reboot, or scale

```
baby-tracker/
├── backend/                    # Flask backend source code
│   ├── __init__.py             # create_app() and app setup logic
│   ├── app.py                  # API route definitions (Blueprint: /api/logs, etc.)
│   ├── models.py               # SQLAlchemy models: User, Device, Event, etc.
│   ├── esp_sync.py             # MQTT subscriber logic
│   ├── sync_txt_db.py          # Optional legacy log import
│   └── temp_data.json          # Fetched by frontend for temperature chart
│
├── database/
│   └── init.sql                # Optional: Pre-populated schema or seed data (if needed)
│
baby-tracker/
├── backend/                    # Flask backend source code
│   ├── __init__.py             # create_app() and app setup logic
│   ├── app.py                  # API route definitions (Blueprint: /api/logs, etc.)
├── frontend/                   # React frontend app
│   ├── public/                 # HTML entry point and static files
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, LogEntryForm, etc.)
│   │   ├── pages/              # React pages (DashboardPage.jsx, TemperaturePage.jsx)
│   │   ├── api.js              # Axios wrapper for API endpoints
│   │   └── App.jsx             # Main routing and layout
│   ├── .env                    # REACT_APP_BACKEND_URL or others
│   └── package.json 
│ 
├── docker/ 
│   ├── backend.Dockerfile      # Flask backend container
│   ├── nginx.conf              # Optional: Nginx reverse proxy config (if used)
│   └── mqtt.conf               # Mosquitto config (if customized)
│ 
├── docker-compose.yml          # Defines services: web, db, mqtt
├── .env                        # Shared environment config (DB credentials, etc.)
├── .gitignore 
├── requirements.txt            # Backend Python dependencies
├── README.md 
└── logs/                       # Optional: persistent log exports (bound to volume)
```

                ┌──────────────────────┐
                │      ESP32 Device    │
                │----------------------│
                │ - Button inputs      │
                │ - ST7789 Display     │
                │ - JSON logs (daily)  │
                │ - MQTT publisher     │
                └────────┬─────────────┘
                         │
                         ▼
                ┌──────────────────────┐
                │       Mosquitto      │  (Docker Container)
                │  MQTT Broker (1883)  │
                └────────┬─────────────┘
                         │
           ┌─────────────▼─────────────┐
           │      Flask Backend        │  (Python + Gunicorn)
           │---------------------------│
           │ - RESTful API (Flask)     │
           │ - MQTT Subscriber         │
           │ - PostgreSQL (SQLAlchemy) │
           │ - Log Sync                │
           │ - CSV / Temp Log Parser   │
           └────────┬────────────┬─────┘
                    │            │
         ┌──────────▼───┐   ┌────▼─────────┐
         │ PostgreSQL   │   │ temp_data.json│
         │ Dockerized DB│   │   temp chart  │
         └──────────────┘   └───────────────┘
                               (mounted file)

                    ▲
                    │ REST API (/api/logs, /stats, /logs/today, etc.)
                    ▼

           ┌─────────────────────────────┐
           │       React Frontend        │  (Docker / dev server)
           │-----------------------------│
           │ - Dashboard UI              │
           │ - Live history feed         │
           │ - Summary + Statistics      │
           │ - Chart (Recharts)          │
           └─────────────────────────────┘
