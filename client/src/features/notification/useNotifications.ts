// hooks/useNotifications.ts
import { useEffect } from 'react';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { fetchUnreadCount,fetchNotifications } from './notificationSlice';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading, error } = useAppSelector(
    (state) => state.notifications
  );
  const { doctorAccessToken, doctor } = useAppSelector(
    (state) => state.doctorAuth
  );

  useEffect(() => {
    if (doctorAccessToken && doctor?.id) {
      // Fetch initial notifications
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());

      // Set up polling for updates every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchUnreadCount());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [dispatch, doctorAccessToken, doctor?.id]);

  const refreshNotifications = () => {
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
  };
};