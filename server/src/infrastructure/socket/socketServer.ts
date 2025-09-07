import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { TokenPayload } from "../../shared/AuthType";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'doctor' | 'patient' | 'admin';
  userName?: string;
}

export class SocketServer{
    private io:Server;
    private connectedUsers = new Map<string, string>(); 
  private doctorSockets = new Map<string, string>();

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
            }
        })
        socket.on('mark_notification_read',(data:{notificationId:string})=>{
            socket.emit('notification_read_confirmed',data)
        })
        socket.on('mark_all_notifications_read',(data:{userId:string})=>{
            socket.emit('all_notifications_read_confirmed',data)
        })
        //video call events
        socket.on('video:join-room',(roomId:string)=>{
          socket.join(roomId);
           console.log(`📹 ${socket.userName} joined video room ${roomId}`);
           socket.to(roomId).emit('video:user-joined',{
            userId:socket.userId,
            userName:socket.userName,
            socketId:socket.id,
           })
        })
         socket.on('video:signal', ({ roomId, data }) => {
      console.log(`📶 Signal from ${socket.userName} → room ${roomId}`);
      socket.to(roomId).emit('video:signal', {
        userId: socket.userId,
        socketId: socket.id,
        data,
      });
    });
        socket.on('video:leave-room',(roomId:string)=>{
          socket.leave(roomId);
           console.log(`🚪 ${socket.userName} left video room ${roomId}`);  
           socket.to(roomId).emit('video:user-left',{
            userId:socket.userId,
            userName:socket.userName,
           })
        })
        
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