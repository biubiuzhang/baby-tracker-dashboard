import React from 'react';
import { postLogEntry } from '../api';

const BUTTONS = [
  { color: 'Green', label: 'Feed', className: 'btn-success' },
  { color: 'Blue', label: 'Sleep', className: 'btn-primary' },
  { color: 'Black', label: 'Stop', className: 'btn-dark' },
  { color: 'Red', label: 'Poo', className: 'btn-danger' },
  { color: 'Yellow', label: 'Pee', className: 'btn-warning text-dark' }
];

export default function LogEntryForm({ onLogAdded }) {
  const handleClick = async (color) => {
    try {
      await postLogEntry(color);
      onLogAdded();
    } catch (err) {
      console.error('Failed to submit log:', err);
    }
  };

  return (
    <>
      {BUTTONS.map(({ color, label, className }) => (
        <button
          key={color}
          onClick={() => handleClick(color)}
          className={`btn ${className}`}
          style={{ minWidth: '140px' }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
