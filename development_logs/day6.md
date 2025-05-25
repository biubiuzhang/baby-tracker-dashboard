# Day 6 - MQTT Setup

## Feature Goals

* Migrate ESP32-to-RPi logging from IP polling to MQTT.
* Enable real-time updates for both:

  * "Today’s Activities" summary table (by category).
  * "Past Activities" detailed logs (by timestamp).
* Ensure both ESP32 button presses and web UI button clicks result in correct logging and instant UI updates.
* Clean up bugs from yesterday’s logic (e.g., timestamp display delay, table desync).

## Fixes and Debugging Highlights

### 1. MQTT Message Parsing

* ESP32 now publishes JSON like:

  ```json
  { "timestamp": "2025-05-25 13:17:42", "color": "Yellow" }
  ```
* ✅ Flask MQTT subscriber parses it and inserts into database.

### 2. Root Cause of “Today’s Table Empty”

* Problem: `fetchTodayLogs()` returned `{ logs: [...] }`, but frontend tried to access `.logs` again:

  ```js
  setTodayLogs(data.logs || []); // ❌
  ```
* ✅ Fixed by simplifying:

  ```js
  const logs = await fetchTodayLogs();
  setTodayLogs(logs);
  ```

### 3. Verified Database Sync

* Debugged inconsistent history entries by checking PostgreSQL:

  ```bash
  sudo -u postgres psql
  ALTER USER babyuser WITH PASSWORD 'supersecret';
  psql -U babyuser -d babytracker -h localhost
  SELECT * FROM log_entry ORDER BY timestamp DESC;
  ```
* ✅ Confirmed entries were properly saved, but not always shown due to frontend not refreshing.

### 4. Real-Time Table Refresh via MQTT

* MQTT `onMessage()` was originally injecting `{ timestamp, color }` into `todayLogs`, corrupting the table structure.
* ✅ Fixed by triggering re-fetch:

  ```js
  loadTodayLogs();
  loadPreviousLogs(today); // ensures both views update
  ```

### 5. Web Button Didn’t Update History

* Clicking on the web UI button would update summary counts, but not the detailed activity list.
* ✅ Fixed `onLogAdded` in `<LogEntryForm />`:

  ```js
  onLogAdded={() => {
    loadTodayLogs();
    loadPreviousLogs(selectedDate);
  }}
  ```

### 6. WebSocket Spam & Fix

* Frontend was spamming:

  ```
  WebSocket connection to 'ws://rpi.local:9001/' failed
  ```
* ✅ Enabled WebSocket listener in Mosquitto config:

  ```ini
  listener 9001
  protocol websockets
  ```
* Restarted Mosquitto:

  ```bash
  sudo systemctl restart mosquitto
  ```
  
## PostgreSQL Database Access (Full Details)

### DB User & Password

* **Username:** `babyuser`
* **Password:** `supersecret`
* **Database:** `babytracker`

> These match what's used in your Flask app:
>
> ```python
> app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://babyuser:supersecret@localhost/babytracker'
> ```

### Check DB Entries via CLI

```bash
# Enter PostgreSQL as the 'postgres' superuser
sudo -u postgres psql

# Change password if needed:
ALTER USER babyuser WITH PASSWORD 'supersecret';

# Exit back to shell
\q

# Now login as babyuser
psql -U babyuser -d babytracker -h localhost
```

Inside the database shell:

```sql
-- Show latest 10 logs
SELECT * FROM log_entry ORDER BY timestamp DESC LIMIT 10;

-- Check counts by color (raw)
SELECT color, COUNT(*) FROM log_entry GROUP BY color;

-- Check today's logs
SELECT * FROM log_entry WHERE timestamp::date = CURRENT_DATE ORDER BY timestamp DESC;
```

To exit PostgreSQL:

```sql
\q
```

### Table Structure (as inferred)

```sql
CREATE TABLE log_entry (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE,
  color TEXT
);
```

With this info, you can debug any DB issues, verify that ESP32 and web logs are inserted, and even build advanced queries later for analytics.

## Remaining Warnings / Cleanup

| Issue                                                  | Status                                         |
| ------------------------------------------------------ | ---------------------------------------------- |
| React warning: “Each child should have a unique `key`” | ✅ Resolved by using `key={activity}` in `<tr>` |
| Mixing data shapes in `todayLogs`                      | ✅ Fixed with clean `loadTodayLogs()`           |
| Table showed `[]` before data came in                  | Acceptable as it now re-renders immediately    |


## Future TODOs

* [ ] Filter out rows with `count === 0`
* [ ] Add toast/notification when new activity is logged
* [ ] Highlight the row or scroll into view on new log
* [ ] Visual chart (bar or timeline) of today’s activities
* [ ] Auto-export `.csv` logs for doctor visits
* [ ] Add weekly and monthly stats page

## Stack Recap

* **Frontend:** React (Bootstrap, Axios, MQTT)
* **Backend:** Flask + PostgreSQL + APScheduler
* **Device:** ESP32 (NTP time sync, SPIFFS logs, MQTT client)
* **Transport:** MQTT (via Mosquitto), HTTP GET/POST
