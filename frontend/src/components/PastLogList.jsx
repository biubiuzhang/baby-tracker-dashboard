import React from 'react';

const ACTIVITY_ICONS = {
  Feeding: '🍼',
  'Diaper Change': '🧷',
  Pee: '💧',
  Poo: '💩',
  Bath: '🛁',
  'Power-on': '⚡'
};

export default function PastLogList({ logs }) {
  if (!logs || logs.length === 0) {
    return <p className="text-muted text-center">No logs found for this date.</p>;
  }

  return (
    <ul className="list-group">
      {logs.map((entry, i) => {
        const timeOnly = entry.time.split(' ')[1] || entry.time;
        const icon = ACTIVITY_ICONS[entry.activity] || '❓';

        return (
          <li key={i} className="list-group-item">
            <span style={{ fontSize: '1.2rem' }}>{icon}</span> {timeOnly} – {entry.activity}
          </li>
        );
      })}
    </ul>
  );
}
