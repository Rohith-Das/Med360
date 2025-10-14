// client/src/pages/patientPages/viewAppointment.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/patient/Navbar";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../api/axiosInstance";
import { Video, VideoOff, Clock, Calendar, User } from "lucide-react";
import VideoCall from "@/components/videoCall/VideoCall";
import { useSocket } from "@/components/providers/SocketProvider";
import { useAppSelector } from "@/app/hooks";
import { socketService } from "@/features/notification/socket";

interface AppointmentData {
  _id: string;
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  consultationFee: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  doctor?: {
    name: string;
    specialization: { name: string };
    profileImage?: string;
  };
}

interface VideoCallState {
  active: boolean;
  roomId?: string;
  appointmentId?: string;
  isIncoming?: boolean;
  callerName?: string;
}

const ViewAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [videoCall, setVideoCall] = useState<VideoCallState>({ active: false });
  const { isConnected } = useSocket();
  const patient = useAppSelector((state) => state.auth.patient);
  const { incomingCallsData } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Enhanced socket event handling
  useEffect(() => {
    if (!isConnected) return;

    const handleIncomingCall = (event: Event) => {
      const data = (event as CustomEvent).detail;
      console.log("📞 Incoming video call:", data);
      
      toast.info(`Incoming call from Dr. ${data.initiatorName || "Doctor"}`, {
        position: "top-right",
        autoClose: 15000,
        onClick: () => {
          console.log('🎯 Toast clicked - accepting call');
          acceptIncomingCall(data.roomId, data.appointmentId, `Dr. ${data.initiatorName || "Doctor"}`);
        },
      });
    };

    const handleCallEnded = (event: Event) => {
      const data = (event as CustomEvent).detail;
      console.log("📞 Video call ended:", data);
      setVideoCall({ active: false });
      toast.info("Video call has ended", { position: "top-right" });
    };

    window.addEventListener("incoming_video_call", handleIncomingCall);
    window.addEventListener("video_call_ended", handleCallEnded);

    return () => {
      window.removeEventListener("incoming_video_call", handleIncomingCall);
      window.removeEventListener("video_call_ended", handleCallEnded);
    };
  }, [isConnected]);

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/patient/appointments");
      setAppointments(res.data.data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch appointments");
      setLoading(false);
    }
  };

  const refreshWalletData = async () => {
    try {
      const res = await axiosInstance.get("/patient/wallet");
      console.log("Wallet refreshed:", res.data);
    } catch (err) {
      console.error("Error refreshing wallet:", err);
    }
  };

  const isVideoCallAvailable = (appointment: AppointmentData): { available: boolean; message?: string } => {
    if (appointment.status !== "confirmed") {
      return { available: false, message: "Appointment must be confirmed" };
    }
    return { available: true };
  };

  const initiateVideoCall = async (appointmentId: string) => {
    try {
      console.log('🔵 Initiating video call for appointment:', appointmentId);
      
      const response = await axiosInstance.post("/videocall/initiate", {
        appointmentId,
      });

      if (response.data.success) {
        console.log('✅ Video call initiated:', response.data.data);
        toast.success("Video call initiated! Notification sent to doctor.");
        
        setVideoCall({
          active: true,
          roomId: response.data.data.roomId,
          appointmentId,
          isIncoming: false,
        });

        // Join the room immediately after initiating
        socketService.joinVideoRoom(response.data.data.roomId, {
          appointmentId,
          userId: patient?.id,
          userRole: 'patient',
          userName: patient?.name || 'Patient'
        });
      }
    } catch (error: any) {
      console.error("💥 Error initiating video call:", error);
      toast.error(error.response?.data?.message || "Failed to initiate video call");
    }
  };

  const acceptIncomingCall = async (roomId: string, appointmentId: string, callerName: string) => {
    try {
      console.log('🔄 Accepting incoming call:', { roomId, appointmentId, callerName });
      
      toast.info('Joining video call...', { autoClose: 2000 });
      
      const response = await axiosInstance.post(`/videocall/join/${roomId}`);
      console.log('📡 API Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Successfully joined call');
        
        setVideoCall({
          active: true,
          roomId,
          appointmentId,
          isIncoming: true,
          callerName,
        });

        socketService.joinVideoRoom(roomId, {
          appointmentId,
          userId: patient?.id,
          userRole: 'patient',
          userName: patient?.name || 'Patient'
        });
        
        toast.success('Joined video call successfully!');
      }
    } catch (error: any) {
      console.error('💥 Error accepting call:', error);
      toast.error(error.response?.data?.message || 'Failed to join call');
    }
  };

  const handleVideoCallEnd = () => {
    console.log('📞 Ending video call');
    setVideoCall({ active: false });
    fetchAppointments();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canCancelAppointment = (appointment: AppointmentData) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return appointment.status === "confirmed" && hoursUntilAppointment > 2;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setCancellingId(appointmentId);
    try {
      const response = await axiosInstance.put(`/patient/appointments/${appointmentId}/cancel`, {
        cancelReason,
      });
      if (response.data.success) {
        toast.success("Appointment cancelled successfully");
        setShowCancelDialog(null);
        setCancelReason("");
        await fetchAppointments();
        await refreshWalletData();
      }
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredAppointments = appointments.filter(
    (appointment) => filterStatus === "all" || appointment.status === filterStatus
  );

  // Check if there's an active incoming call for this appointment
  const hasIncomingCall = (appointmentId: string) => {
    return appointmentId in incomingCallsData;
  };

  const CancelDialog: React.FC<{ appointmentId: string }> = ({ appointmentId }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Cancel Appointment</h3>
        <p className="text-gray-600 mb-4">Please provide a reason for cancellation:</p>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="w-full p-2 border rounded-lg mb-4"
          rows={4}
          placeholder="Reason for cancellation"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowCancelDialog(null)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
          <button
            onClick={() => handleCancelAppointment(appointmentId)}
            disabled={cancellingId === appointmentId}
            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${
              cancellingId === appointmentId ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {cancellingId === appointmentId ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (videoCall.active && videoCall.appointmentId) {
    return (
      <VideoCall
        roomId={videoCall.roomId}
        appointmentId={videoCall.appointmentId}
        userRole="patient"
        userName={patient?.name || "Patient"}
        userId={patient?.id || "patient-id"}
        onCallEnd={handleVideoCallEnd}
        isIncoming={videoCall.isIncoming}
        callerName={videoCall.callerName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-8">
        <ToastContainer />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Appointments</h1>
            <div className="mt-4 flex space-x-4">
              {["all", "confirmed", "pending", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-gray-600">
                You don't have any {filterStatus === "all" ? "" : filterStatus} appointments.
              </p>
              <button
                onClick={() => navigate("/patient/book-appointment")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAppointments.map((appointment) => {
                const videoCallStatus = isVideoCallAvailable(appointment);
                const canCancel = canCancelAppointment(appointment);
                const hasIncoming = hasIncomingCall(appointment._id);
                
                return (
                  <div
                    key={appointment._id}
                    className={`bg-white rounded-lg shadow-sm border p-6 ${
                      hasIncoming ? 'border-l-4 border-l-green-500 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          {appointment.doctor?.profileImage ? (
                            <img
                              src={appointment.doctor.profileImage}
                              alt={appointment.doctor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-12 h-12 text-gray-400" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Dr. {appointment.doctor?.name || "Unknown"}
                            </h3>
                            <p className="text-gray-600">
                              {appointment.doctor?.specialization?.name || "Unknown Specialization"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-5 h-5 mr-2" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-5 h-5 mr-2" />
                            <span>
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              Status: {appointment.status}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${getPaymentStatusColor(
                                appointment.paymentStatus
                              )}`}
                            >
                              Payment: {appointment.paymentStatus}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            Consultation Fee: ₹{appointment.consultationFee}
                          </p>
                          {hasIncoming && (
                            <div className="flex items-center mt-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium animate-pulse">
                                📞 Incoming Call Available
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-3">
                        {videoCallStatus.available ? (
                          <>
                            {hasIncoming && incomingCallsData[appointment._id] ? (
                              <button
                                onClick={() => acceptIncomingCall(
                                  incomingCallsData[appointment._id].roomId,
                                  appointment._id,
                                  `Dr. ${incomingCallsData[appointment._id].initiatorName || 'Doctor'}`
                                )}
                                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 animate-pulse"
                              >
                                <Video className="w-5 h-5 mr-2" />
                                Accept Incoming Call
                              </button>
                            ) : (
                              <button
                                onClick={() => initiateVideoCall(appointment._id)}
                                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                              >
                                <Video className="w-5 h-5 mr-2" />
                                Start Video Call
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col space-y-2">
                            <button
                              disabled
                              className="w-full flex items-center justify-center px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                            >
                              <VideoOff className="w-5 h-5 mr-2" />
                              Video Call Unavailable
                            </button>
                            <p className="text-sm text-gray-600 text-center">
                              {videoCallStatus.message}
                            </p>
                          </div>
                        )}
                        {appointment.notes && (
                          <div className="text-sm text-gray-600">
                            <strong>Notes:</strong> {appointment.notes}
                          </div>
                        )}
                        {appointment.paymentStatus === "refunded" && (
                          <div className="text-sm text-blue-600">
                            Refund Processed: ₹{appointment.consultationFee}
                          </div>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => setShowCancelDialog(appointment._id)}
                            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    </div>
                    {showCancelDialog === appointment._id && (
                      <CancelDialog appointmentId={appointment._id} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAppointment;