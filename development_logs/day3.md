# Day 3 - Replace Flask Web GUI with React

## Goal
Make sure the **PostgreSQL database always reflects the latest activity**, regardless of whether the button is pressed:
* On the **ESP32 device**
* Or from the **React web GUI**
Flask should serve as the bridge and single source of truth.
## System Overview
| Component      | Role                                        |
| -------------- | ------------------------------------------- |
| ESP32          | Logs button presses to HTTP `.txt`          |
| Flask Backend  | Receives logs from React UI + syncs ESP log |
| PostgreSQL     | Stores all log entries                      |
| React Frontend | Web GUI for logging + viewing stats         |
## Setup Summary
### PostgreSQL
Already covered in **Day 2 log** — no change.
### Flask Backend
* Set up `esp_sync.py` with background polling
* Syncs every 5 seconds from ESP log URL:
  ```
  http://192.168.50.144/log?file=log-YYYY-MM-DD.txt
  ```
* Avoids duplicates via `(timestamp, color)` match in DB
* All database access runs inside `app.app_context()` using:
  ```python
  scheduler.add_job(lambda: fetch_and_sync_logs(app), 'interval', seconds=5)
  ```
### React Web GUI — Tailwind Took Effort
Installing Tailwind with Vite required **several steps** and debugging. The working flow:
```bash
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss-cli init -p
```
If `npx tailwindcss init -p` failed, the fix was:
```bash
npm uninstall tailwindcss postcss autoprefixer
rm -rf node_modules package-lock.json
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss-cli init -p
```
Also required:
* `tailwind.config.js`:
  ```js
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
  ```
* `src/index.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
✅ Tailwind is now fully functional and styling UI correctly.
### Web Button Not Functional Yet
Currently:
* ESP logs are polled and shown in UI ✅
* Web UI buttons render, but **do not trigger `POST /api/logs` yet**
* Clicking buttons doesn't update the DB or the UI (to be fixed next)
## Test Result Summary

| Action           | DB Updated   | UI Updated   | ESP log |
| ---------------- | ------------ | ------------ | ------- |
| ESP Button Press | ✅ (via sync) | ✅ (after 5s) | ✅       |
| Web Button Press | ❌ Not yet    | ❌ Not yet    | ❌       |
## What's Working Now
* ✅ Flask polls ESP every 5s and syncs all logs to PostgreSQL
* ✅ `GET /api/logs/today` returns merged result for today
* ✅ Web UI fetches and displays real counts
* ✅ Tailwind styling looks good
## Next Steps (Day 4)
* ~~Fix React button `onClick()` to call `postLogEntry(color)`~~
* ~~Ensure web button logs go to Flask → PostgreSQL~~
* ~~Add calendar or per-day history view (log export)~~
