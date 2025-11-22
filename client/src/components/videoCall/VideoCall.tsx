// client/src/components/videoCall/VideoCall.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
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
  remoteStream?: MediaStream;
}

const VideoCall: React.FC<VideoCallProps> = ({
  roomId,
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
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
  const [isJoining, setIsJoining] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection | null>>(new Map());
  const iceCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isProcessingOffer = useRef<Map<string, boolean>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const processedParticipants = useRef<Set<string>>(new Set());
  const connectionAttempts = useRef<Map<string, number>>(new Map());

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
    return userRole === 'doctor' ? state.doctorAuth.doctorAuth.doctorAccessToken : state.patientAuth.auth.accessToken;
  };

  const getAxiosInstance = () => {
    return userRole === 'doctor' ? doctorAxiosInstance : axiosInstance;
  };

  // Initialize Media
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
      
      console.log('✅ Local stream initialized');
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

  // Create Peer Connection
  const createPeerConnection = useCallback((socketId: string, targetUserId: string, isInitiator: boolean = false) => {
    if (socketId === socketRef.current?.id) {
      console.log('Skipping peer connection to self');
      return null;
    }

    const existing = peerConnections.current.get(socketId);
    if (existing) {
      console.log(`Reusing existing peer connection for ${socketId}`);
      return existing;
    }

    console.log(`Creating ${isInitiator ? 'INITIATOR' : 'RECEIVER'} peer connection for socket: ${socketId}`);
    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnections.current.set(socketId, pc);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection ${socketId}`);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`📹 Received ${event.track.kind} track from ${socketId}`);
      
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        
        // Update participant with this socketId's stream
        setParticipants(prev => 
          prev.map(p => 
            p.socketId === socketId 
              ? { ...p, remoteStream }
              : p
          )
        );
        
        // Attach to correct video element
        const videoElement = remoteVideoRefs.current.get(socketId);
        if (videoElement) {
          videoElement.srcObject = remoteStream;
          console.log(`✅ Stream attached to video element for ${socketId}`);
        } else {
          console.warn(`❌ No video element found for ${socketId}`);
        }
      }
    };

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`📨 Sending ICE candidate to ${socketId}`);
        socketRef.current?.emit('video:ice-candidate', {
          roomId,
          candidate: event.candidate.toJSON(),
          targetSocketId: socketId
        });
      }
    };

    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log(`🔗 ICE connection state for ${socketId}: ${pc.iceConnectionState}`);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
        toast.success('Connection established');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionState('disconnected');
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionState('failed');
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🌐 Connection state for ${socketId}: ${pc.connectionState}`);
    };

    // Negotiation needed handler
    return pc;
  }, [roomId]);

  // Handle Offer
  const handleOffer = useCallback(async (data: { 
    offer: RTCSessionDescriptionInit; 
    fromSocketId: string; 
    fromUserId: string; 
    fromUserName: string; 
    fromUserRole: string 
  }) => {
    console.log('📥 Received offer from:', data.fromSocketId);
    
    if (data.fromSocketId === socketRef.current?.id) {
      console.log('Ignoring offer from self');
      return;
    }

    if (isProcessingOffer.current.get(data.fromSocketId)) {
      console.log('Already processing offer from', data.fromSocketId);
      return;
    }
    isProcessingOffer.current.set(data.fromSocketId, true);

    try {
      let pc = peerConnections.current.get(data.fromSocketId);
      
      if (!pc) {
        console.log('Creating new peer connection for incoming offer');
        pc = createPeerConnection(data.fromSocketId, data.fromUserId, false);
        
        if (!pc) return;

        // Add participant only if they don't exist
        setParticipants(prev => {
          const exists = prev.find(p => p.userId === data.fromUserId);
          if (!exists) {
            return [...prev, {
              userId: data.fromUserId,
              userName: data.fromUserName,
              socketId: data.fromSocketId,
              userRole: data.fromUserRole as 'doctor' | 'patient',
              isMuted: false,
              isVideoOff: false,
              isSharingScreen: false,
              remoteStream: undefined
            }];
          }
          return prev;
        });
      }

      // Check signaling state before setting remote description
      if (pc.signalingState === 'closed') {
        console.log('Peer connection is closed, cannot set remote description');
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('video:answer', {
        roomId,
        answer: pc.localDescription,
        targetSocketId: data.fromSocketId
      });

      // Process queued ICE candidates
      const queuedCandidates = iceCandidatesQueue.current.get(data.fromSocketId) || [];
      if (queuedCandidates.length > 0) {
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

  // Handle Answer
  const handleAnswer = useCallback(async (data: { 
    answer: RTCSessionDescriptionInit; 
    fromSocketId: string 
  }) => {
    console.log('📤 Received answer from:', data.fromSocketId);
    const pc = peerConnections.current.get(data.fromSocketId);
    
    if (pc && pc.signalingState === 'have-local-offer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        
        const queuedCandidates = iceCandidatesQueue.current.get(data.fromSocketId) || [];
        if (queuedCandidates.length > 0) {
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
    }
  }, []);

  // Handle ICE Candidate
  const handleIceCandidate = useCallback(async (data: { 
    candidate: RTCIceCandidateInit; 
    fromSocketId: string 
  }) => {
    console.log('🧊 Received ICE candidate from:', data.fromSocketId);
    const pc = peerConnections.current.get(data.fromSocketId);
    
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    } else {
      console.log('📦 Queueing ICE candidate');
      const queue = iceCandidatesQueue.current.get(data.fromSocketId) || [];
      queue.push(data.candidate);
      iceCandidatesQueue.current.set(data.fromSocketId, queue);
    }
  }, []);

  // Clean up duplicate participants
  const cleanupDuplicateParticipants = useCallback(() => {
    setParticipants(prev => {
      const uniqueParticipants = prev.filter((participant, index, self) =>
        index === self.findIndex(p => 
          p.userId === participant.userId
        )
      );
      
      if (uniqueParticipants.length !== prev.length) {
        console.log(`🧹 Cleaned up ${prev.length - uniqueParticipants.length} duplicate participants`);
      }
      
      return uniqueParticipants;
    });
  }, []);

  // Initialize Socket
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    if (!roomId) {
      setError('Room ID not available');
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
      console.log(`✅ Socket connected - ID: ${newSocket.id}`);
      setConnectionState('connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnectionState('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionState('failed');
      setError('Failed to connect to video call server');
    });

    // Participant joined - FIXED: Prevent duplicates and self-connections
    newSocket.on('video:participant-joined', async (data: any) => {
      console.log('👤 Participant joined:', data);
      const participantSocketId = data.socketId;

      if (participantSocketId === newSocket.id) {
        console.log('Ignoring self join');
        return;
      }

      // Skip if already processed
      if (processedParticipants.current.has(participantSocketId)) {
        console.log('Participant already processed:', participantSocketId);
        return;
      }
      processedParticipants.current.add(participantSocketId);

      // Add to participants list only if not already present
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === data.userId);
        if (!exists) {
          return [...prev, {
            userId: data.userId,
            userName: data.userName || 'Unknown',
            socketId: participantSocketId,
            userRole: data.userRole as 'doctor' | 'patient',
            isMuted: false,
            isVideoOff: false,
            isSharingScreen: false,
            remoteStream: undefined
          }];
        }
        return prev;
      });

      // Create peer connection and initiate offer
      if (!peerConnections.current.has(participantSocketId) && isCallInitiated && localStreamRef.current) {
        console.log(`🤝 Initiating connection with ${participantSocketId}`);
        
        const pc = createPeerConnection(participantSocketId, data.userId, true);
        if (pc && pc.signalingState === 'stable') {
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await pc.setLocalDescription(offer);
            
            socketRef.current?.emit('video:offer', {
              roomId,
              offer: pc.localDescription,
              targetSocketId: participantSocketId
            });
            
            console.log(`✅ Offer sent to ${participantSocketId}`);
          } catch (error) {
            console.error('❌ Error creating/sending offer:', error);
          }
        }
      }
    });

    // Room participants list - FIXED: Handle only unique participants
    newSocket.on('video:room-participants', async (data: any) => {
      console.log('📋 Room participants list:', data);
      
      if (data.participants && data.participants.length > 0 && isCallInitiated && localStreamRef.current) {
        const newParticipants: Participant[] = [];
        
        // Only process new participants
        for (const participant of data.participants) {
          if (participant.socketId !== newSocket.id && !processedParticipants.current.has(participant.socketId)) {
            console.log(`🔄 Processing initial participant: ${participant.socketId}`);
            processedParticipants.current.add(participant.socketId);

            newParticipants.push({
              userId: participant.userId,
              userName: participant.userName || 'Unknown',
              socketId: participant.socketId,
              userRole: (participant.userRole || 'patient') as 'doctor' | 'patient',
              isMuted: false,
              isVideoOff: false,
              isSharingScreen: false,
              remoteStream: undefined
            });

            // Create peer connection
            if (!peerConnections.current.has(participant.socketId)) {
              const pc = createPeerConnection(participant.socketId, participant.userId, true);
              if (pc && pc.signalingState === 'stable') {
                try {
                  const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                  });
                  await pc.setLocalDescription(offer);
                  
                  socketRef.current?.emit('video:offer', {
                    roomId,
                    offer: pc.localDescription,
                    targetSocketId: participant.socketId
                  });
                  
                  console.log(`✅ Initial offer sent to ${participant.socketId}`);
                } catch (error) {
                  console.error('❌ Error sending initial offer:', error);
                }
              }
            }
          }
        }

        // Update state with all new participants at once
        if (newParticipants.length > 0) {
          setParticipants(prev => {
            const existingUserIds = new Set(prev.map(p => p.userId));
            const uniqueNewParticipants = newParticipants.filter(p => !existingUserIds.has(p.userId));
            return [...prev, ...uniqueNewParticipants];
          });
        }
      }
    });

    // Participant left - FIXED: Proper cleanup
    newSocket.on('video:participant-left', (data: any) => {
      console.log('👋 Participant left:', data);
      const socketId = data.socketId;
      const userId = data.userId;
      
      // Remove by userId to ensure all duplicates are removed
      setParticipants(prev => prev.filter(p => p.userId !== userId));
      
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
      }
      iceCandidatesQueue.current.delete(socketId);
      remoteVideoRefs.current.delete(socketId);
      processedParticipants.current.delete(socketId);
      connectionAttempts.current.delete(socketId);
      
      toast.info(`${data.userName || 'Participant'} left the call`);
    });

    // WebRTC signaling events
    newSocket.on('video:offer', handleOffer);
    newSocket.on('video:answer', handleAnswer);
    newSocket.on('video:ice-candidate', handleIceCandidate);

    // Media state updates
    newSocket.on('video:participant-audio-toggle', (data: any) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, isMuted: data.isMuted } : p))
      );
    });

    newSocket.on('video:participant-video-toggle', (data: any) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, isVideoOff: data.isVideoOff } : p))
      );
    });

    newSocket.on('video:participant-screen-share-started', (data: any) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, isSharingScreen: true } : p))
      );
      toast.info(`${data.userName} started screen sharing`);
    });

    newSocket.on('video:participant-screen-share-stopped', (data: any) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, isSharingScreen: false } : p))
      );
    });

    newSocket.on('video:call-ended', () => {
      console.log('📞 Call ended by server');
      toast.info('The video call has ended');
      setTimeout(() => onCallEnd(), 1000);
    });

    // Join room immediately when socket connects
    newSocket.on('connect', () => {
      console.log(`🎯 Joining room: ${roomId}`);
      newSocket.emit('video:join-room', {
        roomId,
        appointmentId,
        userId,
        userName,
        userRole
      });
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    };
  }, [userRole, userId, handleOffer, handleAnswer, handleIceCandidate, isCallInitiated, roomId, appointmentId, userName, onCallEnd]);

  // Clean up duplicates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupDuplicateParticipants();
    }, 2000);

    return () => clearInterval(interval);
  }, [cleanupDuplicateParticipants]);

  // Start Call
  const startCall = useCallback(async () => {
    try {
      if (!roomId) throw new Error('Room ID not available');

      console.log('🚀 Starting call for room:', roomId);
      await initializeMedia();
      setIsCallInitiated(true);

      toast.success('Video call started');
    } catch (error) {
      console.error('❌ Error starting call:', error);
      setError('Failed to start video call');
      toast.error('Failed to start video call');
    }
  }, [roomId, initializeMedia]);

  // Accept Call
  const acceptCall = async () => {
    if (isJoining) return;
    
    try {
      setIsJoining(true);
      
      if (!roomId) throw new Error('Room ID not available');

      console.log('✅ Accepting call for room:', roomId);
      
      const apiInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' 
        ? `/videocall/doctor/join/${roomId}` 
        : `/videocall/join/${roomId}`;
      
      const response = await apiInstance.post(endpoint);

      if (response.data.success) {
        setIncomingCall(false);
        await initializeMedia();
        setIsCallInitiated(true);
        
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

  // Decline Call
  const declineCall = async () => {
    try {
      console.log('❌ Declining call');
      socketRef.current?.emit('call_declined', { roomId, userId });
      setIncomingCall(false);
      toast.info('Call declined');
      onCallEnd();
    } catch (error: any) {
      console.error('Error declining call:', error);
    }
  };

  // End Call
  const endCall = async () => {
    try {
      console.log('📞 Ending call');
      
      const apiInstance = getAxiosInstance();
      const endpoint = userRole === 'doctor' 
        ? `/videocall/doctor/end/${roomId}` 
        : `/videocall/end/${roomId}`;
      
      await apiInstance.post(endpoint);

      socketRef.current?.emit('video:leave-room', { roomId });

      // Clean up media
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());

      // Close peer connections
      peerConnections.current.forEach((pc) => {
        if (pc) pc.close();
      });

      peerConnections.current.clear();
      iceCandidatesQueue.current.clear();
      remoteVideoRefs.current.clear();
      processedParticipants.current.clear();
      connectionAttempts.current.clear();
      
      localStreamRef.current = null;
      screenStreamRef.current = null;

      toast.success('Call ended');
      onCallEnd();
    } catch (error: any) {
      console.error('❌ Error ending call:', error);
      onCallEnd();
    }
  };

  // Toggle Audio
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

  // Toggle Video
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

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        screenStreamRef.current = screenStream;
        
        peerConnections.current.forEach(pc => {
          if (!pc) return;
          
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

  // Stop Screen Share
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      // Stop all screen tracks
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;

      // Replace video track in each peer connection
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];

        peerConnections.current.forEach(pc => {
          if (!pc) return;

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

  // Auto-start call when component mounts
  useEffect(() => {
    if (!isIncoming && roomId && !isCallInitiated && socket) {
      console.log('🎯 Auto-starting call');
      startCall();
    }
  }, [isIncoming, roomId, isCallInitiated, socket, startCall]);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 VideoCall component unmounting - cleaning up');
      remoteVideoRefs.current.clear();
      participants.forEach(p => {
        p.remoteStream?.getTracks().forEach(track => track.stop());
      });
      
      // Clean up media streams
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Calculate actual participant count (excluding self)
  const actualParticipantCount = participants.filter(p => p.userId !== userId).length;

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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

  // Main Video Call UI
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
              <span className="text-sm text-gray-400">
                {actualParticipantCount} participant{actualParticipantCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Container - Grid Layout */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Remote Videos - Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[70vh]">
          {actualParticipantCount === 0 ? (
            <div className="bg-black rounded-lg flex items-center justify-center col-span-full h-96 lg:h-full">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Waiting for other participant...</p>
                <p className="text-sm text-gray-500 mt-2">Participants: {actualParticipantCount}</p>
              </div>
            </div>
          ) : (
            participants
              .filter(participant => participant.userId !== userId) // Exclude self
              .map((participant) => (
              <div key={`${participant.userId}-${participant.socketId}`} className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(participant.socketId, el);
                      if (participant.remoteStream) {
                        el.srcObject = participant.remoteStream;
                      }
                    } else {
                      remoteVideoRefs.current.delete(participant.socketId);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ height: actualParticipantCount === 1 ? '70vh' : '35vh' }}
                />
                
                {/* No stream placeholder */}
                {!participant.remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <Users className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">{participant.userName}</p>
                      <p className="text-xs text-gray-500">Connecting...</p>
                    </div>
                  </div>
                )}
                
                {/* Participant info overlay */}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                  <div className="text-xs flex items-center space-x-1">
                    <span className="font-medium">{participant.userName}</span>
                    <span className="text-gray-400">({participant.userRole})</span>
                    {participant.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                    {participant.isVideoOff && <CameraOff className="h-3 w-3 text-red-400" />}
                    {participant.isSharingScreen && <Monitor className="h-3 w-3 text-blue-400" />}
                  </div>
                </div>
              </div>
            ))
          )}
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
            {actualParticipantCount > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 text-gray-400">Participants ({actualParticipantCount})</h4>
                <div className="space-y-2">
                  {participants
                    .filter(participant => participant.userId !== userId)
                    .map(participant => (
                    <div 
                      key={`${participant.userId}-${participant.socketId}`} 
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