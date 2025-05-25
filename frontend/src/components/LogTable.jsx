import React from 'react';

export default function LogTable({ logs }) {
  const orderedActivities = ['Feed', 'Sleep', 'Stop', 'Poo', 'Pee'];

  const sortedLogs = orderedActivities.map((activity) => {
    const found = logs.find((log) => log.activity === activity);
    return found || { activity, count: 0 };
  });

  return (
    <table className="table table-bordered text-center">
      <thead>
        <tr>
          <th>Category</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {logs && logs.length > 0 ? (
          sortedLogs.map(({ activity, count }) => (
            <tr key={activity}>
              <td>{activity}</td>
              <td>{count}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="2" className="text-muted">No entries found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
