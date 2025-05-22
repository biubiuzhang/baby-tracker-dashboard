import React, { useEffect, useState } from 'react';
import { checkESPStatus } from '../api';

export default function Navbar() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const isOnline = await checkESPStatus();
        setOnline(isOnline);
      } catch (err) {
        console.error('ESP status check failed:', err);
        setOnline(false);
      }
    };

    fetchStatus(); // Initial check
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Clean up
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
      <span className="navbar-brand fw-bold fs-4">
        👶 Baby Tracker
      </span>

      <span className="ms-auto">
        <span className={`badge ${online ? 'bg-success' : 'bg-secondary'}`}>
          ESP32: {online ? 'Online' : 'Offline'}
        </span>
      </span>
    </nav>
  );
}
