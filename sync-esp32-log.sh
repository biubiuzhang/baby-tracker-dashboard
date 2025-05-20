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
