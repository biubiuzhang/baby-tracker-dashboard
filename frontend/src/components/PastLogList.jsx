import React from 'react';

const ACTIVITY_ICONS = {
  feed: '🍼',
  sleep: '😴',
  pee: '💧',
  poo: '💩',
  'pee+poo': '🧷',
  reserved: '🛑',
  boot: '⚡'
};

export default function PastLogList({ logs }) {
  if (!logs || logs.length === 0) {
    return <p className="text-muted text-center">No logs found for this date.</p>;
  }

  return (
    <ul className="list-group">
      {logs.map((entry, i) => {
        const timeOnly = (entry.timestamp || '').split(' ')[1];
        const event = entry.event?.toLowerCase() || 'unknown';
        const action = entry.action?.toLowerCase();
        const icon = ACTIVITY_ICONS[event] || '❓';

        let label = '';

        if (event === 'feed') {
          if (action === 'start') {
            label = 'Feed Start';
          } else if (action === 'stop') {
            label = `Feed Stop (${entry.volume_ml || 0}ml)`;
          } else {
            label = 'Feed';
          }
        } else if (event === 'sleep') {
          if (action === 'start') {
            label = 'Sleep Start';
          } else if (action === 'stop') {
            label = 'Sleep Stop';
          } else {
            label = 'Sleep';
          }
        } else if (event === 'boot') {
          label = `Boot (${entry.reason || 'Unknown'})`;
        } else {
          label = event.charAt(0).toUpperCase() + event.slice(1);
        }

        return (
          <li key={i} className="list-group-item">
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>{' '}
            {timeOnly || '??:??'} – {label}
          </li>
        );
      })}
    </ul>
  );
}
