import React from 'react';
import Icon from './Icons';

const ICONS = { error: 'alert', success: 'checkCircle', warning: 'alert', info: 'info' };

export default function Alert({ type = 'error', message, className = '', style = {} }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type} animate-fade-in ${className}`.trim()} style={style} role="alert">
      <Icon name={ICONS[type] || 'info'} size={18} />
      <span>{message}</span>
    </div>
  );
}
