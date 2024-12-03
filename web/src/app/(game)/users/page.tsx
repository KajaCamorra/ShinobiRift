"use client";

import React from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Table } from '@/components/ui/Table';
import { FilterPanel } from './components/FilterPanel';
import { User, getActivityStateColor, getActivityStateText } from './types';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Column, SortDirection } from '@/components/ui/Table/types';
import { useAuth } from '@/hooks/useAuth';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
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
      key: 'activityState',
      header: 'Status',
      sortable: true,
      render(_, row) {
        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                getActivityStateColor(row.activityState)
              )}
            />
            <span className="text-text">
              {getActivityStateText(row.activityState, row.lastActive)}
            </span>
          </div>
        );
      }
    }
  ];

  // Show loading state while auth is initializing (except in dev mode)
  if (!IS_DEVELOPMENT && authLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-bright-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login prompt if not authenticated (except in dev mode)
  if (!IS_DEVELOPMENT && !currentUser) {
    return (
      <div className="p-4 text-red-500">
        Please log in to view users
      </div>
    );
  }

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
          {IS_DEVELOPMENT && ' (Development Mode)'}
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
