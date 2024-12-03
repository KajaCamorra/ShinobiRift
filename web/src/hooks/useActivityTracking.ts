import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

interface UseActivityTrackingOptions {
  updateInterval?: number; // in milliseconds
  inactivityThreshold?: number; // in milliseconds
}

export function useActivityTracking(options: UseActivityTrackingOptions = {}) {
  const {
    updateInterval = 5 * 60 * 1000, // 5 minutes
    inactivityThreshold = 15 * 60 * 1000, // 15 minutes
  } = options;

  const { user } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const updateTimerRef = useRef<NodeJS.Timeout>();
  const activityChannelRef = useRef<BroadcastChannel | null>(null);

  const updateActivity = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}/update-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
          'X-Session-Token': user.sessionToken,
        },
      });

      if (!response.ok) {
        console.error('Failed to update activity status');
      }

      // Broadcast activity update to other tabs
      activityChannelRef.current?.postMessage({
        type: 'ACTIVITY_UPDATE',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [user]);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Initialize activity tracking
  useEffect(() => {
    if (!user) return;

    // Set up activity channel for cross-tab communication
    activityChannelRef.current = new BroadcastChannel('activity-sync');
    activityChannelRef.current.onmessage = (event) => {
      if (event.data.type === 'ACTIVITY_UPDATE') {
        lastActivityRef.current = event.data.timestamp;
      }
    };

    // Set up activity listeners
    const events = [
      'mousedown',
      'keydown',
      'touchstart',
      'mousemove',
      'scroll',
      'click',
      'focus',
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up periodic activity check and update
    const checkActivity = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity < inactivityThreshold) {
        await updateActivity();
      }
    };

    updateTimerRef.current = setInterval(checkActivity, updateInterval);

    // Initial activity update
    updateActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
      activityChannelRef.current?.close();
    };
  }, [user, handleActivity, updateActivity, updateInterval, inactivityThreshold]);

  // Handle page visibility changes
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, handleActivity, updateActivity]);

  return {
    updateActivity,
    lastActivity: lastActivityRef.current,
  };
}
