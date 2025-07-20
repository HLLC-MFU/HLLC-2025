import { useState } from 'react';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import { getToken } from '@/utils/storage';

interface RestrictionAction {
  userId: string;
  roomId: string;
  action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick';
  duration?: 'temporary' | 'permanent';
  timeValue?: number;
  timeUnit?: 'minutes' | 'hours';
  restriction?: 'can_view' | 'cannot_view';
  reason?: string;
}

export const useRestriction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRestrictionAction = async (actionData: RestrictionAction) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken('accessToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${CHAT_BASE_URL}/restriction/${actionData.action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${actionData.action} user`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${actionData.action} user`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (data: Omit<RestrictionAction, 'action'>) => {
    return executeRestrictionAction({ ...data, action: 'ban' });
  };

  const muteUser = async (data: Omit<RestrictionAction, 'action'>) => {
    return executeRestrictionAction({ ...data, action: 'mute' });
  };

  const kickUser = async (data: Omit<RestrictionAction, 'action'>) => {
    return executeRestrictionAction({ ...data, action: 'kick' });
  };

  const unbanUser = async (data: Pick<RestrictionAction, 'userId' | 'roomId'>) => {
    return executeRestrictionAction({ ...data, action: 'unban' });
  };

  const unmuteUser = async (data: Pick<RestrictionAction, 'userId' | 'roomId'>) => {
    return executeRestrictionAction({ ...data, action: 'unmute' });
  };

  return {
    loading,
    error,
    banUser,
    muteUser,
    kickUser,
    unbanUser,
    unmuteUser,
    clearError: () => setError(null),
  };
}; 