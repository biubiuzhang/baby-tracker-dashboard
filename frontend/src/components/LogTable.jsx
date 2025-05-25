import React from 'react';

export default function LogTable({ logs }) {
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
          logs.map(({ activity, count }, index) => (
            <tr key={`${activity}-${index}`}>
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
