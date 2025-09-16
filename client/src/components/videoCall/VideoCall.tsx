import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { store } from "@/app/store";
import { RootState } from "@/app/store";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Monitor, MonitorStop, Settings, Phone, PhoneIncoming } from 'lucide-react';
import axiosInstance from "@/api/axiosInstance";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import { toast } from "react-toastify";

interface VideoCallProps {
  roomId?: string;
  appointmentId: string;
  userRole: "doctor" | "patient";
  userName: string;
  userId: string;
  onCallEnd: () => void;
  isIncoming?: boolean;
  callerName?: string;
}

interface Participant {
  userId: string;
  userName: string;
  socketId: string;
  userRole: 'doctor' | 'patient';
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
}

interface VideoCallSession {
  roomId: string;
  participants: Participant[];
  participantsCount: number;
}

const VideoCall: React.FC<VideoCallProps> = ({
  roomId: initialRoomId,
  appointmentId,
  userRole,
  userName,
  userId,
  onCallEnd,
  isIncoming = false,
  callerName
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isCallInitiated, setIsCallInitiated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState(isIncoming);
  const [roomId, setRoomId] = useState(initialRoomId);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const navigate = useNavigate();

  // WebRTC Configuration
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const getAuthToken = () => {
    const state: RootState = store.getState();
    return userRole === 'doctor' ? state.doctorAuth.doctorAccessToken : state.auth.accessToken;
  };

  const getAxiosInstance = () => {
    return userRole === 'doctor' ? doctorAxiosInstance : axiosInstance;
  };

  // Initialize Socket.IO
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found');
      toast.error('Authentication token not found');
      return;
    }

    const newSocket = io('http://localhost:5001', {
      auth: { token, userId, userType: userRole },
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`Socket connected for ${userRole}: ${userId}`);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('incoming_video_call', (data) => {
      console.log('Incoming video call:', data);
      setIncomingCall(true);
      setRoomId(data.roomId);
      toast.info(`Incoming video call from ${data.initiatorRole === 'doctor' ? 'Doctor' : 'Patient'}`, {
        autoClose: 10000,
      });
    });

    newSocket.on('video:participant-joined', (data: Participant & { participantsCount: number }) => {
      console.log('Participant joined:', data);
      setParticipants(prev => [
        ...prev,
        {
          userId: data.userId,
          userName: data.userName,
          socketId: data.socketId,
          userRole: data.userRole,
          isMuted: false,
          isVideoOff: false,
          isSharingScreen: false
        }
      ]);
      createPeerConnection(data.socketId, data.userId);
    });

    newSocket.on('video:participant-left', (data: { socketId: string }) => {
      console.log('Participant left:', data);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
    });

    newSocket.on('video:offer', async (data: { offer: RTCSessionDescriptionInit; fromSocketId: string; fromUserId: string; fromUserName: string; fromUserRole: string }) => {
      console.log('Received offer from:', data.fromSocketId);
      await handleOffer(data);
    });

    newSocket.on('video:answer', async (data: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
      console.log('Received answer from:', data.fromSocketId);
      await handleAnswer(data);
    });

    newSocket.on('video:ice-candidate', async (data: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
      console.log('Received ICE candidate from:', data.fromSocketId);
      await handleIceCandidate(data);
    });

    newSocket.on('video:participant-audio-toggle', (data: { userId: string; isMuted: boolean }) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, isMuted: data.isMuted } : p))
      );
    });

    newSocket.on('video:participant-video-toggle', (data: { userId: string; isVideoOff: boolean }) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, isVideoOff: data.isVideoOff } : p))
      );
    });

    newSocket.on('video:participant-screen-share-started', (data: { socketId: string }) => {
      setParticipants(prev =>
        prev.map(p => (p.socketId === data.socketId ? { ...p, isSharingScreen: true } : p))
      );
    });

    newSocket.on('video:participant-screen-share-stopped', (data: { socketId: string }) => {
      setParticipants(prev =>
        prev.map(p => (p.socketId === data.socketId ? { ...p, isSharingScreen: false } : p))
      );
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [userRole, userId]);

  const createPeerConnection = useCallback((socketId: string, targetUserId: string) => {
    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnections.current.set(socketId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('video:ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetSocketId: socketId
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${socketId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        pc.close();
        peerConnections.current.delete(socketId);
      }
    };

    return pc;
  }, [roomId, socket]);

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera or microphone');
      toast.error('Failed to access camera or microphone');
    }
  }, []);

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; fromSocketId: string; fromUserId: string; fromUserName: string; fromUserRole: string }) => {
    const { offer, fromSocketId, fromUserId, fromUserName, fromUserRole } = data;
    let pc = peerConnections.current.get(fromSocketId);

    if (!pc) {
      pc = createPeerConnection(fromSocketId, fromUserId);
      setParticipants(prev => [
        ...prev,
        {
          userId: fromUserId,
          userName: fromUserName,
          socketId: fromSocketId,
          userRole: fromUserRole as 'doctor' | 'patient',
          isMuted: false,
          isVideoOff: false,
          isSharingScreen: false
        }
      ]);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('video:answer', {
        roomId,
        answer,
        targetSocketId: fromSocketId
      });

      // Process queued ICE candidates
      const queuedCandidates = iceCandidatesQueue.current.get(fromSocketId) || [];
      for (const candidate of queuedCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidatesQueue.current.delete(fromSocketId);
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to handle WebRTC offer');
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
    const { answer, fromSocketId } = data;
    const pc = peerConnections.current.get(fromSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // Process queued ICE candidates
        const queuedCandidates = iceCandidatesQueue.current.get(fromSocketId) || [];
        for (const candidate of queuedCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidatesQueue.current.delete(fromSocketId);
      } catch (error) {
        console.error('Error handling answer:', error);
        setError('Failed to handle WebRTC answer');
      }
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
    const { candidate, fromSocketId } = data;
    const pc = peerConnections.current.get(fromSocketId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    } else {
      // Queue ICE candidate if peer connection or remote description not ready
      const queue = iceCandidatesQueue.current.get(fromSocketId) || [];
      queue.push(candidate);
      iceCandidatesQueue.current.set(fromSocketId, queue);
    }
  };

  const startCall = useCallback(async () => {
    try {
      if (!roomId) {
        throw new Error('Room ID not available');
      }

      await initializeMedia();

      socket?.emit('video:join-room', {
        roomId,
        appointmentId
      });

      setIsCallInitiated(true);
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start video call');
      toast.error('Failed to start video call');
    }
  }, [roomId, appointmentId, socket, initializeMedia]);

  const acceptCall = async () => {
    try {
      if (!roomId) {
        throw new Error('Room ID not available');
      }

      const axiosInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' ? `/videocall/doctor/join/${roomId}` : `/videocall/join/${roomId}`;
      
      const response = await axiosInstance.post(endpoint);

      if (response.data.success) {
        setIncomingCall(false);
        setIsCallInitiated(true);
        await initializeMedia();
        socket?.emit('call_accepted', { roomId, userId });

        // Join room and initiate offer to existing participants
        socket?.emit('video:join-room', { roomId, appointmentId });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error accepting call:', error);
      setError(error.response?.data?.message || 'Failed to accept call');
      toast.error(error.response?.data?.message || 'Failed to accept call');
    }
  };

  const declineCall = async () => {
    try {
      socket?.emit('call_declined', { roomId, userId });
      setIncomingCall(false);
      onCallEnd();
    } catch (error: any) {
      console.error('Error declining call:', error);
    }
  };

  const endCall = async () => {
    try {
      const axiosInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' ? `/videocall/doctor/end/${roomId}` : `/videocall/end/${roomId}`;
      await axiosInstance.post(endpoint);

      socket?.emit('video:leave-room', { roomId });
      socket?.emit('call_ended', { roomId, userId });

      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      localStreamRef.current = null;
      screenStreamRef.current = null;

      onCallEnd();
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast.error(error.response?.data?.message || 'Failed to end call');
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      socket?.emit('video:toggle-audio', { roomId, isMuted: !isMuted });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
      socket?.emit('video:toggle-video', { roomId, isVideoOff: !isVideoOff });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        screenStreamRef.current = screenStream;

        peerConnections.current.forEach(pc => {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        setIsSharingScreen(true);
        socket?.emit('video:start-screen-share', { roomId });
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Failed to share screen');
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }

      setIsSharingScreen(false);
      socket?.emit('video:stop-screen-share', { roomId });
    }
  };

  // Initiate call for non-incoming calls
  useEffect(() => {
    if (!isIncoming && roomId && !isCallInitiated) {
      startCall();
    }
  }, [isIncoming, roomId, isCallInitiated, startCall]);

  // Handle WebRTC offer creation for new participants
  useEffect(() => {
    socket?.on('video:room-participants', (data: VideoCallSession) => {
      console.log('Room participants:', data);
      setParticipants(data.participants.map(p => ({
        userId: p.userId,
        userName: p.userName || 'Unknown',
        socketId: p.socketId,
        userRole: p.userRole || 'patient',
        isMuted: false,
        isVideoOff: false,
        isSharingScreen: false
      })));

      data.participants.forEach(async participant => {
        if (participant.userId !== userId) {
          const pc = createPeerConnection(participant.socketId, participant.userId);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('video:offer', {
              roomId,
              offer,
              targetSocketId: participant.socketId
            });
          } catch (error) {
            console.error('Error creating offer:', error);
            setError('Failed to create WebRTC offer');
          }
        }
      });
    });

    return () => {
      socket?.off('video:room-participants');
    };
  }, [socket, roomId, userId, createPeerConnection]);

  if (incomingCall && !isCallInitiated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-green-500 text-6xl mb-4 animate-pulse">
            <PhoneIncoming className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Incoming Video Call</h2>
          <p className="mb-6 text-gray-300">
            {callerName || `${userRole === 'doctor' ? 'Patient' : 'Doctor'}`} is calling...
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={acceptCall}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Phone className="mr-2 h-5 w-5" />
              Accept
            </button>
            <button
              onClick={declineCall}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Decline
            </button>
          </div>
          <button onClick={onCallEnd} className="mt-4 text-gray-400 hover:text-white">Back</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={onCallEnd}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Video Call</h1>
        <p className="text-gray-400">Appointment ID: {appointmentId}</p>
      </div>
      <div className="flex-1 flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-96 bg-black rounded-lg"
          />
        </div>
        <div className="w-full md:w-1/4">
          <h2 className="text-lg font-semibold mb-2">Your Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 bg-black rounded-lg"
          />
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
              title={isVideoOff ? 'Turn on video' : 'Turn off video'}
            >
              {isVideoOff ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full ${isSharingScreen ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
              title={isSharingScreen ? 'Stop screen share' : 'Start screen share'}
            >
              {isSharingScreen ? <MonitorStop className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
            </button>
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              title="End call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Participants</h2>
        <div className="space-y-2">
          {participants.map(participant => (
            <div key={participant.socketId} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
              <div>
                <p className="font-medium">{participant.userName} ({participant.userRole})</p>
                <p className="text-sm text-gray-400">
                  {participant.isMuted ? 'Muted' : 'Unmuted'} | {participant.isVideoOff ? 'Video Off' : 'Video On'}
                  {participant.isSharingScreen && ' | Sharing Screen'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;