# Day 8 - Database Migration

PostgreSQL database dropped and reinitialized to support:

`users, devices, events, feed_details, boot_details`

Added schema to:

Separate `feed/sleep` events into start/stop with volume tracking

Record boot reason on power-up events

Verified through psql queries that feed start/stop pairs are correctly saved with associated volume

## Flask Backend Enhancements:

Rebuilt /api/logs/today:

Counts only start events for feed and sleep

Correctly filters pee, poo, pee+poo, reserved

Rebuilt /api/logs/<date> and /api/logs/export/<date>:

Returns detailed logs including:

timestamp, event, action, volume_ml (for feed), and reason (for boot)

Added /api/stats/summary/today and /api/stats/days:

Reports daily total diaper count and formula volume

React Frontend Updates:

Replaced old postLogEntry with postEvent supporting event, action, and volume

## DashboardPage:

Reloads today's summary and historical logs when MQTT receives messages

PastLogList:

Shows logs in a user-friendly format:

e.g., "Feed Start", "Feed Stop (120ml)", "Boot (Power-on)"

LogTable:

Counts only start events for feed/sleep

LogEntryForm:

When clicking "Feed" or "Sleep", button label switches to "Feeding..." or "Sleeping..."

Clicking again sends stop event

Feeding stop prompts for volume entry in the browser

Fixed missing CSS issue by restoring index.css import in main.jsx

## Debugging & Fixes:

Resolved Permission denied for schema public by adjusting PostgreSQL user grants

Fixed Flask blueprint route collision due to duplicate get_today_summary endpoint name

Validated ESP MQTT messages were triggering UI updates and database inserts

Verified API responses via browser and console.log to ensure proper display