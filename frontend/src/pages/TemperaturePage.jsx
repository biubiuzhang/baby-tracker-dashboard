import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts';

export default function TemperaturePage() {
  const [data, setData] = useState([]);
  const [dayAreas, setDayAreas] = useState([]);

  useEffect(() => {
    fetch('/temp_data.json')
      .then((res) => res.json())
      .then((raw) => {
        const formatted = raw.map(entry => {
          const date = new Date(entry.timestamp);
          const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          return {
            ...entry,
            dateTime: `${dateStr} ${timeStr}`,
            day: dateStr
          };
        });

        // Detect day change ranges for shading
        const areas = [];
        let currentDay = '';
        let start = '';
        for (let i = 0; i < formatted.length; i++) {
          const entry = formatted[i];
          if (entry.day !== currentDay) {
            if (start) {
              areas.push({ start, end: formatted[i - 1].dateTime });
            }
            currentDay = entry.day;
            start = entry.dateTime;
          }
        }
        // Push last day range
        if (start && formatted.length > 0) {
          areas.push({ start, end: formatted[formatted.length - 1].dateTime });
        }

        setData(formatted);
        setDayAreas(areas);
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
          <XAxis dataKey="dateTime" tick={{ fontSize: 12 }} />
          <YAxis domain={[24, 28]} unit="°C" tick={{ fontSize: 12 }} />
          <Tooltip />
          <ReferenceLine y={25} stroke="red" strokeDasharray="4 2" label="25°C Limit" />
          {dayAreas.map((area, index) => (
            index % 2 === 0 && (
              <ReferenceArea
                key={index}
                x1={area.start}
                x2={area.end}
                strokeOpacity={0}
                fill="#f0f0f0"
              />
            )
          ))}
          <Line type="monotone" dataKey="temperature" stroke="#007bff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
