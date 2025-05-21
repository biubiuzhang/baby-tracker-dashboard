import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LogEntryForm from '../components/LogEntryForm';
import LogTable from '../components/LogTable';
import { fetchTodayLogs } from '../api';

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    try {
      const data = await fetchTodayLogs();
      console.log('Fetched logs:', data); // ✅ Debug log
      setLogs(data);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError('Failed to load logs');
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto p-4">
        <LogEntryForm onLogAdded={loadLogs} />
        {error ? (
          <div className="text-red-500 font-semibold my-4">{error}</div>
        ) : (
          <LogTable logs={logs} />
        )}
      </main>
    </div>
  );
}
