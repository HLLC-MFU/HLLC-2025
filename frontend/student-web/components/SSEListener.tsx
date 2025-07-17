import { addToast } from '@heroui/react';

import { useSSE } from '@/hooks/useSSE';
import { useSseStore } from '@/stores/useSseStore';

export default function SSEListener() {
  const fetchActivitiesByUser = useSseStore(
    state => state.fetchActivitiesByUser,
  );
  const fetchUserProgress = useSseStore(state => state.fetchUserProgress);
  const fetchNotification = useSseStore(state => state.fetchNotification);
  const setConnected = useSseStore(state => state.setConnected);

  useSSE(
    payload => {
      console.log('[SSE] received payload:', payload); // Should log *every* event

      if (!payload || typeof payload !== 'object') {
        console.warn('[SSE] payload invalid:', payload);

        return;
      }

      switch (payload.type) {
        case 'REFETCH_DATA': {
          const normalizedPath = (payload.path ?? '')
            .toLowerCase()
            .replace(/\/$/, '');

          console.log('[SSE] normalizedPath:', normalizedPath);

          switch (normalizedPath) {
            case '/activities/progress':
              fetchUserProgress();
              break;
            case '/activities/user':
              fetchActivitiesByUser();
              break;
            default:
              console.log('[SSE] Unhandled path:', normalizedPath);
              break;
          }
          break;
        }

        case 'REFETCH_NOTIFICATIONS':
          fetchNotification();
          break;

        case 'CHECKED_IN':
          fetchActivitiesByUser();
          addToast({
            title: 'Checked in',
            description: `You have been checked in to ${payload.data.activityNames} successfully`,
            color: 'success',
            variant: 'bordered',
          });
          break;

        default:
          console.log('[SSE] Unhandled type:', payload.type);
          break;
      }
    },
    err => {
      console.error('[SSE] error:', err);
      setConnected(false);
    },
  );

  return null;
}
