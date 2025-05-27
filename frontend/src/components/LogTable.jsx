import React from 'react';

const ORDERED_ACTIVITIES = ['feed', 'sleep', 'reserved', 'poo', 'pee', 'pee+poo'];
const LABELS = {
  feed: 'Feed',
  sleep: 'Sleep',
  reserved: 'Reserved',
  poo: 'Poo',
  pee: 'Pee',
  'pee+poo': 'Pee+Poo'
};

const ICONS = {
  feed: '🍼',
  sleep: '😴',
  reserved: '⏹️',
  poo: '💩',
  pee: '💧',
  'pee+poo': '🧷'
};

export default function LogTable({ logs }) {
  const logMap = {};
  logs.forEach(({ activity, count }) => {
    if (activity) {
      logMap[activity.toLowerCase()] = count;
    }
  });

  const sortedLogs = ORDERED_ACTIVITIES.map((key) => ({
    activity: LABELS[key],
    icon: ICONS[key],
    count: logMap[key] || 0
  }));

  return (
    <table className="table table-bordered text-center">
      <thead>
        <tr>
          <th>Activity</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {sortedLogs.map(({ activity, icon, count }) => (
          <tr key={activity}>
            <td>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span> {activity}
            </td>
            <td>{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
