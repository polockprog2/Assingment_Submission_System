import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = '',
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  style = {},
  title,
  ...props
}) {
  const variantClass = variant.startsWith('btn-') ? variant : `btn-${variant}`;
  const sizeClass = size ? `btn-${size}` : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      title={title}
      {...props}
    >
      {loading ? <span className="btn-spinner" /> : icon}
      {children}
    </button>
  );
}
