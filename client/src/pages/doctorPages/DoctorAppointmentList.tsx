

import React, { useEffect, useState } from "react";
import doctorAxiosInstance from "../../api/doctorAxiosInstance";
import { toast, ToastContainer } from "react-toastify";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";
import { Video, VideoOff, Calendar, User, Clock } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import VideoCall from "@/components/videoCall/VideoCall";
import { useAppSelector } from "@/app/hooks";

interface AppointmentData {
  _id: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  consultationFee: number;
  patient?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface VideoCallState {
  active: boolean;
  roomId?: string;
  appointmentId?: string;
  isIncoming?: boolean;
  callerName?: string;
}

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [videoCall, setVideoCall] = useState<VideoCallState>({ active: false });
  const { isConnected } = useSocket();
  const doctor = useAppSelector((state) => state.doctorAuth.doctor);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Listen for incoming video calls
  useEffect(() => {
    if (!isConnected) return;

    const handleIncomingCall = (data: any) => {
      console.log("Incoming video call:", data);
      toast.info(`Incoming video call from ${data.initiatorName || "Patient"}`, {
        position: "top-right",
        autoClose: false,
        onClick: () => {
          setVideoCall({
            active: true,
            roomId: data.roomId,
            appointmentId: data.appointmentId,
            isIncoming: true,
            callerName: data.initiatorName || "Patient",
          });
          // Removed navigate('/doctor/video-call')
        },
      });
    };

    const handleCallEnded = (data: any) => {
      console.log("Video call ended:", data);
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
      const res = await doctorAxiosInstance.get("/doctor/appointments");
      setAppointments(res.data.data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch appointments");
      setLoading(false);
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
      const response = await doctorAxiosInstance.post("/videocall/doctor/initiate", {
        appointmentId,
      });

      if (response.data.success) {
        toast.success("Video call initiated! Notification sent to patient.");
        setVideoCall({
          active: true,
          roomId: response.data.data.roomId,
          appointmentId,
          isIncoming: false,
        });
        // Removed navigate('/doctor/video-call')
      }
    } catch (error: any) {
      console.error("Error initiating video call:", error);
      toast.error(error.response?.data?.message || "Failed to initiate video call");
    }
  };

  const handleVideoCallEnd = () => {
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
    return time; // Assuming time is in HH:MM format; adjust if needed
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

  const filteredAppointments = appointments.filter(
    (appointment) => filterStatus === "all" || appointment.status === filterStatus
  );

  if (videoCall.active && videoCall.appointmentId) {
    return (
      <VideoCall
        roomId={videoCall.roomId}
        appointmentId={videoCall.appointmentId}
        userRole="doctor"
        userName={doctor?.name || "Doctor"}
        userId={doctor?.id || "doctor-id"}
        onCallEnd={handleVideoCallEnd}
        isIncoming={videoCall.isIncoming}
        callerName={videoCall.callerName}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <div className="pt-20 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />
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
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAppointments.map((appointment) => {
                const videoCallStatus = isVideoCallAvailable(appointment);
                return (
                  <div
                    key={appointment._id}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <User className="w-12 h-12 text-gray-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.patient?.name || "Unknown Patient"}
                            </h3>
                            <p className="text-gray-600">
                              {appointment.patient?.email || "No email provided"}
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
                              {formatTime(appointment.startTime)} -{" "}
                              {formatTime(appointment.endTime)}
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
                          <p className="text-gray-600">
                            Consultation Fee: ₹{appointment.consultationFee}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-3">
                        {videoCallStatus.available ? (
                          <button
                            onClick={() => initiateVideoCall(appointment._id)}
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                          >
                            <Video className="w-5 h-5 mr-2" />
                            Join Video Call
                          </button>
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
                      </div>
                    </div>
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

export default DoctorAppointments;