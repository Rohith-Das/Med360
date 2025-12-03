// client/src/pages/patientPages/viewAppointment.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/patient/Navbar";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../api/axiosInstance";
import { Video, VideoOff, Clock, Calendar, User, FileText, Loader2 } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import PatientPrescriptionView from "@/components/patient/PatientViewPrescriptionModal";
import { useAppSelector,useAppDispatch } from "@/app/hooks";

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

interface PrescriptionData {
  _id: string;
  diagnosis: string;
  medicines: any[];
  tests?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  doctorId?: {
    name: string;
    specialization: { name: string };
  };
}

const ViewAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { isConnected } = useSocket();
  const patient = useAppSelector((state) => state.patientAuth.auth.patient);

  const dispatch = useAppDispatch();

  // Prescription state
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState<{ [key: string]: boolean }>({});
  const [prescriptionCache, setPrescriptionCache] = useState<{ [key: string]: PrescriptionData | null }>({});

  useEffect(() => {
    fetchAppointments();
  }, []);



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

  const fetchPrescription = async (appointmentId: string) => {
    // Check cache first
    if (prescriptionCache[appointmentId] !== undefined) {
      setSelectedPrescription(prescriptionCache[appointmentId]);
      setShowPrescriptionModal(true);
      return;
    }

    setLoadingPrescriptions(prev => ({ ...prev, [appointmentId]: true }));
    try {
      const res = await axiosInstance.get(`/patient/prescriptions/appointment/${appointmentId}`);
      
      if (res.data.success && res.data.data) {
        const prescription = res.data.data;
        setPrescriptionCache(prev => ({ ...prev, [appointmentId]: prescription }));
        setSelectedPrescription(prescription);
        setShowPrescriptionModal(true);
      } else {
        setPrescriptionCache(prev => ({ ...prev, [appointmentId]: null }));
        toast.info("No prescription available for this appointment yet");
      }
    } catch (err: any) {
      console.error("Error fetching prescription:", err);
      if (err.response?.status === 404) {
        setPrescriptionCache(prev => ({ ...prev, [appointmentId]: null }));
        toast.info("No prescription available for this appointment yet");
      } else {
        toast.error(err.response?.data?.message || "Failed to fetch prescription");
      }
    } finally {
      setLoadingPrescriptions(prev => ({ ...prev, [appointmentId]: false }));
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
                const canCancel = canCancelAppointment(appointment);
                const isLoadingPrescription = loadingPrescriptions[appointment._id];
                
                return (
                  <div
                 
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
                         
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-3">
                        {/* Prescription Button */}
                        <button
                          onClick={() => fetchPrescription(appointment._id)}
                          disabled={isLoadingPrescription}
                          className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50"
                        >
                          {isLoadingPrescription ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <FileText className="w-5 h-5 mr-2" />
                              View Prescription
                            </>
                          )}
                        </button>

                     

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

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPrescription && (
        <PatientPrescriptionView
          isOpen={showPrescriptionModal}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedPrescription(null);
          }}
          prescription={selectedPrescription}
          patientName={patient?.name || "Patient"}
          doctorName={selectedPrescription.doctorId?.name}
        />
      )}
    </div>
  );
};

export default ViewAppointment;