# Day 1 - Initial Setup and Flask MVP

## Goals for Today
* [x] Set up Flask project with structured layout
* [x] Serve a web dashboard showing today’s activity log summary
* [x] Support mobile/web-based activity logging
* [x] Sync logs from ESP32 every 10 minutes via `systemd` service
## Project Structure
```
baby-tracker-dashboard/
├── run.py                     # Flask entrypoint
├── requirements.txt           # Python dependencies
├── sync-esp32-log.sh          # Log sync script (curl-based)
├── sync-esp32-log.service     # systemd service file for syncing
├── app/
│   ├── __init__.py
│   ├── routes.py
│   ├── templates/
│   │   └── index.html
│   └── static/
└── ~/baby-logs/               # Logs pulled from ESP32
```
## Features Implemented
### 1. **Flask Web Dashboard**
* Web UI at `http://<pi-ip>:5000`
* Displays today’s counts for:
  * Feeding, Diaper, Pee, Poo, Bath
* POST form lets user log an entry from mobile or browser
### 2. **Log File Handling**
* Parses logs from synced path `~/baby-logs/log-YYYY-MM-DD.txt`
* Counts are derived from color-tagged lines like:
  ```
  2025-05-21 12:34:56 Green
  ```
### 3. **Web Form Logging**
* Writes log entry directly to today's file
* Matches ESP32 log format for consistency
## Log Sync from ESP32
### `sync-esp32-log.sh`
```bash
#!/bin/bash

ESP32_IP="192.168.50.144"
DEST_DIR="/home/pi/baby-logs"

mkdir -p "$DEST_DIR"

while true; do
  TODAY=$(date '+%Y-%m-%d')
  YESTERDAY=$(date --date="yesterday" '+%Y-%m-%d')

  TODAY_FILE="log-${TODAY}.txt"
  YESTERDAY_FILE="log-${YESTERDAY}.txt"

  # 1. Sync today's log
  curl -sf "http://${ESP32_IP}/log?file=${TODAY_FILE}" -o "$DEST_DIR/$TODAY_FILE"

  if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Synced $TODAY_FILE from ESP32"

    # 2. Request ESP32 to delete yesterday’s log
    DELETE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://${ESP32_IP}/clear-log?file=${YESTERDAY_FILE}")
    if [ "$DELETE_RESPONSE" = "200" ]; then
      echo "[$(date)] 🧹 Deleted $YESTERDAY_FILE from ESP32"
    elif [ "$DELETE_RESPONSE" = "404" ]; then
      echo "[$(date)] ⚠️  $YESTERDAY_FILE not found on ESP32 (already deleted?)"
    else
      echo "[$(date)] ❌ Failed to delete $YESTERDAY_FILE from ESP32 (HTTP $DELETE_RESPONSE)"
    fi
  else
    echo "[$(date)] ❌ Failed to sync $TODAY_FILE from ESP32"
  fi

  sleep 600  # Retry every 10 minutes
done
```
### `sync-esp32-log.service`
```ini
[Unit]
Description=Sync ESP32 Logs to Raspberry Pi
After=network.target

[Service]
ExecStart=/bin/bash /home/pi/repo/baby-tracker-dashboard/sync-esp32-log.sh
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```
### To Enable the Sync Service
```bash
sudo cp sync-esp32-log.service /etc/systemd/system/
sudo systemctl daemon-reexec
sudo systemctl enable sync-esp32-log
sudo systemctl start sync-esp32-log
```
## Issues Encountered & Fixes
| Issue                         | Resolution                                            |
| ----------------------------- | ----------------------------------------------------- |
| `flask` module not found      | Created fresh venv, installed via `pip install flask` |
| pip blocked due to PEP 668    | Used virtualenv, avoided global install               |
| ESP32 not listing logs on `/` | Updated firmware to list via `SPIFFS.openNextFile()`  |
| VS Code can't write to folder | Fixed with `sudo chown -R pi:pi ~/repo`               |
## ✅ Next Steps (Planned for Day 2)
* Add bar chart for daily stats
* ~~Add dropdown for date navigation~~
* ~~Add log rotation / auto-delete old logs on ESP32~~
* Add duplicate filtering or debounce logic
