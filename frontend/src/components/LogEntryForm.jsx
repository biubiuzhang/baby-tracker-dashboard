import React from 'react';
import { postLogEntry } from '../api';

export default function LogEntryForm({ onLogAdded }) {
  const handleClick = async (type) => {
    await postLogEntry(type);
    onLogAdded();
  };

  return (
    <div className="flex justify-center my-6 gap-4">
      {['Feed', 'Diaper', 'Sleep'].map((type) => (
        <button
          key={type}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleClick(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
