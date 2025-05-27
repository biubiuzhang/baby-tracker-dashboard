import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
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

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
      <span className="navbar-brand fw-bold fs-4 me-4">👶 Baby Tracker</span>

      <div className="navbar-nav flex-row gap-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link ${isActive ? 'text-white fw-bold' : 'text-light'}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/temperature"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'text-white fw-bold' : 'text-light'}`
          }
        >
          Temperature
        </NavLink>
      </div>

      <span className="ms-auto">
        <span className={`badge rounded-pill ${online ? 'bg-success' : 'bg-secondary'}`}>
          ESP32: {online ? '✅ Online' : '❌ Offline'}
        </span>
      </span>
    </nav>
  );
}
