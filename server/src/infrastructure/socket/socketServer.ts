import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { TokenPayload } from "../../shared/AuthType";
import { any, size, string } from "zod";
import { off } from "process";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'doctor' | 'patient' | 'admin';
  userName?: string;
}

export class SocketServer{
    private io:Server;
    private connectedUsers = new Map<string, string>(); 
  private doctorSockets = new Map<string, string>();
  private activeVideoRooms=new Map<string,Set<string>>()

  constructor(httpServer:HttpServer){
    this.io=new Server(httpServer,{
        cors:{
            origin:process.env.CLIENT_URL || 'http://localhost:5173',
            methods:['GET','POST'],
            credentials:true
        }
    });

    this.setsetupMiddleware();
    this.setupEventHandlers()
  }

  private setsetupMiddleware(){
    this.io.use(async(socket:any,next)=>{
        try {
            const token=socket.handshake.auth.token;
            console.log('token from socket',token);
            if(!token){
                return next(new Error('auth error in socketServer'))
            }
            const authService=container.resolve<AuthService>('AuthService');
            let payload:TokenPayload;
            try {
                payload=authService.verifyAccessToken(token)
            } catch {
                try {
                    payload=authService.verifyDoctorAccessToken(token);
                } catch (error) {
                    payload=authService.verifyAdminAccessToken(token)
                }
                
            }
            socket.userId=payload.userId;
            socket.userRole=payload.role;
            socket.userName=payload.name;
            next()
        } catch (error) {
            next(new Error('authentication error'))
        }
    })
  }
  private setupEventHandlers(){
    this.io.on('connection',(socket:AuthenticatedSocket)=>{
        console.log(`user connected : ${socket.userName}(${socket.userRole})`);

        if(socket.userId){
            this.connectedUsers.set(socket.userId,socket.id);
            if(socket.userRole === 'doctor'){
                this.doctorSockets.set(socket.userId,socket.id)
            }
        }
        socket.join(`user_ ${socket.userId}`);
        socket.join(`${socket.userRole}`)

        socket.on('disconnected',()=>{
            console.log(`User disconnected: ${socket.userName}`);
            if(socket.userId){
                this.connectedUsers.delete(socket.userId)
                this.doctorSockets.delete(socket.userId)

                this.activeVideoRooms.forEach((participants,roomId)=>{
                  if(participants.has(socket.id)){
                    participants.delete(socket.id);
                    socket.to(roomId).emit('video:paticipant-left',{
                      userId:socket.userId,
                      userName:socket.userName,
                      socketId:socket.id,
                    })
                    if(participants.size==0){
                      this.activeVideoRooms.delete(roomId)
                    }
                  }
                })
            }
        })
        socket.on('mark_notification_read',(data:{notificationId:string})=>{
            socket.emit('notification_read_confirmed',data)
        })
        socket.on('mark_all_notifications_read',(data:{userId:string})=>{
            socket.emit('all_notifications_read_confirmed',data)
        })
        //video call events
      //join video call room
      socket.on('video:join-room',(data:{roomId:string,appointmentId?:string})=>{
        const {roomId,appointmentId}=data;
        socket.join(roomId)
        console.log(` ${socket.userName} joined video room ${roomId}`);
        if(!this.activeVideoRooms.has(roomId)){
          this.activeVideoRooms.set(roomId,new Set())
        }
        this.activeVideoRooms.get(roomId)!.add(socket.id)
        const participantsCount=this.activeVideoRooms.get(roomId)!.size;

        //notify existing participants
        socket.to(roomId).emit('video:participant-joined',{
          userId:socket.userId,
            userName: socket.userName,
            userRole: socket.userRole,
            socketId: socket.id,
            participantsCount
        })
         const roomParticipants = Array.from(this.activeVideoRooms.get(roomId)!)
            .filter(id => id !== socket.id)
            .map(id => {
              const participant = Array.from(this.connectedUsers.entries())
                .find(([userId, socketId]) => socketId === id);
              return participant ? { userId: participant[0], socketId: id } : null;
            })
            .filter(Boolean);
          
          socket.emit('video:room-participants', {
            roomId,
            participants: roomParticipants,
            participantsCount
          });
        
      })
      socket.on('video:offer',(data:{roomId:string,offer:any,targetSocketId?:string})=>{
        const{roomId,offer,targetSocketId}=data;
         console.log(` Offer from ${socket.userName} in room ${roomId}`);
        if(targetSocketId){
          socket.to(targetSocketId).emit('video:offer',{
            offer,
            fromSocketId:socket.id,
            fromUserId:socket.userId,
            fromUserName:socket.userName,
            fromUserRole:socket.userRole
          })
        }else{
          socket.to(roomId).emit('video:offer',{
            offer,
              fromSocketId: socket.id,
              fromUserId: socket.userId,
              fromUserName: socket.userName,
              fromUserRole: socket.userRole
          })
        }
      })
      // webrtc signaling-ans
      socket.on('video:answer',(data:{roomId:string,answer:any,targetSocketId:string})=>{
        const{roomId,answer,targetSocketId}=data
        console.log(` Answer from ${socket.userName} in room ${roomId}`);
        socket.to(targetSocketId).emit('video:answer',{
          answer,
          fromSocketId: socket.id,
            fromUserId: socket.userId,
            fromUserName: socket.userName,
            fromUserRole: socket.userRole
        })
      })
      socket.on('video:ice-candidate',(data:{roomId:string,candidate:any,targetSocketId:string})=>{
        const {roomId,candidate,targetSocketId}=data;
        if(targetSocketId){
          socket.to(targetSocketId).emit('video:ice-candidate',{
            candidate,
            fromSocketId: socket.id,
            fromUserId: socket.userId
          })
        }else{
          socket.to(roomId).emit('video:ice-candidate', {
              candidate,
              fromSocketId: socket.id,
              fromUserId: socket.userId
            });
        }
      })
      socket.on('video:leave-room',(data:{roomId:string})=>{
        const {roomId}=data;
        socket.leave(roomId)
         console.log(` ${socket.userName} left video room ${roomId}`);
         if(this.activeVideoRooms.has(roomId)){
          this.activeVideoRooms.get(roomId)!.delete(socket.id);
          if(this.activeVideoRooms.get(roomId)!.size==0){
            this.activeVideoRooms.delete(roomId)
          }
         }
         socket.to(roomId).emit('video:participant-left',{
          userId:socket.userId,
          userName:socket.userName,
          socketId:socket.id,
          participantsCount:this.activeVideoRooms.get(roomId)?.size || 0
         })
      })
      //mute audio
      socket.on('video:toggle-audio',(data:{roomId:string,isMuted:boolean})=>{
        const{roomId,isMuted}=data;
        socket.to(roomId).emit('video:participant-audio-toggle',{
          userId:socket.userId,
          userName:socket.userName,
          isMuted
        })
      })
      //enable or disable video
      socket.on('video:toggle-video',(data:{roomId:string,isVideoOff:boolean})=>{
        const{roomId,isVideoOff}=data;
        socket.to(roomId).emit('video:participant-video-toggle',{
          userId:socket.userId,
          userName:socket.userName,
          isVideoOff
        })
      })
       // Screen sharing
        socket.on('video:start-screen-share', (data: { roomId: string }) => {
          const { roomId } = data;
          socket.to(roomId).emit('video:participant-screen-share-started', {
            userId: socket.userId,
            userName: socket.userName,
            socketId: socket.id
          });
        });
         socket.on('video:stop-screen-share', (data: { roomId: string }) => {
          const { roomId } = data;
          socket.to(roomId).emit('video:participant-screen-share-stopped', {
            userId: socket.userId,
            userName: socket.userName,
            socketId: socket.id
          });
        });

         socket.on('video:connection-quality', (data: { roomId: string, quality: 'poor' | 'fair' | 'good' | 'excellent' }) => {
          const { roomId, quality } = data;
          console.log(`Connection quality for ${socket.userName} in ${roomId}: ${quality}`);
        });
        
    })
  }

  //send notification to specify user
  public sendToUser(userId:string,event:string,data:any){
    const socketId=this.connectedUsers.get(userId);
    if(socketId){
        this.io.to(socketId).emit(event,data)
        return true
    }
    return false
  }
  public sendToDoctor(event:string,data:any){
    this.io.to('doctors').emit(event,data)
  }
  public sendToPatients(event:string,data:any){
    this.io.to('patients').emit(event,data)
  }

  //send appointment notification to doctor
  public sendAppointmentNotificationToDoctor(doctorId:string,notification:any){
    return this.sendToUser(doctorId,'new_notification',notification)
  }
  //send appointment update to patient
  public sendAppointmentUpdateToPatient(patientId:string,notification:any){
    return this.sendToUser(patientId,'appointment_update',notification)
  }
  public getConnectedUserCount():number{
    return this.connectedUsers.size;
  }
  public isUserOnline(userId:string):boolean{
    return this.connectedUsers.has(userId)
  }
  public getIO():Server{
    return this.io
  }
   public getActiveVideoRooms(): Map<string, Set<string>> {
    return this.activeVideoRooms;
  }

  public getRoomParticipantsCount(roomId: string): number {
    return this.activeVideoRooms.get(roomId)?.size || 0;
  }

  public isRoomActive(roomId: string): boolean {
    return this.activeVideoRooms.has(roomId) && this.activeVideoRooms.get(roomId)!.size > 0;
  }
 
}

let socketServer:SocketServer;
export const initializeSocketServer=(httpServer:HttpServer):SocketServer=>{
    socketServer=new SocketServer(httpServer)
    return socketServer
}
export const getSocketServer=():SocketServer=>{
    if(!socketServer){
        throw new Error('socket server not initialized')
    }
    return socketServer
}