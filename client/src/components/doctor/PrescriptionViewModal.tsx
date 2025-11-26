import React from 'react';
import { X, Edit, Trash2, FileText, Calendar, User, Pill } from 'lucide-react';


interface Medicine {
  name: string;
  dosage: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
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
  updatedAt: string;
  doctorId?: {
    name: string;
    specialization: string;
  };
  patientId?: {
    name: string;
    email: string;
  };
}
interface PrescriptionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionData | null;
  onEdit: () => void;
  onDelete: () => void;
  patientName: string;
}

const PrescriptionViewModal: React.FC<PrescriptionViewModalProps> =({
    isOpen,
    onClose,
    prescription,
    onEdit,
    onDelete,
    patientName
}) =>{
      if (!isOpen || !prescription) return null;

      const formatDate=(dateString:string)=>{
        return new Date(dateString).toLocaleDateString('en-US',{
             year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
        })
      }
const getDosageText=(dosage:Medicine['dosage'])=>{
    const times=[];
    if (dosage.morning) times.push('Morning');
    if (dosage.afternoon) times.push('Afternoon');
    if (dosage.night) times.push('Night');
    return times.length > 0 ? times.join(', ') : 'Not specified';
}
  const getFrequencyText = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      'once': 'Once daily',
      'twice': 'Twice daily',
      'thrice': 'Thrice daily',
      'as-needed': 'As needed'
    };
    return frequencyMap[frequency] || frequency;
  };


      return(
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-xl z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6" />
                Medical Prescription
              </h2>
              <div className="space-y-1 text-indigo-100">
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient: {patientName}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  Issued: {formatDate(prescription.createdAt)}
                </p>
                {prescription.updatedAt !== prescription.createdAt && (
                  <p className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    Last Updated: {formatDate(prescription.updatedAt)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-indigo-500 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Diagnosis Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Diagnosis
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {prescription.diagnosis}
            </p>
          </div>

          {/* Medicines Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-600" />
              Prescribed Medicines ({prescription.medicines.length})
            </h3>
            <div className="space-y-4">
              {prescription.medicines.map((medicine, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {index + 1}. {medicine.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {getFrequencyText(medicine.frequency)}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {medicine.duration} {medicine.duration === 1 ? 'day' : 'days'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dosage Time */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Dosage Time:</p>
                      <div className="flex flex-wrap gap-2">
                        {medicine.dosage.morning && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            ☀️ Morning
                          </span>
                        )}
                        {medicine.dosage.afternoon && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            🌤️ Afternoon
                          </span>
                        )}
                        {medicine.dosage.night && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            🌙 Night
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    {medicine.instructions && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Instructions:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {medicine.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tests Section */}
          {prescription.tests && (
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Recommended Tests
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {prescription.tests}
              </p>
            </div>
          )}

          {/* Notes Section */}
          {prescription.notes && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Additional Notes
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Doctor Info */}
          {prescription.doctorId && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">Prescribed by:</p>
              <p className="text-base font-semibold text-gray-900">
                Dr. {prescription.doctorId.name}
              </p>
              <p className="text-sm text-gray-600">
                {prescription.doctorId.specialization}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Close
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Prescription
            </button>
            <button
              onClick={onEdit}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
            >
              <Edit className="w-5 h-5" />
              Edit Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
      )
}

export default PrescriptionViewModal;