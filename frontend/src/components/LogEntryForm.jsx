import React from 'react';
import { postLogEntry } from '../api';

const BUTTONS = [
  { color: 'Black', label: 'Bath', className: 'btn-dark' },
  { color: 'Red', label: 'Diaper Change', className: 'btn-danger' },
  { color: 'Blue', label: 'Feeding', className: 'btn-primary' },
  { color: 'Green', label: 'Pee', className: 'btn-success' },
  { color: 'Yellow', label: 'Poo', className: 'btn-warning text-dark' }
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
