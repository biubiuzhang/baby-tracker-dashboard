import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import TemperaturePage from './pages/TemperaturePage'; // You'll create this file

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/temperature" element={<TemperaturePage />} />
      </Routes>
    </Router>
  );
}
