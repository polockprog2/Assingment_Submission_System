import React from 'react';
import Icon from './Icons';

export default function Card({
  children,
  title,
  subtitle,
  icon = null,
  action = null,
  hoverable = false,
  className = '',
  style = {},
  padding = '1.75rem',
}) {
  const classes = ['glass-panel'];
  if (hoverable) classes.push('card-hover');
  if (className) classes.push(className);

  return (
    <div className={classes.join(' ')} style={{ padding, ...style }}>
      {(title || subtitle || icon || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            {icon && (
              <div className="header-icon" style={{ width: 42, height: 42, borderRadius: 12 }}>
                <Icon name={icon} size={20} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              {title && <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>{title}</h3>}
              {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '0.2rem' }}>{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
