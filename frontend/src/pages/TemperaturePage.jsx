import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts';

export default function TemperaturePage() {
  const [fullData, setFullData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dayAreas, setDayAreas] = useState([]);
  const [showAll, setShowAll] = useState(false);

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
            iso: date.toISOString(),
            day: dateStr
          };
        });

        setFullData(formatted);
        updateChart(formatted, false); // Show last day by default
      })
      .catch(err => {
        console.error('Failed to load temperature data:', err);
      });
  }, []);

  const updateChart = (all, showAll) => {
    let data = all;
    if (!showAll) {
      const lastDay = all[all.length - 1]?.day;
      data = all.filter(e => e.day === lastDay);
    }

    const areas = [];
    let currentDay = '';
    let start = '';
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      if (entry.day !== currentDay) {
        if (start) areas.push({ start, end: data[i - 1].dateTime });
        currentDay = entry.day;
        start = entry.dateTime;
      }
    }
    if (start && data.length > 0) {
      areas.push({ start, end: data[data.length - 1].dateTime });
    }

    setFilteredData(data);
    setDayAreas(areas);
    setShowAll(showAll);
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">🌡 Temperature Log</h2>

      <div className="text-center mb-3">
        <button className="btn btn-outline-primary btn-sm" onClick={() => updateChart(fullData, !showAll)}>
          {showAll ? "🔍 Show Latest Day" : "📅 Show All Days"}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateTime"
            tick={{ fontSize: 12 }}
            interval={Math.floor(filteredData.length / 10)}
            tickFormatter={v => v.slice(5)} // Show MM-DD HH:mm
          />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} unit="°C" tick={{ fontSize: 12 }} />
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
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#007bff"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
