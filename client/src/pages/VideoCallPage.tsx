// client/src/pages/VideoCallPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import VideoCall from '@/components/videoCall/VideoCall';
import { socketService } from '@/features/notification/socket';
import { toast } from 'react-toastify';

// interface VideoCallParams {
//   roomId: string;
// }

interface LocationState {
  appointmentId?: string;
  userRole?: 'doctor' | 'patient';
  isIncoming?: boolean;
  callerName?: string;
}

const VideoCallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const { doctor } = useAppSelector((state) => state.doctorAuth.doctorAuth);
  const { patient } = useAppSelector((state) => state.patientAuth.auth);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine user role and details
  const userRole = locationState?.userRole || (doctor ? 'doctor' : 'patient');
  const userName = userRole === 'doctor' ? doctor?.name : patient?.name;
  const userId = userRole === 'doctor' ? doctor?.id : patient?.id;

  useEffect(() => {
    const initializeVideoCall = async () => {
      if (!roomId) {
        setError('Room ID is required');
        setLoading(false);
        return;
      }

      if (!userId) {
        setError('User authentication required');
        setLoading(false);
        return;
      }

      if (!locationState?.appointmentId) {
        setError('Appointment ID is required');
        setLoading(false);
        return;
      }

      try {
        console.log('🎥 Initializing video call page:', {
          roomId,
          userRole,
          appointmentId: locationState.appointmentId,
          isIncoming: locationState.isIncoming
        });
         if (!socketService.isSocketConnected()) {
        console.log('🔄 Socket not connected, reconnecting...');
        // Reconnect socket if needed
        socketService.connect(userId, userRole);
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

        // Join the video room via socket
        socketService.joinVideoRoom(roomId, {
          appointmentId: locationState.appointmentId,
          userId,
          userRole,
          userName: userName || (userRole === 'doctor' ? 'Doctor' : 'Patient')
        });

        setLoading(false);
        console.log('✅ Video call page initialized successfully');
      } catch (err) {
        console.error('💥 Error initializing video call:', err);
        setError('Failed to initialize video call');
        setLoading(false);
      }
    };

    initializeVideoCall();
  }, [roomId, userId, userRole, userName, locationState]);

  const handleCallEnd = () => {
    console.log('📞 Call ended, navigating back...');
    
    // Navigate based on user role
    if (userRole === 'doctor') {
      navigate('/doctor/appointments');
    } else {
      navigate('/patient/appointments');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-2">Connection Error</h2>
            <p className="mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100"
              >
                Retry
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roomId || !locationState?.appointmentId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-500 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-2">Invalid Call</h2>
            <p className="mb-4">Missing required call information</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2 bg-white text-yellow-600 rounded-lg hover:bg-gray-100"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VideoCall
      roomId={roomId}
      appointmentId={locationState.appointmentId}
      userRole={userRole}
      userName={userName || (userRole === 'doctor' ? 'Doctor' : 'Patient')}
      userId={userId || `${userRole}-id`}
      onCallEnd={handleCallEnd}
      isIncoming={locationState.isIncoming || false}
      callerName={locationState.callerName}
    />
  );
};

export default VideoCallPage;