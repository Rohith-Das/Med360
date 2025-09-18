import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { store } from "@/app/store";
import { RootState } from "@/app/store";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Monitor, MonitorStop, Phone, PhoneIncoming, Users } from 'lucide-react';
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
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isCallInitiated, setIsCallInitiated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState(isIncoming);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
  const [isJoining, setIsJoining] = useState(false);

  // Refs
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
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  const getAuthToken = () => {
    const state: RootState = store.getState();
    return userRole === 'doctor' ? state.doctorAuth.doctorAccessToken : state.auth.accessToken;
  };

  const getAxiosInstance = () => {
    return userRole === 'doctor' ? doctorAxiosInstance : axiosInstance;
  };

  // Initialize Socket.IO with enhanced error handling
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found');
      toast.error('Authentication token not found');
      return;
    }

    const newSocket = io('http://localhost:5001', {
      auth: { token, userId, userType: userRole },
      withCredentials: true,
      timeout: 20000,
      forceNew: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`Socket connected for ${userRole}: ${userId}`);
      setConnectionState('connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionState('failed');
      setError('Failed to connect to video call server');
    });

    // Enhanced incoming call handling
    newSocket.on('incoming_video_call', (data) => {
      console.log('Socket: Incoming video call:', data);
      setIncomingCall(true);
      setRoomId(data.roomId);
      toast.info(`Incoming video call from ${data.initiatorRole === 'doctor' ? 'Dr. ' : ''}${data.initiatorName}`, {
        autoClose: 10000,
      });
    });

    // Participant management
    newSocket.on('video:participant-joined', (data: Participant & { participantsCount: number }) => {
      console.log('Participant joined:', data);
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === data.userId);
        if (exists) return prev;
        
        const newParticipant = {
          userId: data.userId,
          userName: data.userName,
          socketId: data.socketId,
          userRole: data.userRole,
          isMuted: false,
          isVideoOff: false,
          isSharingScreen: false
        };
        
        return [...prev, newParticipant];
      });
      
      // Create peer connection for new participant if we're already in the call
      if (isCallInitiated && localStreamRef.current) {
        setTimeout(() => createPeerConnection(data.socketId, data.userId), 100);
      }
    });

    newSocket.on('video:participant-left', (data: { socketId: string; userId: string }) => {
      console.log('Participant left:', data);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      
      // Clean up peer connection
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      iceCandidatesQueue.current.delete(data.socketId);
    });

    // WebRTC signaling
    newSocket.on('video:offer', handleOffer);
    newSocket.on('video:answer', handleAnswer);
    newSocket.on('video:ice-candidate', handleIceCandidate);

    // Media state updates
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

    // Screen sharing
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

    // Call status events
    newSocket.on('video:call-ended', () => {
      console.log('Call ended by server');
      toast.info('The video call has ended');
      setTimeout(() => onCallEnd(), 1000);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [userRole, userId]);

  // Enhanced peer connection creation with better error handling
  const createPeerConnection = useCallback((socketId: string, targetUserId: string) => {
    if (peerConnections.current.has(socketId)) {
      return peerConnections.current.get(socketId)!;
    }

    console.log(`Creating peer connection for socket: ${socketId}`);
    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnections.current.set(socketId, pc);

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log(`Sending ICE candidate to ${socketId}`);
        socket.emit('video:ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetSocketId: socketId
        });
      }
    };

    // Remote stream handling
    pc.ontrack = (event) => {
      console.log('Received remote track from:', socketId);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Adding local track to peer connection: ${track.kind}`);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${socketId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionState('disconnected');
        if (pc.iceConnectionState === 'failed') {
          console.log(`Peer connection failed for ${socketId}, cleaning up`);
          pc.close();
          peerConnections.current.delete(socketId);
        }
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`Signaling state for ${socketId}: ${pc.signalingState}`);
    };

    return pc;
  }, [roomId, socket]);

  // Media initialization with better error handling
  const initializeMedia = useCallback(async () => {
    try {
      console.log('Initializing media...');
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('Local stream initialized:', stream.id);
      
      // Add tracks to existing peer connections
      peerConnections.current.forEach((pc, socketId) => {
        console.log(`Adding tracks to existing peer connection: ${socketId}`);
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });
      
      setError(null);
      return stream;
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      let errorMessage = 'Failed to access camera or microphone';
      
      if (err.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found';
      } else if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // WebRTC signaling handlers
  const handleOffer = useCallback(async (data: { 
    offer: RTCSessionDescriptionInit; 
    fromSocketId: string; 
    fromUserId: string; 
    fromUserName: string; 
    fromUserRole: string 
  }) => {
    console.log('Handling offer from:', data.fromSocketId);
    
    let pc = peerConnections.current.get(data.fromSocketId);
    if (!pc) {
      pc = createPeerConnection(data.fromSocketId, data.fromUserId);
      
      // Add participant if not exists
      setParticipants(prev => {
        const exists = prev.find(p => p.socketId === data.fromSocketId);
        if (!exists) {
          return [...prev, {
            userId: data.fromUserId,
            userName: data.fromUserName,
            socketId: data.fromSocketId,
            userRole: data.fromUserRole as 'doctor' | 'patient',
            isMuted: false,
            isVideoOff: false,
            isSharingScreen: false
          }];
        }
        return prev;
      });
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('video:answer', {
        roomId,
        answer,
        targetSocketId: data.fromSocketId
      });

      // Process queued ICE candidates
      const queuedCandidates = iceCandidatesQueue.current.get(data.fromSocketId) || [];
      for (const candidate of queuedCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidatesQueue.current.delete(data.fromSocketId);
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to handle WebRTC offer');
    }
  }, [createPeerConnection, roomId, socket]);

  const handleAnswer = useCallback(async (data: { 
    answer: RTCSessionDescriptionInit; 
    fromSocketId: string 
  }) => {
    console.log('Handling answer from:', data.fromSocketId);
    const pc = peerConnections.current.get(data.fromSocketId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        
        // Process queued ICE candidates
        const queuedCandidates = iceCandidatesQueue.current.get(data.fromSocketId) || [];
        for (const candidate of queuedCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidatesQueue.current.delete(data.fromSocketId);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (data: { 
    candidate: RTCIceCandidateInit; 
    fromSocketId: string 
  }) => {
    console.log('Handling ICE candidate from:', data.fromSocketId);
    const pc = peerConnections.current.get(data.fromSocketId);
    
    if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    } else {
      // Queue ICE candidate
      const queue = iceCandidatesQueue.current.get(data.fromSocketId) || [];
      queue.push(data.candidate);
      iceCandidatesQueue.current.set(data.fromSocketId, queue);
    }
  }, []);

  // Call management functions
  const startCall = useCallback(async () => {
    try {
      if (!roomId) {
        throw new Error('Room ID not available');
      }

      console.log('Starting call...');
      await initializeMedia();
      setIsCallInitiated(true);

      socket?.emit('video:join-room', {
        roomId,
        appointmentId,
        userId,
        userName,
        userRole
      });

      console.log('Call started successfully');
      toast.success('Video call started');
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start video call');
      toast.error('Failed to start video call');
    }
  }, [roomId, appointmentId, socket, initializeMedia, userId, userName, userRole]);

  // Enhanced accept call function
  const acceptCall = async () => {
    if (isJoining) return;
    
    try {
      setIsJoining(true);
      
      if (!roomId) {
        throw new Error('Room ID not available');
      }

      console.log('Accepting call for room:', roomId);
      
      const axiosInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' 
        ? `/videocall/doctor/join/${roomId}` 
        : `/videocall/join/${roomId}`;
      
      const response = await axiosInstance.post(endpoint);

      if (response.data.success) {
        console.log('Call accepted via API');
        setIncomingCall(false);
        
        // Initialize media first
        await initializeMedia();
        setIsCallInitiated(true);
        
        // Emit acceptance events
        socket?.emit('call_accepted', { roomId, userId });
        socket?.emit('video:join-room', { 
          roomId, 
          appointmentId,
          userId,
          userName,
          userRole
        });
        
        toast.success('Joined video call');
        console.log('Call accepted successfully');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error accepting call:', error);
      const errorMessage = error.response?.data?.message || 'Failed to accept call';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const declineCall = async () => {
    try {
      console.log('Declining call');
      socket?.emit('call_declined', { roomId, userId });
      setIncomingCall(false);
      toast.info('Call declined');
      onCallEnd();
    } catch (error: any) {
      console.error('Error declining call:', error);
    }
  };

  const endCall = async () => {
    try {
      console.log('Ending call');
      
      const axiosInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' 
        ? `/videocall/doctor/end/${roomId}` 
        : `/videocall/end/${roomId}`;
      
      await axiosInstance.post(endpoint);

      // Emit socket events
      socket?.emit('video:leave-room', { roomId });
      socket?.emit('call_ended', { roomId, userId });

      // Clean up media and connections
      localStreamRef.current?.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      
      screenStreamRef.current?.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped screen share track');
      });

      // Close all peer connections
      peerConnections.current.forEach((pc, socketId) => {
        console.log(`Closing peer connection: ${socketId}`);
        pc.close();
      });
      peerConnections.current.clear();
      iceCandidatesQueue.current.clear();
      
      localStreamRef.current = null;
      screenStreamRef.current = null;

      toast.success('Call ended');
      onCallEnd();
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast.error(error.response?.data?.message || 'Failed to end call');
      // Still try to clean up locally
      onCallEnd();
    }
  };

  // Media control functions
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newMutedState = !isMuted;
      
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
      
      setIsMuted(newMutedState);
      socket?.emit('video:toggle-audio', { roomId, isMuted: newMutedState });
      
      toast.info(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const newVideoOffState = !isVideoOff;
      
      videoTracks.forEach(track => {
        track.enabled = !newVideoOffState;
      });
      
      setIsVideoOff(newVideoOffState);
      socket?.emit('video:toggle-video', { roomId, isVideoOff: newVideoOffState });
      
      toast.info(newVideoOffState ? 'Camera turned off' : 'Camera turned on');
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

        // Replace video track in all peer connections
        peerConnections.current.forEach(pc => {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        setIsSharingScreen(true);
        socket?.emit('video:start-screen-share', { roomId });
        toast.success('Screen sharing started');
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

      // Restore camera video in all peer connections
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
      toast.info('Screen sharing stopped');
    }
  };

  // Auto-start call for non-incoming calls
  useEffect(() => {
    if (!isIncoming && roomId && !isCallInitiated && socket) {
      startCall();
    }
  }, [isIncoming, roomId, isCallInitiated, socket, startCall]);

  // Handle room participants update
  useEffect(() => {
    if (!socket) return;

    const handleRoomParticipants = (data: VideoCallSession) => {
      console.log('Room participants update:', data);
      
      // Update participants list
      const updatedParticipants = data.participants.map(p => ({
        userId: p.userId,
        userName: p.userName || 'Unknown',
        socketId: p.socketId,
        userRole: p.userRole || 'patient' as 'doctor' | 'patient',
        isMuted: false,
        isVideoOff: false,
        isSharingScreen: false
      }));
      
      setParticipants(updatedParticipants);

      // Create offers for new participants if we have local stream
      if (isCallInitiated && localStreamRef.current) {
        data.participants.forEach(async participant => {
          if (participant.userId !== userId && participant.socketId !== socket?.id) {
            if (!peerConnections.current.has(participant.socketId)) {
              console.log(`Creating offer for new participant: ${participant.socketId}`);
              const pc = createPeerConnection(participant.socketId, participant.userId);
              
              try {
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true
                });
                await pc.setLocalDescription(offer);
                
                socket?.emit('video:offer', {
                  roomId,
                  offer,
                  targetSocketId: participant.socketId
                });
              } catch (error) {
                console.error('Error creating offer:', error);
              }
            }
          }
        });
      }
    };

    socket.on('video:room-participants', handleRoomParticipants);
    
    return () => {
      socket.off('video:room-participants', handleRoomParticipants);
    };
  }, [socket, roomId, userId, createPeerConnection, isCallInitiated]);

  // Render incoming call screen
  if (incomingCall && !isCallInitiated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <div className="text-center bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="text-blue-400 text-6xl mb-6 animate-pulse">
            <PhoneIncoming className="mx-auto" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Incoming Video Call</h2>
          <p className="mb-8 text-xl text-gray-200">
            {callerName || `${userRole === 'doctor' ? 'Patient' : 'Doctor'}`} is calling...
          </p>
          <div className="flex justify-center space-x-6">
            <button
              onClick={acceptCall}
              disabled={isJoining}
              className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Phone className="mr-3 h-6 w-6" />
              {isJoining ? 'Joining...' : 'Accept'}
            </button>
            <button
              onClick={declineCall}
              disabled={isJoining}
              className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center text-lg font-semibold shadow-lg"
            >
              <PhoneOff className="mr-3 h-6 w-6" />
              Decline
            </button>
          </div>
          <button 
            onClick={onCallEnd} 
            className="mt-6 text-gray-300 hover:text-white transition-colors underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render error screen
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={onCallEnd}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main video call interface
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Video Call</h1>
            <p className="text-sm text-gray-400">
              Room: {roomId} | Appointment: {appointmentId}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' : 
                connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-400 capitalize">{connectionState}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{participants.length + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Remote Video - Main */}
        <div className="flex-1">
          <div className="relative bg-black rounded-lg overflow-hidden h-96 lg:h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Waiting for other participant...</p>
                </div>
              </div>
            )}
            
            {/* Remote participant info overlay */}
            {participants.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-sm">
                  {participants.map(p => (
                    <div key={p.userId} className="flex items-center space-x-2">
                      <span className="font-medium">{p.userName}</span>
                      <span className="text-xs text-gray-400">({p.userRole})</span>
                      {p.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                      {p.isVideoOff && <CameraOff className="h-3 w-3 text-red-400" />}
                      {p.isSharingScreen && <Monitor className="h-3 w-3 text-blue-400" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Local Video - Sidebar */}
        <div className="w-full lg:w-80">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Your Video</h3>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <CameraOff className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              {/* Local user info */}
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                <div className="text-xs flex items-center space-x-1">
                  <span>{userName}</span>
                  {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                  {isVideoOff && <CameraOff className="h-3 w-3 text-red-400" />}
                  {isSharingScreen && <Monitor className="h-3 w-3 text-blue-400" />}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggleAudio}
                className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  isVideoOff 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  isSharingScreen 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isSharingScreen ? 'Stop screen share' : 'Share screen'}
              >
                {isSharingScreen ? <MonitorStop className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </button>

              <button
                onClick={endCall}
                className="flex items-center justify-center p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-all duration-200"
                title="End call"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 text-gray-400">Participants</h4>
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div 
                      key={participant.socketId} 
                      className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{participant.userName}</p>
                        <p className="text-xs text-gray-400 capitalize">
                          {participant.userRole}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.isMuted && (
                          <MicOff className="h-4 w-4 text-red-400" />
                        )}
                        {participant.isVideoOff && (
                          <CameraOff className="h-4 w-4 text-red-400" />
                        )}
                        {participant.isSharingScreen && (
                          <Monitor className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading/Status Overlay */}
      {(connectionState === 'connecting' || isJoining) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">
              {isJoining ? 'Joining call...' : 'Connecting to video call...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;