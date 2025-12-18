// client/src/pages/VideoCall.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { socketService } from '@/features/notification/socket';
import { selectIncomingCallData, removeVideoCallData } from '@/features/notification/notificationSlice';
import axiosInstance from '@/api/axiosInstance';
import doctorAxiosInstance from '@/api/doctorAxiosInstance';
import { PhoneOff, Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface Participant {
  userId: string;
  userName: string;
  userRole: 'doctor' | 'patient';
}

const VideoCall: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = useAppSelector((state) =>
    state.patientAuth.auth.accessToken ? 'patient' : 'doctor'
  );
  const axios = userRole === 'patient' ? axiosInstance : doctorAxiosInstance;

  const appointmentId = roomId?.split('-').pop() || '';
  const callData = useAppSelector((state) =>
    appointmentId ? selectIncomingCallData(state, appointmentId) : null
  );

  const currentUser = useAppSelector((state) =>
    userRole === 'patient'
      ? state.patientAuth.auth.patient
      : state.doctorAuth.doctorAuth.doctor
  );

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleanup: Stopping tracks and closing peer connection');
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      setLocalStream(null);
    }
    if (pcRef.current) {
      pcRef.current.close();
      console.log('Closed RTCPeerConnection');
      pcRef.current = null;
    }
    if (roomId) {
      console.log(`Leaving socket room: ${roomId}`);
      socketService.leaveVideoRoom(roomId);
    }
  }, [localStream, roomId]);

  // End call
  const endCall = useCallback(async () => {
    console.log('🔴 Ending call...');
    try {
      await axios.post(`/video-call/end/${roomId}`);
      console.log('Sent end call request to server');
    } catch (err: any) {
      console.error('❌ Error sending end call request:', err.response?.data || err.message);
    }

    cleanup();
    dispatch(removeVideoCallData(appointmentId));
    toast.info('Call ended');
    navigate(userRole === 'doctor' ? '/doctor/appointments' : '/patient/appointments');
  }, [axios, roomId, cleanup, dispatch, appointmentId, navigate, userRole]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    const enabled = !audioTrack.enabled;
    audioTrack.enabled = enabled;
    setIsAudioMuted(!enabled);

    console.log(`${enabled ? '🔊 Unmuted audio' : '🔇 Muted audio'}`);
    socketService.emitVideoCallEvent('video:toggle-audio', {
      roomId,
      isMuted: !enabled,
    });
  }, [localStream, roomId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const enabled = !videoTrack.enabled;
    videoTrack.enabled = enabled;
    setIsVideoOff(!enabled);

    console.log(`${enabled ? '📹 Video turned on' : '📴 Video turned off'}`);
    socketService.emitVideoCallEvent('video:toggle-video', {
      roomId,
      isVideoOff: !enabled,
    });
  }, [localStream, roomId]);

  // Main initialization
  useEffect(() => {
    // Early validation
    if (!roomId) {
      toast.error('Invalid call link');
      navigate(-1);
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to join the call');
      navigate('/login');
      return;
    }

    const userId = currentUser.id || currentUser._id;
    if (!userId) {
      console.error('❌ User ID is missing!', { currentUser, userRole });
      toast.error('User data not loaded properly');
      navigate(-1);
      return;
    }

    console.log(`🚀 Initializing video call`);
    console.log(`👤 User: ${currentUser.name} (${userRole}) - ID: ${userId}`);
    console.log(`🏠 Room ID: ${roomId}`);
    console.log(`🎯 Role in call: ${!callData ? 'Initiator' : 'Joining'}`);

    let pc: RTCPeerConnection | null = null;
    let stream: MediaStream | null = null;
    let mounted = true;

    const init = async () => {
      if (!mounted) return;

      try {
        console.log('📹 Requesting camera and microphone access...');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        console.log('✅ Media permission granted');
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('Local video attached');
        }

        pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;
        console.log('🔗 PeerConnection created');

        stream.getTracks().forEach(track => {
          pc!.addTrack(track, stream!);
          console.log(`Added ${track.kind} track`);
        });

        pc.ontrack = (event) => {
          if (!mounted) return;
          console.log('📥 Remote stream received');
          const rStream = event.streams[0];
          setRemoteStream(rStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = rStream;
            console.log('Remote video attached');
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && mounted) {
            console.log('🧊 Sending ICE candidate');
            socketService.emitVideoCallEvent('video:ice-candidate', {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (!mounted) return;
          console.log(`🔄 Connection state: ${pc?.connectionState}`);
          if (pc?.connectionState === 'connected') {
            setIsConnected(true);
            toast.success('Connected to participant!');
          } else if (pc?.connectionState === 'failed') {
            setError('Connection failed');
            toast.error('Call failed — try again');
          }
        };

        // Join room with correct userId
        console.log(`🎥 Joining room ${roomId} as ${currentUser.name} (ID: ${userId})`);
        socketService.joinVideoRoom(roomId!, {
          userId,
          userName: currentUser.name,
          userRole,
        });

        // Signaling
        const handleOffer = async (data: any) => {
          if (!mounted || !pc) return;
          console.log(`📨 Received offer from ${data.fromUserName || 'unknown'}`);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('📤 Sending answer');
            socketService.emitVideoCallEvent('video:answer', {
              roomId,
              answer,
              targetSocketId: data.fromSocketId,
            });
          } catch (err) {
            console.error('❌ Offer handling failed:', err);
          }
        };

        const handleAnswer = async (data: any) => {
          if (!mounted || !pc) return;
          console.log('📨 Received answer');
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        };

        const handleIce = async (data: any) => {
          if (!mounted || !pc) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('🧊 Added ICE candidate');
          } catch (err) {
            console.error('ICE error:', err);
          }
        };

        socketService.getSocket()?.on('video:offer', handleOffer);
        socketService.getSocket()?.on('video:answer', handleAnswer);
        socketService.getSocket()?.on('video:ice-candidate', handleIce);

        // Participant tracking with detailed logs
        socketService.getSocket()?.on('video:participant-joined', (data: any) => {
          if (!mounted) return;
          console.log(`👤 JOINED → ${data.userName} (${data.userRole}) - ID: ${data.userId}`);
          setParticipants(prev => {
            if (prev.some(p => p.userId === data.userId)) {
              console.log(`(Already in list — ignoring duplicate)`);
              return prev;
            }
            const newList = [...prev, {
              userId: data.userId,
              userName: data.userName,
              userRole: data.userRole,
            }];
            console.log(`📊 Total participants now: ${newList.length + 1} (including self)`);
            return newList;
          });
          toast.success(`${data.userName} joined the call`);
        });

        socketService.getSocket()?.on('video:participant-left', (data: any) => {
          if (!mounted) return;
          console.log(`👋 LEFT → ${data.userName} (${data.userRole || 'unknown'}) - ID: ${data.userId}`);
          setParticipants(prev => {
            const newList = prev.filter(p => p.userId !== data.userId);
            console.log(`📊 Total participants now: ${newList.length + 1} (including self)`);
            return newList;
          });
          toast.info(`${data.userName} left the call`);
        });

        socketService.getSocket()?.on('video_call_ended', () => {
          if (!mounted) return;
          console.log('🔴 Call ended by remote user');
          toast.info('Call ended');
          endCall();
        });

        // Create offer if initiator
        if (!callData) {
          console.log('🎯 I am the initiator — creating offer');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('📤 Sending offer');
          socketService.emitVideoCallEvent('video:offer', { roomId, offer });
        } else {
          console.log('⏳ I am joining — waiting for offer');
        }

      } catch (err: any) {
        console.error('❌ WebRTC init failed:', err);
        const msg = err.name === 'NotAllowedError'
          ? 'Camera/microphone permission denied'
          : err.name === 'NotReadableError'
          ? 'Camera/microphone in use by another app'
          : 'Failed to start video call';

        setError(msg);
        toast.error(msg + '. Check permissions and refresh.');
      }
    };

    init();

    return () => {
      mounted = false;
      console.log('🧹 Component unmounting — cleaning up');
      cleanup();
    };
  }, [roomId, currentUser, userRole, callData]); // Safe dependencies

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-600 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Call Failed</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Remote */}
        <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <p className="text-2xl mb-2">Waiting for participant...</p>
                <p className="text-lg opacity-75">
                  {participants.length > 0
                    ? `${participants[0].userName} is here`
                    : 'No one joined yet'}
                </p>
              </div>
            </div>
          )}
          {remoteStream && participants.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
              <p className="font-medium">{participants.find(p => p.userRole !== userRole)?.userName}</p>
              <p className="text-sm capitalize">{participants.find(p => p.userRole !== userRole)?.userRole}</p>
            </div>
          )}
        </div>

        {/* Local PIP */}
        <div className="lg:w-80 relative bg-black rounded-xl overflow-hidden shadow-2xl">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
            <p className="font-medium">{currentUser?.name || 'You'}</p>
            <p className="text-sm capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 border-t border-gray-700">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-8">
          <button onClick={toggleAudio} className={`p-5 rounded-full ${isAudioMuted ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80`}>
            {isAudioMuted ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>
          <button onClick={endCall} className="p-6 rounded-full bg-red-600 hover:bg-red-700 shadow-lg">
            <PhoneOff className="w-8 h-8 text-white" />
          </button>
          <button onClick={toggleVideo} className={`p-5 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80`}>
            {isVideoOff ? <VideoOff className="w-7 h-7 text-white" /> : <Video className="w-7 h-7 text-white" />}
          </button>
        </div>
        <div className="text-center mt-4 text-gray-300 font-medium">
          <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
            {isConnected ? '✅ Connected' : '⏳ Connecting...'}
          </span>
          {' • '}
          Total: {participants.length + 1} participants
        </div>
      </div>
    </div>
  );
};

export default VideoCall;