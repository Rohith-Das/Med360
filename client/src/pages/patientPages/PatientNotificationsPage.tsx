// client/src/pages/patientPages/PatientNotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import { FaBell, FaCalendarCheck, FaCalendarTimes, FaEye, FaArrowLeft, FaVideo } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchNotifications, markNotificationAsRead, Notification } from '../../features/notification/notificationSlice';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/patient/Navbar';
import { useSocket } from '@/components/providers/SocketProvider';
import VideoCall from '@/components/videoCall/VideoCall';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'react-toastify';
import { socketService } from '@/features/notification/socket';

// Enhanced interface for incoming call data
interface IncomingCallData {
  roomId: string;
  appointmentId: string;
  initiatorName: string;
  appointmentDate: string;
  appointmentTime: string;
  callType: string;
  initiatorRole: string;
  initiatorId: string;
}

const PatientNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get data from Redux - incomingCallsData is now a plain object
  const { notifications, loading, error, unreadCount, incomingCallsData } = useAppSelector((state) => state.notifications);
  const { isConnected } = useSocket();
  const { patient } = useAppSelector((state) => state.auth);
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showVideoCall, setShowVideoCall] = useState<{ 
    active: boolean; 
    roomId?: string; 
    appointmentId?: string; 
    callerName?: string;
    isIncoming?: boolean;
  }>({ active: false });
  
  const itemsPerPage = 10;
  
  // Calculate incoming calls count from Redux object
  const incomingCallsCount = Object.keys(incomingCallsData).length;

  useEffect(() => {
    dispatch(fetchNotifications({ 
      limit: itemsPerPage, 
      offset: (currentPage - 1) * itemsPerPage,
      unreadOnly: filter === 'unread',
      role: 'patient'
    }));
  }, [dispatch, currentPage, filter]);

  // Enhanced socket event handling
  useEffect(() => {
    if (!isConnected) return;

    const handleIncomingCall = (event: Event) => {
      const data = (event as CustomEvent).detail as IncomingCallData;
      console.log('🔔 Incoming video call received:', data);
      
      // Data is already stored in Redux via socket service
      // Just show the toast notification
      toast.info(`Incoming call from Dr. ${data.initiatorName || 'Doctor'}`, {
        position: "top-right",
        autoClose: 15000,
        onClick: () => {
          console.log('🎯 Toast clicked - accepting call');
          acceptVideoCall(data.roomId, data.appointmentId, `Dr. ${data.initiatorName || 'Doctor'}`, true);
        }
      });
    };

    const handleAcceptCall = (event: Event) => {
      const data = (event as CustomEvent).detail;
      console.log('✅ Accept call event received:', data);
      acceptVideoCall(data.roomId, data.appointmentId, data.initiatorName, true);
    };

    const handleCallEnded = (event: Event) => {
      const data = (event as CustomEvent).detail;
      console.log('📞 Call ended event received:', data);
      
      if (showVideoCall.active) {
        setShowVideoCall({ active: false });
      }
    };

    window.addEventListener('incoming_video_call', handleIncomingCall);
    window.addEventListener('accept_video_call', handleAcceptCall);
    window.addEventListener('video_call_ended', handleCallEnded);
    
    return () => {
      window.removeEventListener('incoming_video_call', handleIncomingCall);
      window.removeEventListener('accept_video_call', handleAcceptCall);
      window.removeEventListener('video_call_ended', handleCallEnded);
    };
  }, [isConnected, showVideoCall.active]);

  const acceptVideoCall = async (roomId: string, appointmentId: string, callerName: string, isIncoming: boolean = false) => {
    try {
      console.log('🔄 Starting acceptVideoCall:', { roomId, appointmentId, callerName, isIncoming });
      
      // Show loading state
      toast.info('Joining video call...', { autoClose: 2000 });
      
      const response = await axiosInstance.post(`/videocall/join/${roomId}`);
      console.log('📡 API Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ API call successful, setting up video call');
        
        setShowVideoCall({ 
          active: true, 
          roomId, 
          appointmentId, 
          callerName,
          isIncoming 
        });
        console.log('🎥 Video call state set:', { active: true, roomId, appointmentId, callerName, isIncoming });
        
        // Join the video room via socket with enhanced data
        console.log('🔌 Joining video room via socket');
        socketService.joinVideoRoom(roomId, {
          appointmentId,
          userId: patient?.id,
          userRole: 'patient',
          userName: patient?.name || 'Patient'
        });
        
        toast.success('Joined video call successfully!');
        console.log('📤 Socket joinVideoRoom completed');
      }
    } catch (error: any) {
      console.error('💥 Error in acceptVideoCall:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join call';
      toast.error(errorMessage);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead({ notificationId, role: "patient" }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Enhanced notification join handler
  const handleJoinCall = async (notification: Notification) => {
    console.log('🎯 handleJoinCall called with notification:', notification);
    
    if (notification.type === 'video_call_initiated') {
      try {
        console.log('✅ Video call notification detected');
        const appointmentId = notification.data?.appointmentId;
        
        if (!appointmentId) {
          console.error('❌ No appointment ID in notification');
          toast.error('Invalid notification - missing appointment ID');
          return;
        }
        
        // Check Redux object for stored call data
        const storedCallData = incomingCallsData[appointmentId];
        
        if (storedCallData) {
          console.log('📞 Using stored socket call data:', storedCallData);
          
          // Mark notification as read first
          await handleMarkAsRead(notification.id);
          console.log('📖 Notification marked as read');
          
          // Use socket data which has roomId
          await acceptVideoCall(
            storedCallData.roomId,
            storedCallData.appointmentId,
            `Dr. ${storedCallData.initiatorName}`,
            false // Not incoming from notification
          );
        } else {
          console.warn('⚠️ No socket data found for appointment:', appointmentId);
          console.log('📋 Available stored calls:', Object.keys(incomingCallsData));
          
          // Try to use notification data if available (fallback)
          if (notification.data?.roomId) {
            console.log('🔄 Using notification roomId as fallback');
            await handleMarkAsRead(notification.id);
            await acceptVideoCall(
              notification.data.roomId,
              appointmentId,
              'Doctor',
              false
            );
          } else {
            toast.error('Unable to join call. Please wait for the call notification or refresh the page.');
          }
        }
      } catch (error) {
        console.error('💥 Error in handleJoinCall:', error);
        toast.error('Failed to join call from notification');
      }
    } else {
      console.error('❌ Invalid notification type:', notification.type);
      toast.error('Invalid video call notification');
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

    // Check Redux object for call data availability
    const hasCallData = notification.type === 'video_call_initiated' && 
      data.appointmentId && 
      data.appointmentId in incomingCallsData;

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
        {hasCallData && (
          <p className="text-green-600 font-medium">✅ Ready to join call</p>
        )}
        {notification.type === 'video_call_initiated' && !hasCallData && (
          <p className="text-amber-600 font-medium">⏳ Waiting for call data...</p>
        )}
      </div>
    );
  };

  // Show video call component if active
  if (showVideoCall.active) {
    return (
      <VideoCall
        roomId={showVideoCall.roomId}
        appointmentId={showVideoCall.appointmentId || ''}
        userRole="patient"
        userName={patient?.name || "Patient"}
        userId={patient?.id || "patient-id"}
        onCallEnd={() => setShowVideoCall({ active: false })}
        isIncoming={showVideoCall.isIncoming || false}
        callerName={showVideoCall.callerName}
      />
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-2">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
                </p>
                {incomingCallsCount > 0 && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                    <p className="text-green-800 text-sm font-medium">
                      📞 {incomingCallsCount} active call(s) available
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex bg-white rounded-lg shadow-sm border">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    All
                  </button>
                  <button onClick={() => setFilter('unread')} className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${filter === 'unread' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
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
                  {filter === 'unread' ? "You don't have any unread notifications." : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                // Check Redux object for call data availability
                const hasCallData = notification.type === 'video_call_initiated' && 
                  notification.data?.appointmentId && 
                  notification.data.appointmentId in incomingCallsData;

                const callData = hasCallData ? incomingCallsData[notification.data!.appointmentId!] : null;

                return (
                  <div key={notification.id} className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
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
                            <p className="text-gray-700 mt-1">{notification.message}</p>
                            {getNotificationDetails(notification)}
                            <p className="text-sm text-gray-500 mt-3">{formatDate(notification.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.type === 'video_call_initiated' && (
                            <button
                              onClick={() => handleJoinCall(notification)}
                              disabled={!hasCallData || loading}
                              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                hasCallData 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={hasCallData ? 'Join Call' : 'Waiting for call data...'}
                            >
                              {loading ? 'Joining...' : hasCallData ? 'Join Call' : 'Waiting...'}
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
                );
              })
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
                <span className="px-3 py-2 text-sm font-medium text-gray-700">Page {currentPage}</span>
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

export default PatientNotificationsPage;