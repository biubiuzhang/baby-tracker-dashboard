import React from 'react';

export default function LogTable({ logs }) {
  if (!logs || typeof logs !== 'object') return null;

  const entries = Object.entries(logs.counts || {});

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-hover text-center align-middle">
        <thead className="table-light">
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([type, count]) => (
            <tr key={type}>
              <td>{type}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
