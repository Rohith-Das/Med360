// client/src/pages/doctorPages/DoctorNotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import { FaBell, FaCalendarCheck, FaCalendarTimes, FaEye, FaArrowLeft, FaVideo } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchNotifications, markNotificationAsRead, Notification } from '@/features/notification/notificationSlice';
import { useNavigate } from 'react-router-dom';
import DoctorNavbar from '@/components/doctor/DoctorNavbar';
import { toast } from 'react-toastify';
import doctorAxiosInstance from '@/api/doctorAxiosInstance';
import { Video, Loader2 } from 'lucide-react';

const DoctorNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { notifications, loading, error, unreadCount } = useAppSelector((state) => state.notifications);
  const [joiningCall, setJoiningCall] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    dispatch(
      fetchNotifications({
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        unreadOnly: filter === 'unread',
        role: 'doctor',
      })
    );
  }, [dispatch, currentPage, filter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead({ notificationId, role: 'doctor' })).unwrap();
      toast.success('Marked as read');
    } catch (err) {
      console.error('Failed to mark as read:', err);
      toast.error('Failed to mark as read');
    }
  };

  const handleJoinCall = async (roomId: string, appointmentId: string) => {
    if (!roomId || !appointmentId) {
      toast.error('Invalid call information');
      return;
    }

    setJoiningCall(appointmentId);
    try {
      await doctorAxiosInstance.post(`/video-call/join/${roomId}`);
      navigate(`/video-call/${roomId}`);
    } catch (err: any) {
      console.error('Failed to join video call:', err);
      toast.error(err.response?.data?.message || 'Failed to join video call');
    } finally {
      setJoiningCall(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_booked':
        return <FaCalendarCheck className="text-green-600 text-2xl" />;
      case 'appointment_cancelled':
        return <FaCalendarTimes className="text-red-600 text-2xl" />;
      case 'video_call_initiated':
        return <FaVideo className="text-blue-600 text-2xl" />;
      default:
        return <FaBell className="text-gray-600 text-2xl" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationDetails = (notification: Notification) => {
    // Safely access data with null check
    if (!notification.data) return null;

    const data = notification.data;

    return (
      <div className="mt-3 space-y-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        {data.initiatorName && (
          <p>
            <strong>From:</strong>{' '}
            {data.initiatorRole === 'patient' ? data.initiatorName : `Dr. ${data.initiatorName}`}
          </p>
        )}
        {data.appointmentDate && (
          <p>
            <strong>Date:</strong> {new Date(data.appointmentDate).toLocaleDateString()}
          </p>
        )}
        {data.appointmentTime && (
          <p>
            <strong>Time:</strong> {data.appointmentTime}
          </p>
        )}
        {data.consultingFee && (
          <p>
            <strong>Fee:</strong> ₹{data.consultingFee}
          </p>
        )}
        {data.refundAmount && (
          <p>
            <strong>Refund:</strong> ₹{data.refundAmount}
          </p>
        )}
        {data.cancelReason && (
          <p>
            <strong>Reason:</strong> {data.cancelReason}
          </p>
        )}
      </div>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <div className="pt-20 flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />

      <div className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium transition"
            >
              <FaArrowLeft className="mr-2" /> Back
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-2">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'You are all caught up! 🎉'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all shadow-sm relative ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-5">
            {notifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <FaBell className="mx-auto h-20 w-20 text-gray-300 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">No notifications</h3>
                <p className="text-gray-500">
                  {filter === 'unread' ? "You're all caught up!" : "No notifications yet. Check back later."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-2xl shadow-md border-2 transition-all hover:shadow-xl ${
                    !notification.isRead
                      ? 'border-l-8 border-l-blue-600 bg-blue-50/30'
                      : 'border-transparent'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Icon + Content */}
                      <div className="flex items-start gap-5 flex-1">
                        <div className="mt-1 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                          </div>

                          <p className="text-gray-700 text-base mb-3">{notification.message}</p>

                          {getNotificationDetails(notification)}

                          <p className="text-sm text-gray-500 mt-5">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-4">
                        {/* JOIN VIDEO CALL BUTTON - Only show if data exists and has required fields */}
                        {/* JOIN VIDEO CALL BUTTON - Recommended final version */}
{notification.type === 'video_call_initiated' && notification.data && (
  (() => {
    const roomId = notification.data.roomId;
    const appointmentId = notification.data.appointmentId;

    // Only render if both are valid strings
    if (typeof roomId !== 'string' || typeof appointmentId !== 'string') {
      return null;
    }

    return (
      <button
        onClick={() => handleJoinCall(roomId, appointmentId)}
        disabled={joiningCall === appointmentId}
        className="px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold flex items-center gap-3 shadow-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {joiningCall === appointmentId ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <Video className="w-5 h-5" />
            Join Video Call
          </>
        )}
      </button>
    );
  })()
)}

                        {/* MARK AS READ */}
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Mark as read"
                          >
                            <FaEye className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {notifications.length > 0 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Previous
                </button>

                <span className="px-6 py-3 text-gray-700 font-medium">
                  Page {currentPage}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={notifications.length < itemsPerPage}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorNotificationsPage;