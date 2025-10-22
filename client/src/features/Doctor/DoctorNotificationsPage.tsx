// client/src/features/Doctor/DoctorNotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import { FaBell, FaCalendarCheck, FaCalendarTimes, FaEye, FaArrowLeft, FaVideo } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchNotifications, markNotificationAsRead, Notification } from '../../features/notification/notificationSlice';
import { useNavigate } from 'react-router-dom';
import DoctorNavbar from '@/components/doctor/DoctorNavbar';
import { useSocket } from '@/components/providers/SocketProvider';
import doctorAxiosInstance from '@/api/doctorAxiosInstance';
import { toast } from 'react-toastify';
import { socketService } from '../notification/socket';

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

const DoctorNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { notifications, loading, error, unreadCount, incomingCallsData } = useAppSelector((state) => state.notifications);
  const { isConnected } = useSocket();
  const { doctor } = useAppSelector((state) => state.doctorAuth);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isJoiningCall, setIsJoiningCall] = useState(false); // Changed from showVideoCall
  
  const itemsPerPage = 10;

  const incomingCallsCount = Object.keys(incomingCallsData).length;

  // Fetch notifications on mount and filter change
  useEffect(() => {
    dispatch(fetchNotifications({ 
      limit: itemsPerPage, 
      offset: (currentPage - 1) * itemsPerPage,
      unreadOnly: filter === 'unread',
      role: 'doctor'
    }));
  }, [dispatch, currentPage, filter]);

  // Socket event handling - UPDATED for route-based approach
  useEffect(() => {
    if (!isConnected) {
      console.warn('⚠️ Socket not connected, skipping event listeners');
      return;
    }

    console.log('🔌 Setting up socket event listeners');

    const handleIncomingCall = (event: Event) => {
      const data = (event as CustomEvent).detail as IncomingCallData;
      console.log('🔔 Incoming video call received:', data);
      
      // Validate required fields
      if (!data.roomId || !data.appointmentId) {
        console.error('❌ Invalid call data:', data);
        toast.error('Invalid video call data received');
        return;
      }

      // Show toast notification with direct navigation
      toast.info(`Incoming call from ${data.initiatorName || 'Patient'}`, {
        position: "top-right",
        autoClose: 15000,
        closeOnClick: true,
        onClick: () => {
          console.log('🎯 Toast clicked - accepting call');
          // Navigate directly to video call page
          navigate(`/video-call/${data.roomId}`, {
            state: {
              appointmentId: data.appointmentId,
              userRole: 'doctor',
              isIncoming: true,
              callerName: data.initiatorName || 'Patient'
            }
          });
        }
      });

      // Play notification sound (optional)
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    };

    const handleCallEnded = (event: Event) => {
      const data = (event as CustomEvent).detail;
      console.log('📞 Call ended event received:', data);
      toast.info('Video call has ended');
    };

    // Add event listeners
    window.addEventListener('incoming_video_call', handleIncomingCall);
    window.addEventListener('video_call_ended', handleCallEnded);
    
    console.log('✅ Socket event listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket event listeners');
      window.removeEventListener('incoming_video_call', handleIncomingCall);
      window.removeEventListener('video_call_ended', handleCallEnded);
    };
  }, [isConnected, navigate]); // Added navigate dependency

  // UPDATED: Simplified acceptVideoCall function - just navigates
  const acceptVideoCall = async (roomId: string, appointmentId: string, callerName: string, isIncoming: boolean = false) => {
    try {
      if (isJoiningCall) return;
      
      setIsJoiningCall(true);
      console.log('🔄 Starting acceptVideoCall:', { roomId, appointmentId, callerName, isIncoming });
      
      // Show loading state
      toast.info('Joining video call...', { autoClose: 2000 });
      
      // Verify we can join the call
      const response = await doctorAxiosInstance.post(`/videocall/doctor/join/${roomId}`);
      console.log('📡 API Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ API call successful, navigating to video call');
        
        // Navigate to video call page
        navigate(`/video-call/${roomId}`, {
          state: {
            appointmentId,
            userRole: 'doctor',
            isIncoming,
            callerName
          }
        });
        
        // Socket join will be handled in VideoCallPage component
        toast.success('Joined video call successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to join call');
      }
    } catch (error: any) {
      console.error('💥 Error in acceptVideoCall:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join call';
      toast.error(errorMessage);
    } finally {
      setIsJoiningCall(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead({ notificationId, role: "doctor" }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // UPDATED: Enhanced notification join handler
  const handleJoinCall = async (notification: Notification) => {
    console.log('🎯 handleJoinCall called with notification:', notification);
    
    if (notification.type !== 'video_call_initiated') {
      console.error('❌ Invalid notification type:', notification.type);
      toast.error('Invalid video call notification');
      return;
    }

    if (isJoiningCall) {
      toast.info('Already joining a call...');
      return;
    }

    try {
      console.log('✅ Video call notification detected');
      const appointmentId = notification.data?.appointmentId;
      
      if (!appointmentId) {
        console.error('❌ No appointment ID in notification');
        toast.error('Invalid notification - missing appointment ID');
        return;
      }
      
      // Check Redux for stored socket data
      const storedCallData = incomingCallsData[appointmentId];
      
      if (storedCallData) {
        console.log('📞 Using stored socket call data:', storedCallData);
        
        // Mark notification as read
        await handleMarkAsRead(notification.id);
        
        // Join the call with proper type checking
        await acceptVideoCall(
          storedCallData.roomId,
          storedCallData.appointmentId,
          storedCallData.initiatorName || 'Patient', // Provide default value
          false
        );
      } else {
        console.warn('⚠️ No socket data found for appointment:', appointmentId);
        
        // Fallback: try using notification data
        if (notification.data?.roomId) {
          console.log('🔄 Using notification roomId as fallback');
          await handleMarkAsRead(notification.id);
          await acceptVideoCall(
            notification.data.roomId,
            appointmentId,
            notification.data.initiatorName || 'Patient', // Provide default value
            false
          );
        } else {
          toast.error('Call data not available. Please wait for the incoming call notification or refresh the page.');
          console.log('💡 Suggestion: Refresh notifications to sync call data');
        }
      }
    } catch (error) {
      console.error('💥 Error in handleJoinCall:', error);
      toast.error('Failed to join call from notification');
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

  // REMOVED: Conditional VideoCall rendering since we're using routes

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
                {incomingCallsCount > 0 && (
                  <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-green-800 text-sm font-semibold flex items-center">
                      <FaVideo className="mr-2" />
                      {incomingCallsCount} active call{incomingCallsCount > 1 ? 's' : ''} available to join
                    </p>
                  </div>
                )}
                {!isConnected && (
                  <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ Real-time notifications disconnected. Refresh to reconnect.
                    </p>
                  </div>
                )}
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
              notifications.map((notification) => {
                const hasCallData = notification.type === 'video_call_initiated' && 
                  notification.data?.appointmentId && 
                  notification.data.appointmentId in incomingCallsData;

                return (
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
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.type === 'video_call_initiated' && (
                            <button
                              onClick={() => handleJoinCall(notification)}
                              disabled={!hasCallData || isJoiningCall}
                              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                                hasCallData 
                                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={hasCallData ? 'Join Call' : 'Waiting for call data...'}
                            >
                              <FaVideo />
                              {isJoiningCall ? 'Joining...' : hasCallData ? 'Join Call' : 'Waiting...'}
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