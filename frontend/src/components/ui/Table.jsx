import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className="table-container">
      <table className={`data-table ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) { return <thead>{children}</thead>; }
export function Tbody({ children }) { return <tbody>{children}</tbody>; }
export function Tr({ children, style = {} }) { return <tr style={style}>{children}</tr>; }
export function Th({ children, style = {} }) { return <th style={style}>{children}</th>; }
export function Td({ children, style = {}, colSpan }) { return <td style={style} colSpan={colSpan}>{children}</td>; }
