import React from 'react';

export default function StampButton({ label, variant, onClick, disabled, stamped }) {
  return (
    <button
      className={`stamp-btn stamp-${variant}${stamped ? ' stamped' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{label}</span>
    </button>
  );
}
