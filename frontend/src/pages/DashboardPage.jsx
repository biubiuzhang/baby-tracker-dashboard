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
      console.log('Fetched logs:', data);
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
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="container py-5">
        <div className="mb-4 d-flex flex-wrap justify-content-center gap-2">
          <LogEntryForm onLogAdded={loadLogs} />
        </div>

        {error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : (
          <div className="table-responsive">
            <LogTable logs={logs} />
          </div>
        )}
      </main>
    </div>
  );
}
