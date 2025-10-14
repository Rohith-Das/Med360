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
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isProcessingOffer = useRef<Map<string, boolean>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const navigate = useNavigate();

  // WebRTC Configuration
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };

  const getAuthToken = () => {
    const state: RootState = store.getState();
    return userRole === 'doctor' ? state.doctorAuth.doctorAccessToken : state.auth.accessToken;
  };

  const getAxiosInstance = () => {
    return userRole === 'doctor' ? doctorAxiosInstance : axiosInstance;
  };

  // Media initialization with better error handling
  const initializeMedia = useCallback(async () => {
    try {
      console.log('🎥 Initializing media devices...');
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
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
      
      console.log('✅ Local stream initialized:', {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      setError(null);
      return stream;
    } catch (err: any) {
      console.error('❌ Error accessing media devices:', err);
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

  // Enhanced peer connection creation
  const createPeerConnection = useCallback((socketId: string, targetUserId: string, isInitiator: boolean = false) => {
    // Don't create connection for our own socket
    if (socketId === socketRef.current?.id) {
      console.log('⚠️ Skipping peer connection to self');
      return null;
    }

    // Check if connection already exists
    if (peerConnections.current.has(socketId)) {
      console.log(`♻️ Reusing existing peer connection for ${socketId}`);
      return peerConnections.current.get(socketId)!;
    }

    console.log(`🔗 Creating ${isInitiator ? 'INITIATOR' : 'RECEIVER'} peer connection for socket: ${socketId}`);
    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnections.current.set(socketId, pc);

    // Add local tracks FIRST before any signaling
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`➕ Adding ${track.kind} track to peer connection ${socketId}`);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 Sending ICE candidate to ${socketId}`);
        socketRef.current?.emit('video:ice-candidate', {
          roomId,
          candidate: event.candidate.toJSON(),
          targetSocketId: socketId
        });
      }
    };

    // Remote stream handling - CRITICAL FIX
    pc.ontrack = (event) => {
      console.log(`📹 Received ${event.track.kind} track from ${socketId}`, {
        streamId: event.streams[0]?.id,
        trackId: event.track.id
      });
      
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        
        // Update or create remote stream
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = remoteStream;
        } else {
          // Add new tracks to existing stream
          remoteStream.getTracks().forEach(track => {
            if (!remoteStreamRef.current!.getTracks().find(t => t.id === track.id)) {
              remoteStreamRef.current!.addTrack(track);
            }
          });
        }
        
        // Attach to video element
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          console.log('✅ Remote stream attached to video element');
        }
      }
    };

    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log(`🔌 ICE connection state for ${socketId}: ${pc.iceConnectionState}`);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
        console.log('✅ Peer connection established successfully');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionState('disconnected');
        console.warn('⚠️ Peer connection disconnected');
      } else if (pc.iceConnectionState === 'failed') {
        console.error('❌ Peer connection failed');
        setConnectionState('failed');
        
        // Attempt ICE restart
        console.log('🔄 Attempting ICE restart...');
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state for ${socketId}: ${pc.connectionState}`);
    };

    pc.onsignalingstatechange = () => {
      console.log(`📡 Signaling state for ${socketId}: ${pc.signalingState}`);
    };

    // Negotiation needed handler
    pc.onnegotiationneeded = async () => {
      if (isInitiator && pc.signalingState === 'stable') {
        console.log(`🤝 Negotiation needed for ${socketId}, creating offer...`);
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);
          
          socketRef.current?.emit('video:offer', {
            roomId,
            offer: pc.localDescription,
            targetSocketId: socketId
          });
          console.log('📤 Sent offer to', socketId);
        } catch (error) {
          console.error('❌ Error in negotiation:', error);
        }
      }
    };

    return pc;
  }, [roomId]);

  // WebRTC signaling handlers
  const handleOffer = useCallback(async (data: { 
    offer: RTCSessionDescriptionInit; 
    fromSocketId: string; 
    fromUserId: string; 
    fromUserName: string; 
    fromUserRole: string 
  }) => {
    console.log('📥 Received offer from:', data.fromSocketId);
    
    // Prevent processing duplicate offers
    if (isProcessingOffer.current.get(data.fromSocketId)) {
      console.log('⚠️ Already processing offer from', data.fromSocketId);
      return;
    }
    isProcessingOffer.current.set(data.fromSocketId, true);

    try {
      let pc = peerConnections.current.get(data.fromSocketId);
      
      // Create new peer connection if doesn't exist
      if (!pc) {
        console.log('🆕 Creating new peer connection for incoming offer');
        pc = createPeerConnection(data.fromSocketId, data.fromUserId, false);
        
        if (!pc) {
          console.error('❌ Failed to create peer connection');
          return;
        }

        // Add participant
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

      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('✅ Set remote description from offer');

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('✅ Created and set local description (answer)');

      socketRef.current?.emit('video:answer', {
        roomId,
        answer: pc.localDescription,
        targetSocketId: data.fromSocketId
      });
      console.log('📤 Sent answer to', data.fromSocketId);

      // Process queued ICE candidates
      const queuedCandidates = iceCandidatesQueue.current.get(data.fromSocketId) || [];
      if (queuedCandidates.length > 0) {
        console.log(`🧊 Processing ${queuedCandidates.length} queued ICE candidates`);
        for (const candidate of queuedCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding queued ICE candidate:', err);
          }
        }
        iceCandidatesQueue.current.delete(data.fromSocketId);
      }
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      setError('Failed to establish connection');
    } finally {
      isProcessingOffer.current.set(data.fromSocketId, false);
    }
  }, [createPeerConnection, roomId]);

  const handleAnswer = useCallback(async (data: { 
    answer: RTCSessionDescriptionInit; 
    fromSocketId: string 
  }) => {
    console.log('📥 Received answer from:', data.fromSocketId);
    const pc = peerConnections.current.get(data.fromSocketId);
    
    if (pc && pc.signalingState === 'have-local-offer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('✅ Set remote description from answer');
        
        // Process queued ICE candidates
        const queuedCandidates = iceCandidatesQueue.current.get(data.fromSocketId) || [];
        if (queuedCandidates.length > 0) {
          console.log(`🧊 Processing ${queuedCandidates.length} queued ICE candidates`);
          for (const candidate of queuedCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Error adding queued ICE candidate:', err);
            }
          }
          iceCandidatesQueue.current.delete(data.fromSocketId);
        }
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    } else {
      console.warn('⚠️ Received answer but peer connection not in correct state:', pc?.signalingState);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data: { 
    candidate: RTCIceCandidateInit; 
    fromSocketId: string 
  }) => {
    console.log('🧊 Received ICE candidate from:', data.fromSocketId);
    const pc = peerConnections.current.get(data.fromSocketId);
    
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('✅ Added ICE candidate');
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    } else {
      // Queue ICE candidate if remote description not set yet
      console.log('📦 Queueing ICE candidate (remote description not set)');
      const queue = iceCandidatesQueue.current.get(data.fromSocketId) || [];
      queue.push(data.candidate);
      iceCandidatesQueue.current.set(data.fromSocketId, queue);
    }
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found');
      toast.error('Authentication token not found');
      return;
    }

    console.log('🔌 Initializing socket connection...');
    const newSocket = io('http://localhost:5001', {
      auth: { token, userId, userType: userRole },
      withCredentials: true,
      timeout: 20000,
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log(`✅ Socket connected - ID: ${newSocket.id}, Role: ${userRole}, User: ${userId}`);
      setConnectionState('connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnectionState('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionState('failed');
      setError('Failed to connect to video call server');
    });

    // Incoming call handling
    newSocket.on('incoming_video_call', (data) => {
      console.log('📞 Incoming video call:', data);
      setIncomingCall(true);
      setRoomId(data.roomId);
      toast.info(`Incoming video call from ${data.initiatorRole === 'doctor' ? 'Dr. ' : ''}${data.initiatorName}`, {
        autoClose: 10000,
      });
    });

    // Participant events
    newSocket.on('video:participant-joined', (data: Participant & { participantsCount: number }) => {
      console.log('👤 Participant joined:', data);
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === data.userId);
        if (exists) return prev;
        
        return [...prev, {
          userId: data.userId,
          userName: data.userName,
          socketId: data.socketId,
          userRole: data.userRole,
          isMuted: false,
          isVideoOff: false,
          isSharingScreen: false
        }];
      });
    });

    newSocket.on('video:participant-left', (data: { socketId: string; userId: string }) => {
      console.log('👋 Participant left:', data);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
        console.log('🗑️ Cleaned up peer connection for', data.socketId);
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

    // Call end
    newSocket.on('video:call-ended', () => {
      console.log('📞 Call ended by server');
      toast.info('The video call has ended');
      setTimeout(() => onCallEnd(), 1000);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    };
  }, [userRole, userId, handleOffer, handleAnswer, handleIceCandidate]);

  // Handle room participants and initiate connections
  useEffect(() => {
    if (!socket || !isCallInitiated || !localStreamRef.current) return;

    const handleRoomParticipants = async (data: { 
      roomId: string;
      participants: Array<{ userId: string; userName: string; socketId: string; userRole: string }>;
      participantsCount: number;
    }) => {
      console.log('👥 Room participants update:', data);
      
      // Update participants
      const updatedParticipants = data.participants
        .filter(p => p.socketId !== socket.id) // Exclude self
        .map(p => ({
          userId: p.userId,
          userName: p.userName || 'Unknown',
          socketId: p.socketId,
          userRole: (p.userRole || 'patient') as 'doctor' | 'patient',
          isMuted: false,
          isVideoOff: false,
          isSharingScreen: false
        }));
      
      setParticipants(updatedParticipants);

      // Create peer connections and send offers to other participants
      for (const participant of updatedParticipants) {
        if (participant.socketId !== socket.id) {
          console.log(`🤝 Initiating connection with ${participant.userName} (${participant.socketId})`);
          
          const pc = createPeerConnection(participant.socketId, participant.userId, true);
          if (pc && pc.signalingState === 'stable') {
            try {
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
              await pc.setLocalDescription(offer);
              
              socket.emit('video:offer', {
                roomId: data.roomId,
                offer: pc.localDescription,
                targetSocketId: participant.socketId
              });
              console.log('📤 Sent offer to', participant.socketId);
            } catch (error) {
              console.error('❌ Error creating/sending offer:', error);
            }
          }
        }
      }
    };

    socket.on('video:room-participants', handleRoomParticipants);
    
    return () => {
      socket.off('video:room-participants', handleRoomParticipants);
    };
  }, [socket, isCallInitiated, createPeerConnection]);

  // Call management functions
  const startCall = useCallback(async () => {
    try {
      if (!roomId) {
        throw new Error('Room ID not available');
      }

      console.log('📞 Starting call for room:', roomId);
      await initializeMedia();
      setIsCallInitiated(true);

      // Small delay to ensure media is ready
      setTimeout(() => {
        socketRef.current?.emit('video:join-room', {
          roomId,
          appointmentId,
          userId,
          userName,
          userRole
        });
        console.log('✅ Joined video room');
      }, 500);

      toast.success('Video call started');
    } catch (error) {
      console.error('❌ Error starting call:', error);
      setError('Failed to start video call');
      toast.error('Failed to start video call');
    }
  }, [roomId, appointmentId, initializeMedia, userId, userName, userRole]);

  const acceptCall = async () => {
    if (isJoining) return;
    
    try {
      setIsJoining(true);
      
      if (!roomId) {
        throw new Error('Room ID not available');
      }

      console.log('✅ Accepting call for room:', roomId);
      
      const axiosInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' 
        ? `/videocall/doctor/join/${roomId}` 
        : `/videocall/join/${roomId}`;
      
      const response = await axiosInstance.post(endpoint);

      if (response.data.success) {
        console.log('✅ Call accepted via API');
        setIncomingCall(false);
        
        await initializeMedia();
        setIsCallInitiated(true);
        
        setTimeout(() => {
          socketRef.current?.emit('video:join-room', { 
            roomId, 
            appointmentId,
            userId,
            userName,
            userRole
          });
          console.log('✅ Joined video room after accepting');
        }, 500);
        
        toast.success('Joined video call');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('❌ Error accepting call:', error);
      const errorMessage = error.response?.data?.message || 'Failed to accept call';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const declineCall = async () => {
    try {
      console.log('❌ Declining call');
      socketRef.current?.emit('call_declined', { roomId, userId });
      setIncomingCall(false);
      toast.info('Call declined');
      onCallEnd();
    } catch (error: any) {
      console.error('❌ Error declining call:', error);
    }
  };

  const endCall = async () => {
    try {
      console.log('📞 Ending call');
      
      const axiosInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' 
        ? `/videocall/doctor/end/${roomId}` 
        : `/videocall/end/${roomId}`;
      
      await axiosInstance.post(endpoint);

      socketRef.current?.emit('video:leave-room', { roomId });

      // Clean up media
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());

      // Close peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      iceCandidatesQueue.current.clear();
      
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      screenStreamRef.current = null;

      toast.success('Call ended');
      onCallEnd();
    } catch (error: any) {
      console.error('❌ Error ending call:', error);
      onCallEnd();
    }
  };

  // Media controls
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newMutedState = !isMuted;
      
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
      
      setIsMuted(newMutedState);
      socketRef.current?.emit('video:toggle-audio', { roomId, isMuted: newMutedState });
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
      socketRef.current?.emit('video:toggle-video', { roomId, isVideoOff: newVideoOffState });
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

        peerConnections.current.forEach(pc => {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        setIsSharingScreen(true);
        socketRef.current?.emit('video:start-screen-share', { roomId });
        toast.success('Screen sharing started');
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('❌ Error sharing screen:', error);
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
      socketRef.current?.emit('video:stop-screen-share', { roomId });
      toast.info('Screen sharing stopped');
    }
  };

  // Auto-start for non-incoming calls
  useEffect(() => {
    if (!isIncoming && roomId && !isCallInitiated && socket) {
      console.log('🚀 Auto-starting call (not incoming)');
      startCall();
    }
  }, [isIncoming, roomId, isCallInitiated, socket, startCall]);

  // Incoming call UI
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

  // Error UI
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

  // Main video call UI
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Video Call</h1>
            <p className="text-sm text-gray-400">
              Room: {roomId?.substring(0, 20)}... | Appointment: {appointmentId}
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
            {!remoteStreamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Waiting for other participant...</p>
                  <p className="text-sm text-gray-500 mt-2">Participants: {participants.length}</p>
                </div>
              </div>
            )}
            
            {/* Remote participant info */}
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

      {/* Loading overlay */}
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