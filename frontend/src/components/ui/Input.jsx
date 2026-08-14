import React from 'react';
import Icon from './Icons';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  style = {},
  options = [], // For select
  helperText,
  icon = null,
  ...props
}) {
  const isSelect = type === 'select';
  const isFile = type === 'file';
  const controlId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="field" style={style}>
      {label && (
        <label htmlFor={controlId} className="field-label">
          {label} {required && <span className="req">*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              display: 'inline-flex',
              pointerEvents: 'none',
            }}
          >
            <Icon name={icon} size={17} />
          </span>
        )}

        {isSelect ? (
          <select
            id={controlId}
            className={`input-field ${icon ? 'input-with-icon' : ''} ${className}`}
            value={value}
            onChange={onChange}
            required={required}
            style={icon ? { paddingLeft: '2.5rem', cursor: 'pointer' } : { cursor: 'pointer' }}
            {...props}
          >
            {options.map((opt, i) => (
              <option key={i} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={controlId}
            className={`input-field ${className}`}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            {...props}
          />
        ) : (
          <input
            id={controlId}
            type={isFile ? 'file' : type}
            className={`input-field ${icon ? 'input-with-icon' : ''} ${className}`}
            value={isFile ? undefined : value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            style={icon ? { paddingLeft: '2.5rem' } : undefined}
            {...props}
          />
        )}
      </div>

      {helperText && (
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>
          {helperText}
        </span>
      )}
    </div>
  );
}
