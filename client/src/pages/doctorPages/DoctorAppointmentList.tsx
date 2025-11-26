// client/src/pages/doctorPages/DoctorAppointmentList.tsx
import React, { useEffect, useState } from "react";
import doctorAxiosInstance from "../../api/doctorAxiosInstance";
import { toast, ToastContainer } from "react-toastify";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";
import { Video, VideoOff, Calendar, User, Clock, FileText, Eye, Edit } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useAppSelector } from "@/app/hooks";
import { socketService } from "@/features/notification/socket";
import { useNavigate } from "react-router-dom";
import PrescriptionModal from "@/components/doctor/PrescriptionModal";
import PrescriptionViewModal from "@/components/doctor/PrescriptionViewModal";

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

interface PrescriptionViewState {
  isOpen: boolean;
  prescription: any;
  appointmentId: string;
  patientName: string;
}

const DoctorAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { isConnected } = useSocket();
  const doctor = useAppSelector((state) => state.doctorAuth.doctorAuth.doctor);
  const { incomingCallsData } = useAppSelector((state) => state.notifications);

  // Prescription Modal State
  const [prescriptionModal, setPrescriptionModal] = useState<{
    isOpen: boolean;
    appointmentId: string;
    patientName: string;
    existingPrescription?: any;
  }>({
    isOpen: false,
    appointmentId: "",
    patientName: "",
  });

  // Track fetched prescriptions per appointment
  const [prescriptionStates, setPrescriptionStates] = useState<{ [key: string]: any }>({});
  const [loadingPrescriptions, setLoadingPrescriptions] = useState<{ [key: string]: boolean }>({});

  // View Modal
  const [prescriptionViewModal, setPrescriptionViewModal] = useState<PrescriptionViewState>({
    isOpen:

 false,
    prescription: null,
    appointmentId: "",
    patientName: "",
  });

  // Fetch all appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Auto-fetch prescriptions for confirmed/completed appointments
  useEffect(() => {
    appointments.forEach((apt) => {
      if ((apt.status === "confirmed" || apt.status === "completed") && !prescriptionStates[apt._id]) {
        fetchPrescriptionForAppointment(apt._id);
      }
    });
  }, [appointments]);

  // Socket: Incoming Video Call Handling
  useEffect(() => {
    if (!isConnected) return;

    const handleIncomingCall = (event: Event) => {
      const data = (event as CustomEvent).detail;
      toast.info(`Incoming video call from ${data.initiatorName || "Patient"}`, {
        position: "top-right",
        autoClose: 15000,
        onClick: () => {
          navigate(`/video-call/${data.roomId}`, {
            state: {
              appointmentId: data.appointmentId,
              userRole: "doctor",
              isIncoming: true,
              callerName: data.initiatorName || "Patient",
            },
          });
        },
      });
    };

    const handleCallEnded = () => {
      toast.info("Video call has ended");
    };

    window.addEventListener("incoming_video_call", handleIncomingCall);
    window.addEventListener("video_call_ended", handleCallEnded);

    return () => {
      window.removeEventListener("incoming_video_call", handleIncomingCall);
      window.removeEventListener("video_call_ended", handleCallEnded);
    };
  }, [isConnected, navigate]);

  const fetchAppointments = async () => {
    try {
      const res = await doctorAxiosInstance.get("/doctor/appointments");
      setAppointments(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptionForAppointment = async (appointmentId: string) => {
    if (prescriptionStates[appointmentId]) return;

    setLoadingPrescriptions((prev) => ({ ...prev, [appointmentId]: true }));
    try {
      const response = await doctorAxiosInstance.get(`/doctor/prescriptions/appointment/${appointmentId}`);
      if (response.data.success) {
        setPrescriptionStates((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }));
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error fetching prescription:", error);
      }
    } finally {
      setLoadingPrescriptions((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  const isVideoCallAvailable = (appointment: AppointmentData) => {
    return appointment.status === "confirmed";
  };

  const initiateVideoCall = async (appointmentId: string) => {
    try {
      const response = await doctorAxiosInstance.post("/videocall/doctor/initiate", { appointmentId });
      if (response.data.success) {
        const { roomId } = response.data.data;
        toast.success("Video call initiated!");

        socketService.joinVideoRoom(roomId, {
          appointmentId,
          userId: doctor?.id,
          userRole: "doctor",
          userName: doctor?.name || "Doctor",
        });

        navigate(`/video-call/${roomId}`, {
          state: { appointmentId, userRole: "doctor", isIncoming: false },
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start video call");
    }
  };

  const acceptIncomingCall = async (roomId: string, appointmentId: string, callerName: string) => {
    try {
      await doctorAxiosInstance.post(`/videocall/doctor/join/${roomId}`);
      socketService.joinVideoRoom(roomId, {
        appointmentId,
        userId: doctor?.id,
        userRole: "doctor",
        userName: doctor?.name || "Doctor",
      });

      navigate(`/video-call/${roomId}`, {
        state: { appointmentId, userRole: "doctor", isIncoming: true, callerName },
      });
      toast.success("Joined video call");
    } catch (error: any) {
      toast.error("Failed to join call");
    }
  };

  const hasIncomingCall = (appointmentId: string) => {
    return incomingCallsData[appointmentId];
  };

  const handleWritePrescription = async (appointmentId: string, patientName: string) => {
    await fetchPrescriptionForAppointment(appointmentId);
    setTimeout(() => {
      setPrescriptionModal({
        isOpen: true,
        appointmentId,
        patientName,
        existingPrescription: prescriptionStates[appointmentId],
      });
    }, 100);
  };

  const handleViewPrescription = (appointmentId: string, patientName: string) => {
    const prescription = prescriptionStates[appointmentId];
    if (prescription) {
      setPrescriptionViewModal({
        isOpen: true,
        prescription,
        appointmentId,
        patientName,
      });
    }
  };

  const handleEditPrescription = () => {
    const { appointmentId, patientName, prescription } = prescriptionViewModal;
    setPrescriptionViewModal({ isOpen: false, prescription: null, appointmentId: "", patientName: "" });
    setPrescriptionModal({
      isOpen: true,
      appointmentId,
      patientName,
      existingPrescription: prescription,
    });
  };

  const handleDeletePrescription = async () => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;

    try {
      await doctorAxiosInstance.delete(`/doctor/prescriptions/${prescriptionViewModal.prescription._id}`);
      toast.success("Prescription deleted");

      setPrescriptionViewModal({ isOpen: false, prescription: null, appointmentId: "", patientName: "" });
      setPrescriptionStates((prev) => {
        const updated = { ...prev };
        delete updated[prescriptionViewModal.appointmentId];
        return updated;
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };
const handleSavePrescription = async (data: any) => {
  try {
    let response;

    if (prescriptionModal.existingPrescription) {
      // EDIT MODE: Use PUT with prescription ID
      const prescriptionId = prescriptionModal.existingPrescription._id;
      response = await doctorAxiosInstance.put(`/doctor/prescriptions/${prescriptionId}`, data);
    } else {
      // CREATE MODE: Use POST
      response = await doctorAxiosInstance.post("/doctor/prescriptions", {
        appointmentId: prescriptionModal.appointmentId,
        ...data,
      });
    }

    if (response.data.success) {
      toast.success(
        prescriptionModal.existingPrescription
          ? "Prescription updated successfully"
          : "Prescription saved successfully"
      );

      // Close modal
      setPrescriptionModal({ isOpen: false, appointmentId: "", patientName: "" });

      // Update local state
      setPrescriptionStates((prev) => ({
        ...prev,
        [prescriptionModal.appointmentId]: response.data.data,
      }));
    }
  } catch (error: any) {
    console.error("Save prescription error:", error);
    toast.error(
      error.response?.data?.message || 
      (prescriptionModal.existingPrescription 
        ? "Failed to update prescription" 
        : "Failed to save prescription")
    );
  }
};

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const formatTime = (time: string) => time.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) => filterStatus === "all" || apt.status === filterStatus
  );

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
      <div className="pt-20 pb-12">
        <ToastContainer />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Appointments</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              {["all", "confirmed", "pending", "cancelled", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2 rounded-lg font-medium capitalize transition-all ${
                    filterStatus === status
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-xl font-medium text-gray-900">No appointments found</h3>
              <p className="mt-2 text-gray-600">You have no {filterStatus === "all" ? "" : filterStatus} appointments at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAppointments.map((appointment) => {
                const hasPrescription = !!prescriptionStates[appointment._id];
                const isLoadingPrescription = loadingPrescriptions[appointment._id];
                const hasIncoming = hasIncomingCall(appointment._id);

                return (
                  <div
                    key={appointment._id}
                    className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                      hasIncoming ? "border-l-8 border-l-green-500 bg-green-50" : "border-gray-200"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Patient Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <User className="w-12 h-12 text-gray-400" />
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {appointment.patient?.name || "Unknown Patient"}
                              </h3>
                              <p className="text-gray-600">{appointment.patient?.email}</p>
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-5 h-5 mr-3" />
                              {formatDate(appointment.date)}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-5 h-5 mr-3" />
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="font-medium">
                              Fee: ₹{appointment.consultationFee}
                            </div>
                          </div>

                          {hasIncoming && (
                            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium animate-pulse">
                              Incoming Call from Patient
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 min-w-[280px]">
                          {/* Video Call */}
                          {isVideoCallAvailable(appointment) ? (
                            hasIncoming ? (
                              <button
                                onClick={() =>
                                  acceptIncomingCall(
                                    incomingCallsData[appointment._id].roomId,
                                    appointment._id,
                                    incomingCallsData[appointment._id].initiatorName || "Patient"
                                  )
                                }
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md animate-pulse"
                              >
                                <Video className="w-5 h-5" />
                                Accept Call
                              </button>
                            ) : (
                              <button
                                onClick={() => initiateVideoCall(appointment._id)}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
                              >
                                <Video className="w-5 h-5" />
                                Start Video Call
                              </button>
                            )
                          ) : (
                            <div className="text-center text-gray-500">
                              <VideoOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Video call unavailable</p>
                            </div>
                          )}

                          {/* Prescription Actions */}
                          <div className="flex flex-col gap-2 mt-2">
                            {isLoadingPrescription ? (
                              <button className="w-full py-3 bg-gray-200 rounded-lg animate-pulse text-gray-600 text-sm">
                                Loading prescription...
                              </button>
                            ) : hasPrescription ? (
                              <>
                                <button
                                  onClick={() => handleViewPrescription(appointment._id, appointment.patient?.name || "Patient")}
                                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                >
                                  <Eye className="w-5 h-5" />
                                  View Prescription
                                </button>
                                <button
                                  onClick={() => handleWritePrescription(appointment._id, appointment.patient?.name || "Patient")}
                                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                  <Edit className="w-5 h-5" />
                                  Edit Prescription
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleWritePrescription(appointment._id, appointment.patient?.name || "Patient")}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md"
                              >
                                <FileText className="w-5 h-5" />
                                Write Prescription
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modals */}
        <PrescriptionModal
          isOpen={prescriptionModal.isOpen}
          onClose={() => setPrescriptionModal({ isOpen: false, appointmentId: "", patientName: "" })}
          appointmentId={prescriptionModal.appointmentId}
          patientName={prescriptionModal.patientName}
          existingPrescription={prescriptionModal.existingPrescription}
          onSave={handleSavePrescription}
        />

        <PrescriptionViewModal
          isOpen={prescriptionViewModal.isOpen}
          onClose={() => setPrescriptionViewModal({ isOpen: false, prescription: null, appointmentId: "", patientName: "" })}
          prescription={prescriptionViewModal.prescription}
          patientName={prescriptionViewModal.patientName}
          onEdit={handleEditPrescription}
          onDelete={handleDeletePrescription}
        />
      </div>
    </div>
  );
};

export default DoctorAppointments;