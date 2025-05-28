import React, { useState } from 'react';
import { postEvent } from '../api';

export default function LogEntryForm({ onLogAdded }) {
  const [feeding, setFeeding] = useState(false);
  const [sleeping, setSleeping] = useState(false);

  const handleClick = async (color) => {
    const eventMap = {
      Green: 'feed',
      Blue: 'sleep',
      Black: 'reserved',
      Red: 'poo',
      Yellow: 'pee'
    };

    const event = eventMap[color];

    try {
      if (color === 'Green') {
        const action = feeding ? 'stop' : 'start';

        let volume = 0;
        if (action === 'stop') {
          const input = prompt('Enter formula volume in ml:', '0');
          volume = parseInt(input, 10);
          if (isNaN(volume)) volume = 0;
        }

        await postEvent(event, action, volume);
        setFeeding(!feeding);
      } else if (color === 'Blue') {
        const action = sleeping ? 'stop' : 'start';
        await postEvent(event, action);
        setSleeping(!sleeping);
      } else if (color === 'Black') {
        await postEvent('reserved');
        setFeeding(false);
        setSleeping(false);
      } else {
        await postEvent(event);
      }

      onLogAdded();
    } catch (err) {
      console.error('Failed to submit log:', err);
    }
  };

  const buttons = [
    {
      color: 'Green',
      label: feeding ? 'Feeding...' : 'Feed',
      className: 'btn-success'
    },
    {
      color: 'Blue',
      label: sleeping ? 'Sleeping...' : 'Sleep',
      className: 'btn-primary'
    },
    {
      color: 'Black',
      label: 'Reserved',
      className: 'btn-dark'
    },
    {
      color: 'Red',
      label: 'Poo',
      className: 'btn-danger'
    },
    {
      color: 'Yellow',
      label: 'Pee',
      className: 'btn-warning text-dark'
    }
  ];

  return (
    <>
      {buttons.map(({ color, label, className }) => (
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
