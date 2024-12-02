import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableProps, Column, SortDirection } from './types';

export function Table<T>({
  data,
  columns,
  onSort,
  sortConfig,
  className
}: TableProps<T>) {
  const [localSortConfig, setLocalSortConfig] = useState<{
    key: keyof T;
    direction: SortDirection;
  } | null>(null);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = column.key;
    const isAsc = (sortConfig?.key === key && sortConfig?.direction === 'asc') ||
                 (localSortConfig?.key === key && localSortConfig?.direction === 'asc');
    const direction: SortDirection = isAsc ? 'desc' : 'asc';

    if (onSort) {
      onSort(key, direction);
    } else {
      setLocalSortConfig({ key, direction });
    }
  };

  const getSortedData = () => {
    if (!localSortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[localSortConfig.key];
      const bValue = b[localSortConfig.key];

      if (aValue === bValue) return 0;
      
      const modifier = localSortConfig.direction === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });
  };

  const displayData = onSort ? data : getSortedData();
  const currentSortConfig = onSort ? sortConfig : localSortConfig;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-dark-bg/50 border-b border-bright-blue/20">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => column.sortable && handleSort(column)}
                className={cn(
                  "px-4 py-3 text-left text-bright-blue font-goldman",
                  "text-sm whitespace-nowrap",
                  column.sortable && "cursor-pointer hover:bg-bright-blue/10"
                )}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp
                        className={cn(
                          "w-3 h-3 -mb-1",
                          currentSortConfig?.key === column.key &&
                          currentSortConfig?.direction === 'asc'
                            ? "text-bright-blue"
                            : "text-bright-blue/30"
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "w-3 h-3",
                          currentSortConfig?.key === column.key &&
                          currentSortConfig?.direction === 'desc'
                            ? "text-bright-blue"
                            : "text-bright-blue/30"
                        )}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, index) => (
            <tr
              key={index}
              className="border-b border-bright-blue/10 hover:bg-bright-blue/5"
            >
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-text"
                  >
                    {column.render
                      ? column.render(value, row)
                      : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
