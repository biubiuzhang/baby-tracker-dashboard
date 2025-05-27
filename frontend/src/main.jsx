import 'bootstrap/dist/css/bootstrap.min.css'; // ✅ Add this if missing
import './App.css'; // Optional: your custom global styles

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';
import DashboardPage from './pages/DashboardPage';
import TemperaturePage from './pages/TemperaturePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'temperature', element: <TemperaturePage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
