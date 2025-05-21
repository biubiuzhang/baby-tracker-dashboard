import React from 'react';

export default function LogTable({ logs }) {
  if (!logs || typeof logs !== 'object') return null;

  const entries = Object.entries(logs.counts || {});

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Category</th>
            <th className="border px-4 py-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([type, count]) => (
            <tr key={type} className="text-center">
              <td className="border px-4 py-2">{type}</td>
              <td className="border px-4 py-2">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
