// client/src/features/Doctor/DoctorNotificationsPage.tsx

import React, { useEffect, useState } from 'react';
import { FaBell, FaCalendarCheck, FaCalendarTimes, FaEye, FaArrowLeft, FaVideo } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchNotifications, markNotificationAsRead, Notification } from '@/features/notification/notificationSlice';
import { useNavigate } from 'react-router-dom';
import DoctorNavbar from '@/components/doctor/DoctorNavbar';
import { useSocket } from '@/components/providers/SocketProvider';
import { toast } from 'react-toastify';


const DoctorNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { notifications, loading, error, unreadCount } = useAppSelector((state) => state.notifications);
  const { isConnected } = useSocket();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch notifications
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

  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead({ notificationId, role: 'doctor' }));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_booked':
        return <FaCalendarCheck className="text-green-500" />;
      case 'appointment_cancelled':
        return <FaCalendarTimes className="text-red-500" />;
      case 'video_call_initiated':
        return <FaVideo className="text-blue-500" />;
      default:
        return <FaBell className="text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationDetails = (notification: Notification) => {
    const { data } = notification;
    if (!data) return null;

    return (
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        {data.appointmentDate && (
          <p><strong>Date:</strong> {new Date(data.appointmentDate).toLocaleDateString()}</p>
        )}
        {data.appointmentTime && (
          <p><strong>Time:</strong> {data.appointmentTime}</p>
        )}
        {data.consultingFee && (
          <p><strong>Fee:</strong> ₹{data.consultingFee}</p>
        )}
        {data.refundAmount && (
          <p><strong>Refund:</strong> ₹{data.refundAmount}</p>
        )}
        {data.cancelReason && (
          <p><strong>Reason:</strong> {data.cancelReason}</p>
        )}
      </div>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <div className="pt-20 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <FaArrowLeft className="mr-2" /> Back
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-2">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'You are all caught up!'}
                </p>
                {!isConnected && (
                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg inline-block">
                    Real-time updates offline — refresh to reconnect
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all relative ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <FaBell className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">No notifications</h3>
                <p className="text-gray-500 mt-2">
                  {filter === 'unread' ? "You're all caught up!" : "No notifications yet."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-lg ${
                    !notification.isRead
                      ? 'border-l-8 border-l-blue-500 bg-blue-50/50'
                      : 'border-transparent'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: Icon + Content */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                          </div>

                          <p className="text-gray-700">{notification.message}</p>
                          {getNotificationDetails(notification)}
                          <p className="text-sm text-gray-500 mt-4">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col items-end gap-3">

                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <FaEye className="w-5 h-5" />
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
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2.5 font-medium text-gray-700">
                  Page {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={notifications.length < itemsPerPage}
                  className="px-5 py-2.5 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
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