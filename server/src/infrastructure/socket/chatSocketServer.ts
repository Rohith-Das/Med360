import { Socket,Server } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { TokenPayload } from "../../shared/AuthType";
import { auth } from "google-auth-library";
import { timeStamp } from "console";
import { boolean } from "zod";

interface AuthenticatedChatSocket extends Socket{
    userId?:string;
    userRole?:'doctor'|'patient';
    userName?:string
}
export class ChatSocketServer{
    private io:Server;
    private conntectedUser=new Map<string,string>();
    private userSocket=new Map<string,string>();
    private chatRooms=new Map<string ,Set<string>>();
    // private typingUsers=new Map<string,Set<string>>();
    private onlineUsers=new Set<string>();

    constructor(httpServer:HttpServer,path:string='/chat-socket'){
        this.io=new Server(httpServer,{
            path,
            cors:{
                origin:process.env.CLIENT_URL||'http://localhost:5173',
                methods:['GET','POST'],
                credentials:true
            }
        })
        this.setupMiddleware();
        this.setupEventHandlers()
    }
    private setupMiddleware(){
        this.io.use(async(socket:any,next)=>{
            try {
                const token=socket.handshak.auth.token;
                console.log('chat socket auth token is received');
                if(!token){
                    return next(new Error('authentication token missing '))
                }

                const authService=container.resolve<AuthService>('AuthServic')
                let payload:TokenPayload;

                try {
                    payload=authService.verifyAccessToken(token)
                } catch{
                    try {
                        payload=authService.verifyDoctorAccessToken(token)
                    } catch (error) {
                        return next(new Error('invalid auth tokens'))
                    }
                }

                socket.userId=payload.userId;
                socket.userRole=payload.role==='patient'?'patient':'doctor';
                socket.userName=payload.name;
                console.log(`Chat socket authenticated:${socket.userName},${socket.userRole}`);
                next()
            } catch (error) {
                 console.error('Chat socket authentication error:', error);
        next(new Error('Authentication failed'));
            }
        })
    }
    private setupEventHandlers(){
        this.io.on('connection',(socket:AuthenticatedChatSocket)=>{
            console.log(`chat user connected :${socket.userName}, ${socket.userRole} socket:${socket.id}`);
            if(socket.userId){
                this.conntectedUser.set(socket.userId,socket.id);
                this.userSocket.set(socket.id,socket.userId)
                this.onlineUsers.add(socket.userId)

                socket.join(`user_${socket.userId}`)
                this.onlineStatus(socket.userId,socket.userName!,socket.userRole!,true)

                //chat room mgt
                socket.on('chat:join-room',(data:{appointmentId:string})=>{
                    this.handleJoinRoom(socket,data.appointmentId)
                })
                socket.on('chat:leave-room',(data:{appointmentId:string})=>{
                    this.handleLeaveChatRoom(socket,data.appointmentId)
                })
                //message handletr
                socket.on('chat:send-message',(data:{
                    appointmentId:string;
                    message:string;
                    messageType:'text'|'image'|'file';
                    fileUrl?:string;
                    fileName?:string;
                    messageId?:string;
                })=>{
                    this.handleSendMessage(socket,data)
                })
                //typing indicator
                
                // read receipts mark as read
                socket.on('chat:mark-message-read',(data:{
                    appointmentId:string;
                    messageIds?:string[];
                    timestamp?:string;
                })=>{
                    this.handleMarkMessageRead(socket,data)
                })
                //file upload
                socket.on('chat:file-upload-progress',(data:{
                    appointmentId:string;
                    progress:number;
                    fileName:string
                })=>{
                    this.handleFileUploadProgress(socket,data)
                })

                //disconnect 
                socket.on('disconnect',()=>{
                    this.handleDisconnect(socket)
                })
                
            }
            
        })
    }

    private handleJoinRoom(socket:AuthenticatedChatSocket,appointmentId:string){
        const roomId=`chat_${appointmentId}`;
        socket.join(roomId)
        console.log(`${socket.userName} joined chat room :${appointmentId}`);
        if(!this.chatRooms.has(appointmentId)){
            this.chatRooms.set(appointmentId,new Set())
        }
        this.chatRooms.get(appointmentId)!.add(socket.id)

        socket.to(roomId).emit('chat:user-joined',{
            userId:socket.userId,
            userName:socket.userName,
            userRole:socket.userRole,
            timeStamp:new Date().toISOString()
        })
        //send current room participants
        const roomParticipants=Array.from(this.chatRooms.get(appointmentId)!)
        .map(soketId=>{
            const userId=this.userSocket.get(soketId);
            return userId ? {userId,soketId}:null
        }).filter(Boolean)

        socket.emit('chat:room-joined',{
            appointmentId,
            participants:roomParticipants,
            participantCount:roomParticipants.length
        })
    }
}