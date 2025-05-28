#!/bin/bash

ESP32_IP="192.168.50.144"
DEST_DIR="/home/pi/baby-logs"

mkdir -p "$DEST_DIR"

while true; do
  TODAY=$(date '+%Y-%m-%d')
  TODAY_FILE="log-${TODAY}.txt"

  # 1. Sync today's log
  curl -sf "http://${ESP32_IP}/log?file=${TODAY_FILE}" -o "$DEST_DIR/$TODAY_FILE"

  if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Synced $TODAY_FILE from ESP32"

    # 2. Get list of files from ESP32
    FILES=$(curl -sf "http://${ESP32_IP}/" | grep -oP 'log-\d{4}-\d{2}-\d{2}\.txt')

    for FILE in $FILES; do
      if [[ "$FILE" != "$TODAY_FILE" ]]; then
        DELETE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://${ESP32_IP}/clear-log?file=$FILE")
        if [ "$DELETE_RESPONSE" = "200" ]; then
          echo "[$(date)] 🧹 Deleted $FILE from ESP32"
        elif [ "$DELETE_RESPONSE" = "404" ]; then
          echo "[$(date)] ⚠️  $FILE not found on ESP32 (already deleted?)"
        else
          echo "[$(date)] ❌ Failed to delete $FILE from ESP32 (HTTP $DELETE_RESPONSE)"
        fi
      fi
    done
  else
    echo "[$(date)] ❌ Failed to sync $TODAY_FILE from ESP32"
  fi

  sleep 600  # Retry every 10 minutes
done
