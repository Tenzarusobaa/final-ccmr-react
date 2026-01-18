// src/components/tables/DataTable.js
import React from 'react';
import './DataTable.css';

const DataTable = ({ data, columns, type, onRowClick, onSort, sortConfig }) => {
  if (!data || data.length === 0) {
    return <div className="no-records">No records found.</div>;
  }

  const handleSort = (columnKey) => {
    if (!onSort) return;
    
    const isSortable = columns.find(col => col.key === columnKey)?.sortable;
    if (!isSortable) return;

    let direction = 'asc';
    if (sortConfig && sortConfig.key === columnKey) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    onSort({ key: columnKey, direction });
  };

  const getSortIndicator = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="table-scroll-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                onClick={() => handleSort(column.key)}
                className={column.sortable ? 'sortable' : ''}
              >
                <span className="column-header-content">
                  {column.label}
                  {column.sortable && (
                    <span className="sort-indicator">
                      {getSortIndicator(column.key)}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr 
              key={row.caseNo || `row-${index}`} 
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;