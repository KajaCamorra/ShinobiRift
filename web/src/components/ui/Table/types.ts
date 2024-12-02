import { ReactNode } from 'react';

export interface Column<T, K extends keyof T = keyof T> {
  key: K;
  header: string;
  sortable?: boolean;
  render?: (value: T[K], row: T) => ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortConfig?: {
    key: keyof T;
    direction: 'asc' | 'desc';
  };
  className?: string;
}

export type SortDirection = 'asc' | 'desc';
