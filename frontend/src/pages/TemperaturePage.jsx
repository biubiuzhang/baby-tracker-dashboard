import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer
} from 'recharts';

export default function TemperaturePage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/temp_data.json')
      .then((res) => res.json())
      .then((raw) => {
        const formatted = raw.map(entry => ({
          ...entry,
          time: entry.timestamp.slice(11, 16)  // "HH:MM" format
        }));
        setData(formatted);
      })
      .catch(err => {
        console.error('Failed to load temperature data:', err);
      });
  }, []);

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">📈 Temperature Log</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis domain={[24, 28]} unit="°C" tick={{ fontSize: 12 }} />
          <Tooltip />
          <ReferenceLine y={25} stroke="red" strokeDasharray="4 2" label="25°C Limit" />
          <Line type="monotone" dataKey="temperature" stroke="#007bff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
