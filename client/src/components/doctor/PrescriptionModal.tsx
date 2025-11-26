import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Search, Loader2, Save, FileText } from 'lucide-react';

interface Medicine {
  id: string;
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

interface PrescriptionFormData {
  diagnosis: string;
  notes: string;
  tests: string;
  medicines: Medicine[];
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  existingPrescription?: any;
  onSave: (data: PrescriptionFormData) => Promise<void>;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  existingPrescription,
  onSave
}) => {
  const [formData, setFormData] = useState<PrescriptionFormData>({
    diagnosis: '',
    notes: '',
    tests: '',
    medicines: []
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingPrescription) {
      setFormData({
        diagnosis: existingPrescription.diagnosis || '',
        notes: existingPrescription.notes || '',
        tests: existingPrescription.tests || '',
        medicines: existingPrescription.medicines || []
      });
    }
  }, [existingPrescription]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMedicine = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      // Check cache first
      const cacheKey = `medicine:${query.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setSuggestions(data);
          setShowSuggestions(true);
          setIsSearching(false);
          return;
        }
      }

      // Fetch from API
      const response = await fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const suggestions = data.suggestionGroup?.suggestionList?.suggestion || [];
      
      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify({
        data: suggestions.slice(0, 10),
        timestamp: Date.now()
      }));

      setSuggestions(suggestions.slice(0, 10));
      setShowSuggestions(true);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Medicine search error:', error);
        setSuggestions([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string, medicineId: string) => {
    setSearchQuery(value);
    setActiveSearch(medicineId);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchMedicine(value);
    }, 300);
  };

  const addMedicine = () => {
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: '',
      dosage: { morning: false, afternoon: false, night: false },
      duration: 1,
      frequency: 'once',
      instructions: ''
    };
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine]
    }));
  };

  const removeMedicine = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== id)
    }));
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: any) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  };

  const selectSuggestion = (medicineId: string, suggestion: string) => {
    updateMedicine(medicineId, 'name', suggestion);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSearch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.diagnosis.trim()) {
      alert('Please enter diagnosis');
      return;
    }

    if (formData.medicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    const invalidMedicine = formData.medicines.find(m => !m.name.trim());
    if (invalidMedicine) {
      alert('Please fill all medicine names');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Medical Prescription
            </h2>
            <p className="text-blue-100 mt-1">Patient: {patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-500 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Diagnosis */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter diagnosis..."
              required
            />
          </div>

          {/* Medicines Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">
                Medicines <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            {formData.medicines.map((medicine, index) => (
              <div key={medicine.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-gray-600">Medicine #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMedicine(medicine.id)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Medicine Name Search */}
                <div className="relative" ref={activeSearch === medicine.id ? suggestionsRef : null}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={medicine.name || (activeSearch === medicine.id ? searchQuery : '')}
                      onChange={(e) => {
                        updateMedicine(medicine.id, 'name', e.target.value);
                        handleSearchChange(e.target.value, medicine.id);
                      }}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search medicine..."
                      required
                    />
                    {isSearching && activeSearch === medicine.id && (
                      <Loader2 className="absolute right-3 top-3 w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  </div>

                  {showSuggestions && activeSearch === medicine.id && suggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSuggestion(medicine.id, suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dosage Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medicine.dosage.morning}
                      onChange={(e) => updateMedicine(medicine.id, 'dosage', {
                        ...medicine.dosage,
                        morning: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Morning</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medicine.dosage.afternoon}
                      onChange={(e) => updateMedicine(medicine.id, 'dosage', {
                        ...medicine.dosage,
                        afternoon: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Afternoon</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medicine.dosage.night}
                      onChange={(e) => updateMedicine(medicine.id, 'dosage', {
                        ...medicine.dosage,
                        night: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Night</span>
                  </label>
                </div>

                {/* Duration and Frequency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(medicine.id, 'duration', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="once">Once daily</option>
                      <option value="twice">Twice daily</option>
                      <option value="thrice">Thrice daily</option>
                      <option value="as-needed">As needed</option>
                    </select>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <input
                    type="text"
                    value={medicine.instructions || ''}
                    onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Take after meals"
                  />
                </div>
              </div>
            ))}

            {formData.medicines.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No medicines added. Click "Add Medicine" to start.
              </div>
            )}
          </div>

          {/* Tests */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Recommended Tests</label>
            <textarea
              value={formData.tests}
              onChange={(e) => setFormData(prev => ({ ...prev, tests: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Enter recommended tests (optional)..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Additional instructions or notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
           <button
  type="submit"
  disabled={isSaving}
  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
>
  {isSaving ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="w-5 h-5" />
      {existingPrescription ? "Update Prescription" : "Save Prescription"}
    </>
  )}
</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionModal;