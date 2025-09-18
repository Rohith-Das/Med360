import React, { useEffect, useState } from 'react';
import { FaBell, FaCalendarCheck, FaCalendarTimes, FaEye, FaArrowLeft, FaVideo } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchNotifications, markNotificationAsRead, Notification } from '../../features/notification/notificationSlice';
import { useNavigate } from 'react-router-dom';
import DoctorNavbar from '@/components/doctor/DoctorNavbar';
import VideoCall from '@/components/videoCall/VideoCall';
import { useSocket } from '@/components/providers/SocketProvider';
import doctorAxiosInstance from '@/api/doctorAxiosInstance';
import { toast } from 'react-toastify';
import { socketService } from '../notification/socket';

const DoctorNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { notifications, loading, error, unreadCount } = useAppSelector((state) => state.notifications);
  const { isConnected } = useSocket();
  const {doctor}=useAppSelector((state)=>state.doctorAuth)
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showVideoCall, setShowVideoCall] = useState<{ active: boolean; roomId?: string; appointmentId?: string; callerName?: string }>({ active: false });
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchNotifications({ 
      limit: itemsPerPage, 
      offset: (currentPage - 1) * itemsPerPage,
      unreadOnly: filter === 'unread',
      role: 'doctor'
    }));
  }, [dispatch, currentPage, filter]);

  // Listen for incoming calls
  useEffect(() => {
    if (!isConnected) return;

    const handleIncomingCall = (data: any) => {
      console.log('Incoming video call:', data);
      toast.info(`Incoming call from ${data.initiatorName || 'Patient'}`, {
        position: "top-right",
        autoClose: false,
        onClick: () => acceptVideoCall(data.roomId, data.appointmentId, data.initiatorName || 'Patient')
      });
    };

    window.addEventListener('incoming_video_call', handleIncomingCall);
    return () => window.removeEventListener('incoming_video_call', handleIncomingCall);
  }, [isConnected]);

  const acceptVideoCall = async (roomId: string, appointmentId: string, callerName: string) => {
    try {
      const response = await doctorAxiosInstance.post(`/videocall/doctor/join/${roomId}`);
      if (response.data.success) {
        setShowVideoCall({ active: true, roomId, appointmentId, callerName });
socketService.joinVideoRoom(roomId, { appointmentId, userId: doctor?.id, userRole: 'doctor', userName: doctor?.name || 'Doctor' })}
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join call');
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead({ notificationId, role: "doctor" }));
  };

 const handleJoinCall = (notification: Notification) => {
  if (notification.type === 'video_call_initiated' && notification.data?.roomId && notification.data?.appointmentId) {
    acceptVideoCall(notification.data.roomId, notification.data.appointmentId, notification.title);
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
      minute: '2-digit'
    });
  };

  const getNotificationDetails = (notification: Notification) => {
    const { data } = notification;
    if (!data) return null;

    return (
      <div className="mt-2 text-sm text-gray-600">
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
          <p><strong>Refund Amount:</strong> ₹{data.refundAmount}</p>
        )}
        {data.cancelReason && (
          <p><strong>Cancel Reason:</strong> {data.cancelReason}</p>
        )}
        {data.roomId && (
          <p><strong>Room ID:</strong> {data.roomId}</p>
        )}
      </div>
    );
  };

  if (showVideoCall.active) {
    return (
      <VideoCall
        roomId={showVideoCall.roomId}
        appointmentId={showVideoCall.appointmentId || ''}
        userRole="doctor"
        userName="Doctor Name"
        userId="doctor-id"
        onCallEnd={() => setShowVideoCall({ active: false })}
        isIncoming={true}
        callerName={showVideoCall.callerName}
      />
    );
  }

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
      
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-2">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex bg-white rounded-lg shadow-sm border">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                      filter === 'unread'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <FaBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {filter === 'unread' 
                    ? "You don't have any unread notifications." 
                    : "You don't have any notifications yet."
                  }
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                New
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mt-1">
                            {notification.message}
                          </p>
                          
                          {getNotificationDetails(notification)}
                          
                          <p className="text-sm text-gray-500 mt-3">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {notification.type === 'video_call_initiated' && (
                          <button
                            onClick={() => handleJoinCall(notification)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Join Call
                          </button>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <FaEye className="h-4 w-4" />
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
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={notifications.length < itemsPerPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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