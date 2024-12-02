"use client";

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to your preferred error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg">
          <div className="max-w-md p-6 text-center">
            <AlertCircle className="w-12 h-12 text-bright-blue mx-auto mb-4" />
            <h2 className="text-2xl font-goldman text-bright-blue mb-4">
              Something went wrong
            </h2>
            <p className="text-text/80 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 mx-auto
                       px-4 py-2 bg-bright-blue/10 text-bright-blue
                       border border-bright-blue/20 rounded
                       hover:bg-bright-blue/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}