"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { FilterPanelProps } from '../types';

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      status: e.target.value as 'all' | 'online' | 'offline',
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-dark-bg/50 border border-bright-blue/20 rounded-lg mb-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-bright-blue/50" />
        <input
          type="text"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 bg-dark-bg/50 border border-bright-blue/20 rounded-lg
                   text-text placeholder-text/50 focus:outline-none focus:border-bright-blue/50
                   transition-colors"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-text whitespace-nowrap">
          Status:
        </label>
        <select
          id="status-filter"
          value={filters.status}
          onChange={handleStatusChange}
          className="px-4 py-2 bg-dark-bg/50 border border-bright-blue/20 rounded-lg
                   text-text focus:outline-none focus:border-bright-blue/50
                   transition-colors cursor-pointer"
        >
          <option value="all">All</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>
    </div>
  );
};
