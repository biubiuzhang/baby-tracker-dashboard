import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import LogEntryForm from '../components/LogEntryForm';
import LogTable from '../components/LogTable';
import DateSelector from '../components/DateSelector';
import PastLogList from '../components/PastLogList';
import { fetchTodaySummary, fetchLogsByDate } from '../api';

export default function DashboardPage() {
  const [todaySummary, setTodaySummary] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().slice(0, 10);
  });
  const [previousLogs, setPreviousLogs] = useState([]);
  const [error, setError] = useState(null);

  const loadTodaySummary = async () => {
    try {
      const summary = await fetchTodaySummary();
      setTodaySummary(summary);
    } catch (err) {
      console.error('Error loading today summary:', err);
      setError("Failed to load today's summary");
    }
  };

  const loadPreviousLogs = async (date) => {
    try {
      const res = await fetchLogsByDate(date);
      setPreviousLogs(res || []);
    } catch (err) {
      console.error('Error loading previous logs:', err);
      setPreviousLogs([]);
    }
  };

  useEffect(() => {
    loadTodaySummary();
  }, []);

  useEffect(() => {
    loadPreviousLogs(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const client = mqtt.connect('ws://rpi.local:9001');

    client.on('connect', () => {
      client.subscribe('esp32/babytracker/logs');
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const logDate = (payload.timestamp || payload.time || '').slice(0, 10);

        const nowCN = new Date().toLocaleString('en-CA', {
          timeZone: 'Asia/Shanghai'
        }).slice(0, 10);

        if (logDate === nowCN) {
          console.log("[MQTT] Message is for today (CN), reloading...");
          loadTodaySummary();
          loadPreviousLogs(nowCN);
        }
      } catch (err) {
        console.error('[MQTT] Failed to parse message:', err);
      }
    });

    return () => client.end();
  }, []);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <main className="container py-5">
        <h3 className="text-center mb-4">Today's Activities</h3>
        <div className="mb-4 d-flex flex-wrap justify-content-center gap-2">
          <LogEntryForm onLogAdded={() => {
            loadTodaySummary();
            loadPreviousLogs(selectedDate);
          }} />
        </div>

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : (
          <div className="table-responsive mb-5">
            <LogTable logs={todaySummary} />
          </div>
        )}

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
