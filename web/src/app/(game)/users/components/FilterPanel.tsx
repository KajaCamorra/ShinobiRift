"use client";

import React from 'react';
import { UserFilters } from '../types';

interface FilterPanelProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full px-4 py-2 bg-dark-bg/50 border border-bright-blue/20 rounded-lg text-text placeholder:text-text/50 focus:outline-none focus:border-bright-blue/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-text/80">Status:</label>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as UserFilters['status'] })}
          className="px-4 py-2 bg-dark-bg/50 border border-bright-blue/20 rounded-lg text-text focus:outline-none focus:border-bright-blue/50"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>
    </div>
  );
}
