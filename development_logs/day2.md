
# Day 2 - Enable Database and React Frontend

## System Architecture Overview
```plaintext
    ┌────────────┐      WiFi (HTTP GET)     ┌──────────────────────────────┐
    │   ESP32    │ ───────────────────────▶ │  Flask Server (Raspberry Pi) │
    │ Button Log │                          │  - Serves React UI           │
    │   Device   │  ◀──── HTTP POST from ───│  - Receives web input        │
    └────────────┘       web UI buttons     │  - Syncs & parses logs       │
                                            └────────┬─────────────────────┘
                                                     ▼
                                         ┌─────────────────────┐
                                         │   PostgreSQL DB     │
                                         │  (Combined logs)    │
                                         └─────────────────────┘
```
## Features Completed
### 1. **Backend Upgrade: SQLite → PostgreSQL**
* Configured PostgreSQL user and database:
  ```bash
  CREATE USER babyuser WITH PASSWORD 'supersecret';
  CREATE DATABASE babytracker;
  GRANT ALL PRIVILEGES ON DATABASE babytracker TO babyuser;
  \c babytracker
  GRANT USAGE, CREATE ON SCHEMA public TO babyuser;
  ALTER ROLE babyuser SET search_path = public;
  ```
* Updated Flask config:
  ```python
  app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://babyuser:supersecret@localhost/babytracker"
  ```
### 2. **Dual Data Source Integration**
#### Web Button Input
* When a button on the HTML page is clicked:
  * Timestamp is generated in China timezone (UTC+8).
  * Entry is saved and inserted into PostgreSQL (`LogEntry` model)
#### ESP32 Input
* Flask attempts to fetch ESP log file on every visit to `/`:
  * Calls: `http://192.168.50.144/log?file=log-YYYY-MM-DD.txt`
  * Parses the log lines (`YYYY-MM-DD HH:MM:SS Color`)
  * Any missing entries in the DB are inserted
#### 🔁 Fallback Logic
* If ESP32 is unreachable:
  * Falls back to reading from local `baby-logs/` (synced earlier by `systemctl`)
### 3. **Log Management with `systemd`**
* Verified systemd service:
  * Fetches ESP32 log every 10 minutes via SCP
  * Removes yesterday’s `.txt` from the ESP32 to save space
  * Keeps a synced local history in `baby-logs/`
### 4. **API Endpoints**
| Endpoint                        | Method | Description                            |
| ------------------------------- | ------ | -------------------------------------- |
| `/api/logs`                     | GET    | Get all logs from DB                   |
| `/api/logs/today`               | GET    | Get today’s logs from DB               |
| `/api/logs/export/<YYYY-MM-DD>` | GET    | Export logs for a specific date (JSON) |
| `/api/logs`                     | POST   | Add a new log entry via API            |
#### Example POST payload:
```json
{
  "color": "Green",
  "timestamp": "2025-05-21 18:31:00"
}
```
### 5. **Frontend Integration**
* Initialized with `npx create-react-app frontend`
* React dev server proxies API calls to Flask (`proxy: http://localhost:5000`)
* Will progressively replace the HTML interface
### Verified Behaviors
| Action                  | Verified Behavior                              |
| ----------------------- | ---------------------------------------------- |
| Button click in browser | Entry inserted to DB                           |
| ESP32 log file served   | Fetched and parsed, deduped entries inserted   |
| ESP32 unreachable       | Local `baby-logs/` used as fallback            |
| systemd sync            | Log pulled from ESP and removed from ESP daily |
| Flask + React           | React fetches and posts to Flask API via proxy |
## Example Screenshot Pairing
To accompany:
* Flask `/api/logs/today` output in browser or curl
![API GET](./images/api_get_today.png)
* Flask interface (once it replaces buttons)
![web home page](./images/flask_home_page.png)
* ESP32 HTTP home page showing the log collected from the device
![ESP32 home page](./images/esp_home_page.png)
## 🔜 Day 3 Roadmap

* [ ] Replace button UI with React component
* [ ] Pull `/api/logs/today` from frontend and display activity stats
* [ ] Add visual timeline or table
* [ ] Enable calendar switch to browse past days
* [ ] Optional: Bundle system via Docker
* [ ] Long-term: Authentication and role-based access
