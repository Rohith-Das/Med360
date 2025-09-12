

// client/src/components/videoCall/VideoCall.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { store } from "@/app/store";
import { RootState } from "@/app/store";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Monitor, MonitorStop, Settings } from 'lucide-react';

interface VideoCallProps {
  roomId: string;
  appointmentId: string;
  userRole: "doctor" | "patient";
  userName: string;
  userId: string;
  onCallEnd: () => void;
}

interface Participant {
  userId: string;
  userName: string;
  userRole: string;
  socketId: string;
}

const VideoCall: React.FC<VideoCallProps> = ({
  roomId,
  appointmentId,
  userRole,
  userName,
  userId,
  onCallEnd,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed' | 'disconnected'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
    ],
  };

  const getAuthToken = (userRole: "patient" | "doctor"): string => {
    const state: RootState = store.getState();
    return userRole === "doctor" ? state.doctorAuth.doctorAccessToken || "" : state.auth.accessToken || "";
  };

  // Initialize Socket.IO
  useEffect(() => {
    const token = getAuthToken(userRole);
    if (!token) {
      setError('Authentication required');
      setConnectionStatus('failed');
      return;
    }

    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setSocket(newSocket);
      setConnectionStatus('connected');
      joinVideoRoom(newSocket);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to server');
      setConnectionStatus('failed');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnectionStatus('disconnected');
      cleanup();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userRole]);

  // Setup Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('video:participant-joined', handleParticipantJoined);
    socket.on('video:participant-left', handleParticipantLeft);
    socket.on('video:room-participants', handleRoomParticipants);
    socket.on('video:offer', handleOffer);
    socket.on('video:answer', handleAnswer);
    socket.on('video:ice-candidate', handleIceCandidate);
    socket.on('video:participant-audio-toggle', handleRemoteAudioToggle);
    socket.on('video:participant-video-toggle', handleRemoteVideoToggle);
    socket.on('video:participant-screen-share-started', handleScreenShareStarted);
    socket.on('video:participant-screen-share-stopped', handleScreenShareStopped);
    socket.on('video_call_ended', handleCallEnded);

    return () => {
      socket.off('video:participant-joined');
      socket.off('video:participant-left');
      socket.off('video:room-participants');
      socket.off('video:offer');
      socket.off('video:answer');
      socket.off('video:ice-candidate');
      socket.off('video:participant-audio-toggle');
      socket.off('video:participant-video-toggle');
      socket.off('video:participant-screen-share-started');
      socket.off('video:participant-screen-share-stopped');
      socket.off('video_call_ended');
    };
  }, [socket]);

  // Initialize media and WebRTC
  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isCallActive]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      initializePeerConnection(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access camera or microphone');
      setConnectionStatus('failed');
    }
  };

  const initializePeerConnection = (stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = peerConnection;

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      const [remote] = event.streams;
      setRemoteStream(remote);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }
      setIsCallActive(true);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('video:ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetSocketId: participants[0]?.socketId,
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        setConnectionStatus('failed');
        setError('Connection lost');
        cleanup();
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed') {
        peerConnection.restartIce();
      }
    };
  };

  const joinVideoRoom = (socketInstance: Socket) => {
    socketInstance.emit('video:join-room', { roomId, appointmentId });
  };

  const handleParticipantJoined = async (data: Participant) => {
    console.log('Participant joined:', data);
    setParticipants((prev) => [...prev, data]);

    if (peerConnectionRef.current && localStream && data.userRole !== userRole) {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket?.emit('video:offer', {
          roomId,
          offer,
          targetSocketId: data.socketId,
        });
      } catch (error) {
        console.error('Error creating offer:', error);
        setError('Failed to initiate call');
      }
    }
  };

  const handleParticipantLeft = (data: any) => {
    console.log('Participant left:', data);
    setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
    if (participants.length <= 1) {
      setIsCallActive(false);
      setRemoteStream(null);
      endCall();
    }
  };

  const handleRoomParticipants = (data: any) => {
    setParticipants(data.participants);
  };

  const handleOffer = async (data: any) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket?.emit('video:answer', {
        roomId,
        answer,
        targetSocketId: data.fromSocketId,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to process call offer');
    }
  };

  const handleAnswer = async (data: any) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      setError('Failed to process call answer');
    }
  };

  const handleIceCandidate = async (data: any) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleRemoteAudioToggle = (data: any) => {
    console.log('Remote audio toggled:', data);
  };

  const handleRemoteVideoToggle = (data: any) => {
    console.log('Remote video toggled:', data);
  };

  const handleScreenShareStarted = (data: any) => {
    console.log('Screen share started:', data);
    setIsScreenSharing(true);
  };

  const handleScreenShareStopped = (data: any) => {
    console.log('Screen share stopped:', data);
    setIsScreenSharing(false);
  };

  const handleCallEnded = (data: any) => {
    console.log('Call ended:', data);
    endCall();
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socket?.emit('video:toggle-video', {
          roomId,
          isVideoOff: !videoTrack.enabled,
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socket?.emit('video:toggle-audio', {
          roomId,
          isMuted: !audioTrack.enabled,
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          // audio: true, // Uncomment if audio sharing is needed
        });
        if (peerConnectionRef.current && localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
          videoTrack.onended = stopScreenShare;
        }
        setIsScreenSharing(true);
        socket?.emit('video:start-screen-share', { roomId });
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError('Failed to toggle screen sharing');
    }
  };

  const stopScreenShare = async () => {
    try {
      if (localStream && peerConnectionRef.current) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        setLocalStream(newStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        setIsScreenSharing(false);
        socket?.emit('video:stop-screen-share', { roomId });
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
      setError('Failed to stop screen sharing');
    }
  };

  const endCall = useCallback(() => {
    socket?.emit('video:leave-room', { roomId });
    cleanup();
    onCallEnd();
    navigate(userRole === 'doctor' ? '/doctor/appointments' : '/patient/appointments');
  }, [socket, roomId, onCallEnd, userRole, navigate]);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socket) {
      socket.disconnect();
    }
    setIsCallActive(false);
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error || connectionStatus === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
          <p className="mb-4">{error || 'Unable to establish video call'}</p>
          <button
            onClick={endCall}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white relative">
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Video Call - </span>
            <span className="text-white font-medium">{userRole === 'doctor' ? 'Patient Consultation' : 'Doctor Consultation'}</span>
          </div>
          {isCallActive && (
            <div className="text-sm text-green-400">
              Duration: {formatDuration(callDuration)}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm capitalize">{connectionStatus}</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-lg">Waiting for other participant to join...</p>
              <div className="mt-2 text-sm text-gray-400">
                Participants: {participants.length + 1}
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            You ({userName})
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <CameraOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-gray-800">
        <div className="flex justify-center items-center space-x-6">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorStop className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
        {participants.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Connected with: {participants.map(p => p.userName).join(', ')}
          </div>
        )}
      </div>

      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Call Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Video Quality</label>
                <select className="w-full p-2 bg-gray-700 rounded border border-gray-600">
                  <option>Auto</option>
                  <option>High (720p)</option>
                  <option>Medium (480p)</option>
                  <option>Low (240p)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Audio Quality</label>
                <select className="w-full p-2 bg-gray-700 rounded border border-gray-600">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;