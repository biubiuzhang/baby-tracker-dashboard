import React from 'react';
import { Form } from 'react-bootstrap';

export default function DateSelector({ selectedDate, onChange }) {
  return (
    <Form.Group className="mb-4 text-center">
      <Form.Label>Select Date</Form.Label>
      <Form.Control
        type="date"
        value={selectedDate}
        onChange={(e) => onChange(e.target.value)}
        style={{ maxWidth: '300px', margin: '0 auto' }}
      />
    </Form.Group>
  );
}
