import React from "react";
import { X, Download } from "lucide-react";

interface Medicine {
  name: string;
  dosage: { morning: boolean; afternoon: boolean; night: boolean };
  duration: number;
  frequency: string;
  instructions?: string;
}

interface PrescriptionData {
  _id: string;
  diagnosis: string;
  medicines: Medicine[];
  tests?: string;
  notes?: string;
  createdAt: string;
}

interface PatientPrescriptionViewProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionData | null;
  patientName: string;
  doctorName?: string;
}

const PatientPrescriptionView: React.FC<PatientPrescriptionViewProps> = ({
  isOpen, onClose, prescription, patientName, doctorName
}) => {

  if (!isOpen || !prescription) return null;

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl p-6 print:p-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-xl font-bold">Prescription</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X />
          </button>
        </div>

        <div className="space-y-2 mb-6">
          <p><strong>Patient:</strong> {patientName}</p>
          <p><strong>Doctor:</strong> Dr. {doctorName || "N/A"}</p>
          <p><strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Diagnosis */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Diagnosis</h3>
          <p className="bg-gray-50 p-3 rounded">{prescription.diagnosis}</p>
        </div>

        {/* Medicines */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Medicines</h3>
          {prescription.medicines.map((m, i) => (
            <div key={i} className="border rounded p-3 mb-2">
              <p className="font-medium">{i + 1}. {m.name}</p>
              <p className="text-sm text-gray-600">Duration: {m.duration} days</p>
              <p className="text-sm">Frequency: {m.frequency}</p>
              {m.instructions && (
                <p className="text-sm text-gray-700 mt-1">Note: {m.instructions}</p>
              )}
            </div>
          ))}
        </div>

        {prescription.tests && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Tests</h3>
            <p className="bg-gray-50 p-3 rounded">{prescription.tests}</p>
          </div>
        )}

        {prescription.notes && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Additional Notes</h3>
            <p className="bg-gray-50 p-3 rounded">{prescription.notes}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 p-3 border rounded hover:bg-gray-100" onClick={onClose}>
            Close
          </button>
          <button
            onClick={downloadPDF}
            className="flex-1 p-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptionView;
