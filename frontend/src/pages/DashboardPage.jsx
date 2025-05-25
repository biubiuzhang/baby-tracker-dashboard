import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import LogEntryForm from '../components/LogEntryForm';
import LogTable from '../components/LogTable';
import DateSelector from '../components/DateSelector';
import PastLogList from '../components/PastLogList';
import { fetchTodayLogs, fetchLogsByDate } from '../api';

export default function DashboardPage() {
  const [todayLogs, setTodayLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    // Add 8 hours offset manually (milliseconds)
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 10);
  });
  const [previousLogs, setPreviousLogs] = useState([]);
  const [error, setError] = useState(null);

  // Load today's logs once on mount
  const loadTodayLogs = async () => {
    try {
      const logs = await fetchTodayLogs();
      setTodayLogs(logs);
    } catch (err) {
      console.error('Error loading today logs:', err);
      setError("Failed to load today's logs");
    }
  };

  // Load past logs for selected date
  const loadPreviousLogs = async (date) => {
    try {
      const res = await fetchLogsByDate(date);
      setPreviousLogs(res.entries || []);
    } catch (err) {
      console.error('Error loading previous logs:', err);
      setPreviousLogs([]);
    }
  };

  // Initial load of today's logs
  useEffect(() => {
    loadTodayLogs();
  }, []);

  // Load selected date's logs when it changes
  useEffect(() => {
    loadPreviousLogs(selectedDate);
  }, [selectedDate]);

  // MQTT subscription for real-time log updates
  useEffect(() => {
    const client = mqtt.connect('ws://rpi.local:9001'); // or your broker address
  
    client.on('connect', () => {
      client.subscribe('esp32/babytracker/logs');
      console.log("[MQTT] Connected ✅");
      console.log("[MQTT] Subscribed to topic 🔁");
    });
  
    client.on('message', (topic, message) => {
      try {
        const { timestamp, color } = JSON.parse(message.toString());
        const logDate = timestamp.slice(0, 10);  // This is from ESP32 (China TZ)
  
        // ✅ Force browser to use GMT+8 (China time)
        const nowCN = new Date().toLocaleString('en-CA', {
          timeZone: 'Asia/Shanghai'
        }).slice(0, 10); // Format: YYYY-MM-DD
  
        console.log(`[MQTT] ESP Date: ${logDate}, Browser CN Date: ${nowCN}`);
  
        if (logDate === nowCN) {
          console.log("[MQTT] Message is for today (CN), reloading...");
          loadTodayLogs();
          loadPreviousLogs(nowCN);
        } else {
          console.log("[MQTT] Message is not for today, ignoring.");
        }
      } catch (err) {
        console.error('[MQTT] Failed to parse MQTT message:', err);
      }
    });
  
    return () => client.end();
  }, []);  

  console.log("Logs going to LogTable:", todayLogs);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <main className="container py-5">
        {/* ✅ Section 1: Today's Log */}
        <h3 className="text-center mb-4">Today's Activities</h3>
        <div className="mb-4 d-flex flex-wrap justify-content-center gap-2">
          <LogEntryForm onLogAdded={() => {
            loadTodayLogs();
            loadPreviousLogs(selectedDate);
            }} />
        </div>

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : (
          <div className="table-responsive mb-5">
            <LogTable logs={todayLogs} />
          </div>
        )}

        {/* ➕ Section 2: Historical Logs */}
        <hr />
        <h3 className="text-center mb-4">Past Activities</h3>
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

        <div className="mt-3">
          <PastLogList logs={previousLogs} />
        </div>
      </main>
    </div>
  );
}
