import React, { useEffect, useState } from 'react';
import { adminApi, Patient } from '../../features/admin/adminPatientApi';

interface Filters {
  page: number;
  limit: number;
  isBlocked?: boolean;
  isDeleted?: boolean;
  searchTerm: string;
}

function ListPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 10,
    searchTerm: '',
  });
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPatients(filters);
      setPatients(data.patients);
      setTotalPages(data.totalPage);
      setTotal(data.total);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [filters]);

  const handleBlockPatient = async (patientId: string) => {
    try {
      await adminApi.blockPatient(patientId);
      fetchPatients();
      alert('Patient blocked successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to block patient');
    }
  };

  const handleUnblockPatient = async (patientId: string) => {
    try {
      await adminApi.unblockPatient(patientId);
      fetchPatients();
      alert('Patient unblocked successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unblock patient');
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await adminApi.deletePatient(patientId);
        fetchPatients();
        alert('Patient deleted successfully');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete patient');
      }
    }
  };

  return (
    <div>
      <h2>Patient List</h2>
      {loading ? (
        <div>Loading patients...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <>
          <p>Total Patients: {total}</p>
          <table border={1} cellPadding={10}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.mobile}</td>
                  <td>{p.isBlocked ? 'Blocked' : 'Active'}</td>
                  <td>
                    {p.isBlocked ? (
                      <button onClick={() => handleUnblockPatient(p.id)}>Unblock</button>
                    ) : (
                      <button onClick={() => handleBlockPatient(p.id)}>Block</button>
                    )}
                    <button onClick={() => handleDeletePatient(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Example */}
          <div style={{ marginTop: '10px' }}>
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              Prev
            </button>
            <span> Page {filters.page} of {totalPages} </span>
            <button
              disabled={filters.page === totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ListPatients;
