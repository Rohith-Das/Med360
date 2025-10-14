import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Stethoscope } from 'lucide-react';
import adminAxiosInstance from '@/api/adminAxiosInstance';
interface ChartDataPoint {
  date: string;
  appointments: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

interface AppointmentStats {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  chartData: ChartDataPoint[];
  revenue: number;
}

interface SpecializationStats {
  specializationId: string;
  specializationName: string;
  doctorCount: number;
  imageUrl: string;
}

type Period = 'today' | 'week' | 'month';

function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [specializationStats, setSpecializationStats] = useState<SpecializationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchSpecializationStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAxiosInstance.get(`/admin/appointments/stats?period=${period}`);
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializationStats = async () => {
    try {
      const response = await adminAxiosInstance.get('/admin/specializations/stats');
      
      if (response.data.success) {
        setSpecializationStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching specialization stats:', err);
    }
  };

  const handleSpecializationClick = (specializationId: string) => {
    window.location.href = `/admin/doctors?specialization=${specializationId}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === 'today') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const pieChartData = stats ? [
    { name: 'Confirmed', value: stats.confirmedAppointments, color: '#10b981' },
    { name: 'Pending', value: stats.pendingAppointments, color: '#f59e0b' },
    { name: 'Cancelled', value: stats.cancelledAppointments, color: '#ef4444' },
    { name: 'Completed', value: stats.completedAppointments, color: '#3b82f6' }
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <XCircle className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor appointments and revenue statistics</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.totalAppointments || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Total Appointments</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Confirmed</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.confirmedAppointments || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Confirmed</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.pendingAppointments || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Pending Review</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.revenue || 0)}</h3>
            <p className="text-gray-600 text-sm mt-1">Total Revenue</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelFormatter={formatDate}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="confirmed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Confirmed"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Pending"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Breakdown</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelFormatter={formatDate}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-semibold text-gray-900">Cancelled Appointments</h3>
            </div>
            <p className="text-4xl font-bold text-red-600">{stats?.cancelledAppointments || 0}</p>
            <p className="text-sm text-gray-600 mt-2">
              {stats?.totalAppointments ? 
                `${((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)}% of total` 
                : '0% of total'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Completed Appointments</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600">{stats?.completedAppointments || 0}</p>
            <p className="text-sm text-gray-600 mt-2">
              {stats?.totalAppointments ? 
                `${((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)}% of total` 
                : '0% of total'}
            </p>
          </div>
        </div>

        {/* Specialization Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Doctors by Specialization</h2>
            <span className="ml-auto text-sm text-gray-500">Click to view doctors</span>
          </div>

          {specializationStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No specializations found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {specializationStats.map((spec) => (
                  <div
                    key={spec.specializationId}
                    onClick={() => handleSpecializationClick(spec.specializationId)}
                    className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all">
                        <img
                          src={spec.imageUrl}
                          alt={spec.specializationName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/56?text=Spec';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {spec.specializationName}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-2xl font-bold text-blue-600">
                            {spec.doctorCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all group-hover:bg-blue-700"
                        style={{
                          width: specializationStats.length > 0
                            ? `${(spec.doctorCount / Math.max(...specializationStats.map(s => s.doctorCount))) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 group-hover:text-gray-700 transition-colors">
                      {spec.doctorCount === 0 ? 'No doctors' : spec.doctorCount === 1 ? '1 doctor' : `${spec.doctorCount} doctors`}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                      <span className="text-gray-600 group-hover:text-blue-600 transition-colors font-medium">
                        View Doctors
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Specializations</p>
                    <p className="text-2xl font-bold text-gray-900">{specializationStats.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Doctors</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {specializationStats.reduce((sum, spec) => sum + spec.doctorCount, 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Top Specialization</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {specializationStats[0]?.specializationName || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Avg per Spec</p>
                    <p className="text-2xl font-bold text-green-600">
                      {specializationStats.length > 0
                        ? (specializationStats.reduce((sum, spec) => sum + spec.doctorCount, 0) / specializationStats.length).toFixed(1)
                        : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;