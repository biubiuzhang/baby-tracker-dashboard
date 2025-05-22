import React, { useEffect, useState } from 'react';
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

  const loadTodayLogs = async () => {
    try {
      const data = await fetchTodayLogs();
      setTodayLogs(data);
    } catch (err) {
      console.error('Error loading today logs:', err);
      setError("Failed to load today's logs");
    }
  };

  const loadPreviousLogs = async (date) => {
    try {
      const res = await fetchLogsByDate(date);
      setPreviousLogs(res.entries || []);
    } catch (err) {
      console.error('Error loading previous logs:', err);
      setPreviousLogs([]);
    }
  };

  useEffect(() => {
    loadTodayLogs();
  }, []);

  useEffect(() => {
    loadPreviousLogs(selectedDate);
  }, [selectedDate]);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="container py-5">
        {/* ✅ Section 1: Today's Log */}
        <h3 className="text-center mb-4">Today's Activities</h3>
        <div className="mb-4 d-flex flex-wrap justify-content-center gap-2">
          <LogEntryForm onLogAdded={loadTodayLogs} />
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
