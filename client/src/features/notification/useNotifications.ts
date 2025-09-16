// hooks/useNotifications.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchUnreadCount, fetchNotifications } from './notificationSlice';

export const useNotifications = (role: 'doctor' | 'patient' = 'doctor') => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading, error } = useAppSelector(
    (state) => state.notifications
  );
  const { doctorAccessToken, doctor } = useAppSelector((state) => state.doctorAuth);
  const { accessToken, patient } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const isAuthenticated = role === 'doctor' ? (doctorAccessToken && doctor?.id) : (accessToken && patient?.id);
    if (isAuthenticated) {
      // Fetch initial notifications
      dispatch(fetchNotifications({ role }));
      dispatch(fetchUnreadCount(role));

      // Set up polling for updates every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchUnreadCount(role));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [dispatch, role, doctorAccessToken, doctor?.id, accessToken, patient?.id]);

  const refreshNotifications = () => {
    dispatch(fetchNotifications({ role }));
    dispatch(fetchUnreadCount(role));
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
  };
};