import React from 'react';
import { postLogEntry } from '../api';

const ACTIVITY_BUTTONS = [
  { label: 'Bath', color: 'Black' },
  { label: 'Diaper Change', color: 'Red' },
  { label: 'Feeding', color: 'Blue' },
  { label: 'Pee', color: 'Green' },
  { label: 'Poo', color: 'Yellow' }
];

export default function LogEntryForm({ onLogAdded }) {
  const handleClick = async (color) => {
    await postLogEntry(color); // ✅ Uses your prebuilt axios wrapper
    onLogAdded();
  };

  return (
    <>
      {ACTIVITY_BUTTONS.map(({ label, color }) => (
        <button
          key={color}
          className="btn btn-outline-primary fw-semibold"
          onClick={() => handleClick(color)}
        >
          {label} ({color})
        </button>
      ))}
    </>
  );
}
