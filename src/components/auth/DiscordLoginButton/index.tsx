"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface DiscordLoginButtonProps {
  className?: string;
}

export function DiscordLoginButton({ className = '' }: DiscordLoginButtonProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    let popup: Window | null = null;

    try {
      // Open popup centered
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      popup = window.open(
        `/api/auth/discord`,
        'Discord Login',
        `width=${width},height=${height},top=${top},left=${left},status=yes,toolbar=no,menubar=no,location=no`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please enable popups for this site.');
      }

      const result = await new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'ERROR') {
            reject(new Error(event.data.data?.message || 'Authentication failed'));
          }

          if (event.data.type === 'SUCCESS') {
            resolve(event.data.data);
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication window was closed'));
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (popup && !popup.closed) popup.close();
          reject(new Error('Authentication timed out'));
        }, 5 * 60 * 1000);
      });

      console.log('Login successful:', result);
      await login(result);
      router.push('/game');

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      if (popup && !popup.closed) popup.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-100/10 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`
          flex items-center justify-center gap-2 
          w-full px-4 py-2 
          bg-[#5865F2] hover:bg-[#4752C4] 
          text-white rounded-md
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <DiscordIcon className="w-5 h-5" />
        <span>{loading ? 'Connecting...' : 'Continue with Discord'}</span>
      </button>
    </div>
  );
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);