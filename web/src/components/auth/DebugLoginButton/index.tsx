'use client';

import { useAuth } from '@/contexts/AuthContext';

export function DebugLoginButton() {
  const { debugLogin } = useAuth();

  const handleClick = async () => {
    console.log('Debug login button clicked');
    try {
      await debugLogin?.();
      console.log('Debug login successful');
    } catch (error) {
      console.error('Debug login failed:', error);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !process.env.NEXT_PUBLIC_ENABLE_DEBUG_AUTH) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
    >
      Debug Login
    </button>
  );
}
