import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import Navbar from '../components/Navbar';
import LogEntryForm from '../components/LogEntryForm';
import LogTable from '../components/LogTable';
import DateSelector from '../components/DateSelector';
import PastLogList from '../components/PastLogList';
import { fetchTodayLogs, fetchLogsByDate } from '../api';

export default function DashboardPage() {
  const [todayLogs, setTodayLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
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
    const client = mqtt.connect('ws://rpi.local:9001'); // Adjust if needed

    client.on('connect', () => {
      client.subscribe('esp32/babytracker/logs');
    });

    client.on('message', (topic, message) => {
      try {
        const { timestamp, color } = JSON.parse(message.toString());
        const logDate = timestamp.slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
    
        if (logDate === today) {
          // ❌ DON'T directly push { timestamp, color }
          // ✅ Instead: re-fetch the full log counts from backend
          loadTodayLogs(); // this fetches /api/logs/today and gives updated counts
          loadPreviousLogs(today); // this fetches /api/logs/export/${logDate} and gives the full log entries
        }
      } catch (err) {
        console.error('Failed to parse MQTT message:', err);
      }
    });

    return () => client.end();
  }, []);

  console.log("Logs going to LogTable:", todayLogs);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="container py-5">
        {/* ✅ Section 1: Today's Log */}
        <h3 className="text-center mb-4">Today's Activities</h3>
        <div className="mb-4 d-flex flex-wrap justify-content-center gap-2">
          <LogEntryForm onLogAdded={() => {
            loadTodayLogs;
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
