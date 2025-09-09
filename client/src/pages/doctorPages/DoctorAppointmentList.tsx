// src/pages/doctor/ViewAppointments.tsx
import React, { useEffect, useState } from "react";
import doctorAxiosInstance from "../../api/doctorAxiosInstance";
import { toast, ToastContainer } from "react-toastify";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";
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

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (time: string) =>
    new Date(`2000-01-01 ${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
        {appointments.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-600">No appointments booked yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className="bg-white p-4 rounded-lg shadow flex justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {apt.patient?.name }
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(apt.date)} | {formatTime(apt.startTime)} -{" "}
                    {formatTime(apt.endTime)}
                  </p>
                  <p className="text-sm">Fee: ₹{apt.consultationFee}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    apt.status === "confirmed"
                      ? "bg-green-100 text-green-600"
                      : apt.status === "pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default DoctorAppointments;
