import React from 'react';

export default function Badge({ children, type = 'info', className = '' }) {
  const badgeClass = `badge-${type}`;
  return (
    <span className={`badge ${badgeClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
