"use client";

import React from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Table } from '@/components/ui/Table';
import { FilterPanel } from './components/FilterPanel';
import { User } from './types';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Column, SortDirection } from '@/components/ui/Table/types';

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig
  } = useUsers();

  const columns: Column<User>[] = [
    {
      key: 'avatarUrl',
      header: '',
      sortable: false,
      render(value, row) {
        const avatarUrl = value as string | undefined;
        return (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-bright-blue/10 border border-bright-blue/20">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${row.displayName}'s avatar`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-bright-blue/50">
                {row.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'displayName',
      header: 'Username',
      sortable: true,
      render(value, row) {
        const displayName = value as string;
        return (
          <Link
            href={row.profileUrl}
            className="text-bright-blue hover:text-bright-blue/80 transition-colors"
          >
            {displayName}
          </Link>
        );
      }
    },
    {
      key: 'isOnline',
      header: 'Status',
      sortable: true,
      render(value, row) {
        const isOnline = value as boolean;
        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                isOnline
                  ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  : "bg-gray-400"
              )}
            />
            <span className="text-text">
              {isOnline ? "Online" : `Last seen ${formatLastActive(row.lastActive)}`}
            </span>
          </div>
        );
      }
    }
  ];

  const formatLastActive = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      const remainingMinutes = minutes % 60;
      return `${hours} hours ${remainingMinutes} minutes ago`;
    } else if (days < 2) {
      const remainingHours = hours % 24;
      return `1 day ${remainingHours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading users: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-goldman text-bright-blue mb-2">Users</h1>
        <p className="text-text/80">
          View and manage users in your network
        </p>
      </div>

      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
      />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-bright-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table<User>
          data={users}
          columns={columns}
          sortConfig={sortConfig}
          onSort={(key: keyof User, direction: SortDirection) => setSortConfig({ key, direction })}
          className="bg-dark-bg/50 border border-bright-blue/20 rounded-lg overflow-hidden"
        />
      )}
    </div>
  );
}
