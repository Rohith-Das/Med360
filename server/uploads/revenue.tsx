// // ============================================
// // 1. Add to DashboardRepository.ts interface
// // ============================================

// export interface RevenueStatsResponse {
//   totalRevenue: number;
//   totalAppointments: number;
//   averageRevenue: number;
//   chartData: Array<{
//     date: string;
//     revenue: number;
//     appointments: number;
//   }>;
//   previousPeriodRevenue: number;
//   growthPercentage: number;
// }

// export interface IDashboardRepository {
//   getAppointmentStats(startDate: Date, endDate: Date): Promise<AppointmentStatsResponse>;
//   getSpecializationStats(): Promise<SpecializationStatsResponse[]>;
//   getRevenueStats(startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date): Promise<RevenueStatsResponse>; // Add this
// }

// // ============================================
// // 2. Add to MongoDashboardRepo.ts
// // ============================================

// async getRevenueStats(
//   startDate: Date, 
//   endDate: Date, 
//   previousStartDate: Date, 
//   previousEndDate: Date
// ): Promise<RevenueStatsResponse> {
//   try {
//     // Get current period appointments
//     const currentAppointments = await AppointmentModel.find({
//       date: { $gte: startDate, $lte: endDate },
//       paymentStatus: { $in: ['paid', 'pending'] }
//     }).sort({ date: 1 });

//     // Get previous period appointments for comparison
//     const previousAppointments = await AppointmentModel.find({
//       date: { $gte: previousStartDate, $lte: previousEndDate },
//       paymentStatus: { $in: ['paid', 'pending'] }
//     });

//     // Calculate current period stats
//     const totalRevenue = currentAppointments.reduce(
//       (sum, apt) => sum + (apt.consultationFee || 0), 
//       0
//     );
//     const totalAppointments = currentAppointments.length;
//     const averageRevenue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

//     // Calculate previous period revenue
//     const previousPeriodRevenue = previousAppointments.reduce(
//       (sum, apt) => sum + (apt.consultationFee || 0), 
//       0
//     );

//     // Calculate growth percentage
//     const growthPercentage = previousPeriodRevenue > 0 
//       ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
//       : 0;

//     // Create date map for chart data
//     const dateMap = new Map<string, { revenue: number; appointments: number }>();
    
//     const currentDate = new Date(startDate);
//     while (currentDate <= endDate) {
//       const dateStr = currentDate.toISOString().split('T')[0];
//       dateMap.set(dateStr, { revenue: 0, appointments: 0 });
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     // Populate the date map with actual data
//     currentAppointments.forEach(appointment => {
//       const dateStr = new Date(appointment.date).toISOString().split('T')[0];
//       const data = dateMap.get(dateStr);
//       if (data) {
//         data.revenue += appointment.consultationFee || 0;
//         data.appointments += 1;
//       }
//     });

//     // Convert to array format for charts
//     const chartData = Array.from(dateMap.entries()).map(([date, data]) => ({
//       date,
//       revenue: data.revenue,
//       appointments: data.appointments
//     }));

//     return {
//       totalRevenue,
//       totalAppointments,
//       averageRevenue,
//       chartData,
//       previousPeriodRevenue,
//       growthPercentage
//     };
//   } catch (error) {
//     console.error('Error fetching revenue stats:', error);
//     throw new Error('Failed to fetch revenue statistics');
//   }
// }

// // ============================================
// // 3. Add to DashboardUC.ts
// // ============================================

// export interface RevenueStatsFilters {
//   period: 'today' | 'week' | 'month' | 'year' | 'custom';
//   startDate?: Date;
//   endDate?: Date;
// }

// async getRevenueStats(filters: RevenueStatsFilters): Promise<RevenueStatsResponse> {
//   let dateRange: { startDate: Date; endDate: Date };
//   let previousDateRange: { startDate: Date; endDate: Date };

//   if (filters.period === 'custom' && filters.startDate && filters.endDate) {
//     dateRange = {
//       startDate: filters.startDate,
//       endDate: filters.endDate
//     };
    
//     // Calculate previous period of same length
//     const daysDiff = Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24));
//     const previousEndDate = new Date(filters.startDate);
//     previousEndDate.setDate(previousEndDate.getDate() - 1);
//     const previousStartDate = new Date(previousEndDate);
//     previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
    
//     previousDateRange = { startDate: previousStartDate, endDate: previousEndDate };
//   } else {
//     dateRange = this.getDateRange(filters.period);
//     previousDateRange = this.getPreviousDateRange(filters.period, dateRange);
//   }

//   return await this.DashRepo.getRevenueStats(
//     dateRange.startDate,
//     dateRange.endDate,
//     previousDateRange.startDate,
//     previousDateRange.endDate
//   );
// }

// private getPreviousDateRange(
//   period: 'today' | 'week' | 'month' | 'year',
//   currentRange: { startDate: Date; endDate: Date }
// ): { startDate: Date; endDate: Date } {
//   const { startDate, endDate } = currentRange;
//   const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
//   const previousEndDate = new Date(startDate);
//   previousEndDate.setDate(previousEndDate.getDate() - 1);
//   previousEndDate.setHours(23, 59, 59, 999);
  
//   const previousStartDate = new Date(previousEndDate);
//   previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
//   previousStartDate.setHours(0, 0, 0, 0);

//   return { startDate: previousStartDate, endDate: previousEndDate };
// }

// // Update the existing getDateRange method to handle year
// private getDateRange(period: 'today' | 'week' | 'month' | 'year'): { startDate: Date; endDate: Date } {
//   const endDate = new Date();
//   endDate.setHours(23, 59, 59, 999);
//   const startDate = new Date();

//   switch (period) {
//     case "today":
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "week":
//       startDate.setDate(startDate.getDate() - 6);
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "month":
//       startDate.setDate(startDate.getDate() - 29);
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "year":
//       startDate.setMonth(startDate.getMonth() - 12);
//       startDate.setHours(0, 0, 0, 0);
//       break;
//   }
//   return { startDate, endDate };
// }

// // ============================================
// // 4. Add to DashBoardController.ts
// // ============================================

// async getRevenueStats(req: Request, res: Response): Promise<Response> {
//   try {
//     const { period = 'month', startDate, endDate } = req.query;

//     if (!['today', 'week', 'month', 'year', 'custom'].includes(period as string)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid period. Must be 'today', 'week', 'month', 'year', or 'custom'"
//       });
//     }

//     const filters: any = {
//       period: period as 'today' | 'week' | 'month' | 'year' | 'custom'
//     };

//     if (period === 'custom') {
//       if (!startDate || !endDate) {
//         return res.status(400).json({
//           success: false,
//           message: "Start date and end date are required for custom period"
//         });
//       }
//       filters.startDate = new Date(startDate as string);
//       filters.endDate = new Date(endDate as string);
//     }

//     const usecase = container.resolve(DashBoardUC);
//     const result = await usecase.getRevenueStats(filters);

//     return res.status(200).json({
//       success: true,
//       message: 'Revenue stats retrieved successfully',
//       data: result
//     });
//   } catch (error: any) {
//     console.error('Revenue stats error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to retrieve revenue stats"
//     });
//   }
// }

// // ============================================
// // 5. Add route to AdminRouter
// // ============================================

// AdminRouter.get('/revenue/stats', adminAuthGuard, dashboardController.getRevenueStats);




// /////////////////////////////////////////
// import React, { useState, useEffect } from 'react';
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
// import { DollarSign, Calendar, TrendingUp, TrendingDown, Download } from 'lucide-react';
// import adminAxiosInstance from '../api/adminAxiosInstance';

// interface RevenueData {
//   date: string;
//   revenue: number;
//   appointments: number;
// }

// interface RevenueStats {
//   totalRevenue: number;
//   totalAppointments: number;
//   averageRevenue: number;
//   chartData: RevenueData[];
//   previousPeriodRevenue: number;
//   growthPercentage: number;
// }

// type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

// function RevenueDashboard() {
//   const [period, setPeriod] = useState<Period>('month');
//   const [customStartDate, setCustomStartDate] = useState('');
//   const [customEndDate, setCustomEndDate] = useState('');
//   const [stats, setStats] = useState<RevenueStats | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (period !== 'custom') {
//       fetchRevenueStats();
//     }
//   }, [period]);

//   const fetchRevenueStats = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       let url = `/admin/revenue/stats?period=${period}`;
      
//       if (period === 'custom' && customStartDate && customEndDate) {
//         url = `/admin/revenue/stats?period=custom&startDate=${customStartDate}&endDate=${customEndDate}`;
//       }

//       const response = await adminAxiosInstance.get(url);
      
//       if (response.data.success) {
//         setStats(response.data.data);
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch revenue statistics');
//       console.error('Error fetching revenue stats:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCustomDateSubmit = () => {
//     if (customStartDate && customEndDate) {
//       if (new Date(customStartDate) > new Date(customEndDate)) {
//         setError('Start date must be before end date');
//         return;
//       }
//       fetchRevenueStats();
//     } else {
//       setError('Please select both start and end dates');
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
    
//     if (period === 'today') {
//       return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
//     } else if (period === 'week') {
//       return date.toLocaleDateString('en-US', { weekday: 'short' });
//     } else if (period === 'month') {
//       return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
//     } else if (period === 'year') {
//       return date.toLocaleDateString('en-US', { month: 'short' });
//     } else {
//       return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
//     }
//   };

//   const exportToCSV = () => {
//     if (!stats?.chartData) return;

//     const headers = ['Date', 'Revenue', 'Appointments'];
//     const rows = stats.chartData.map(item => [
//       item.date,
//       item.revenue,
//       item.appointments
//     ]);

//     const csvContent = [
//       headers.join(','),
//       ...rows.map(row => row.join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `revenue-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading revenue data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Dashboard</h1>
//             <p className="text-gray-600">Track and analyze your revenue performance</p>
//           </div>
//           {stats && (
//             <button
//               onClick={exportToCSV}
//               className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//             >
//               <Download className="w-4 h-4" />
//               Export CSV
//             </button>
//           )}
//         </div>

//         {/* Filter Section */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
//           <div className="flex flex-wrap gap-3 mb-4">
//             {(['today', 'week', 'month', 'year', 'custom'] as Period[]).map((p) => (
//               <button
//                 key={p}
//                 onClick={() => setPeriod(p)}
//                 className={`px-6 py-2 rounded-lg font-medium transition-all ${
//                   period === p
//                     ? 'bg-blue-600 text-white shadow-md'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 {p.charAt(0).toUpperCase() + p.slice(1)}
//               </button>
//             ))}
//           </div>

//           {/* Custom Date Range */}
//           {period === 'custom' && (
//             <div className="flex flex-wrap gap-4 items-end pt-4 border-t border-gray-200">
//               <div className="flex-1 min-w-[200px]">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Start Date
//                 </label>
//                 <input
//                   type="date"
//                   value={customStartDate}
//                   onChange={(e) => setCustomStartDate(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="flex-1 min-w-[200px]">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   End Date
//                 </label>
//                 <input
//                   type="date"
//                   value={customEndDate}
//                   onChange={(e) => setCustomEndDate(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <button
//                 onClick={handleCustomDateSubmit}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//               >
//                 Apply
//               </button>
//             </div>
//           )}
//         </div>

//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
//             {error}
//           </div>
//         )}

//         {stats && (
//           <>
//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 bg-green-100 rounded-lg">
//                     <DollarSign className="w-6 h-6 text-green-600" />
//                   </div>
//                   {stats.growthPercentage !== 0 && (
//                     <div className={`flex items-center gap-1 text-sm font-medium ${
//                       stats.growthPercentage > 0 ? 'text-green-600' : 'text-red-600'
//                     }`}>
//                       {stats.growthPercentage > 0 ? (
//                         <TrendingUp className="w-4 h-4" />
//                       ) : (
//                         <TrendingDown className="w-4 h-4" />
//                       )}
//                       {Math.abs(stats.growthPercentage).toFixed(1)}%
//                     </div>
//                   )}
//                 </div>
//                 <h3 className="text-3xl font-bold text-gray-900">
//                   {formatCurrency(stats.totalRevenue)}
//                 </h3>
//                 <p className="text-gray-600 text-sm mt-1">Total Revenue</p>
//                 {stats.previousPeriodRevenue > 0 && (
//                   <p className="text-xs text-gray-500 mt-2">
//                     Previous: {formatCurrency(stats.previousPeriodRevenue)}
//                   </p>
//                 )}
//               </div>

//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 bg-blue-100 rounded-lg">
//                     <Calendar className="w-6 h-6 text-blue-600" />
//                   </div>
//                 </div>
//                 <h3 className="text-3xl font-bold text-gray-900">
//                   {stats.totalAppointments}
//                 </h3>
//                 <p className="text-gray-600 text-sm mt-1">Total Appointments</p>
//               </div>

//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 bg-purple-100 rounded-lg">
//                     <TrendingUp className="w-6 h-6 text-purple-600" />
//                   </div>
//                 </div>
//                 <h3 className="text-3xl font-bold text-gray-900">
//                   {formatCurrency(stats.averageRevenue)}
//                 </h3>
//                 <p className="text-gray-600 text-sm mt-1">Average per Appointment</p>
//               </div>

//               <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-sm text-white">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 bg-white/20 rounded-lg">
//                     <DollarSign className="w-6 h-6" />
//                   </div>
//                 </div>
//                 <h3 className="text-3xl font-bold">
//                   {stats.chartData.length}
//                 </h3>
//                 <p className="text-blue-100 text-sm mt-1">Data Points</p>
//               </div>
//             </div>

//             {/* Revenue Trend Chart */}
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
//               <ResponsiveContainer width="100%" height={400}>
//                 <AreaChart data={stats.chartData}>
//                   <defs>
//                     <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
//                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis 
//                     dataKey="date" 
//                     tickFormatter={formatDate}
//                     stroke="#9ca3af"
//                     style={{ fontSize: '12px' }}
//                   />
//                   <YAxis 
//                     stroke="#9ca3af" 
//                     style={{ fontSize: '12px' }}
//                     tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
//                   />
//                   <Tooltip 
//                     contentStyle={{ 
//                       backgroundColor: '#fff',
//                       border: '1px solid #e5e7eb',
//                       borderRadius: '8px',
//                       fontSize: '12px'
//                     }}
//                     labelFormatter={formatDate}
//                     formatter={(value: any) => [formatCurrency(value), 'Revenue']}
//                   />
//                   <Area 
//                     type="monotone" 
//                     dataKey="revenue" 
//                     stroke="#3b82f6" 
//                     strokeWidth={2}
//                     fillOpacity={1}
//                     fill="url(#colorRevenue)"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>

//             {/* Appointments vs Revenue */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Revenue</h2>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={stats.chartData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis 
//                       dataKey="date" 
//                       tickFormatter={formatDate}
//                       stroke="#9ca3af"
//                       style={{ fontSize: '12px' }}
//                     />
//                     <YAxis 
//                       stroke="#9ca3af" 
//                       style={{ fontSize: '12px' }}
//                       tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
//                     />
//                     <Tooltip 
//                       contentStyle={{ 
//                         backgroundColor: '#fff',
//                         border: '1px solid #e5e7eb',
//                         borderRadius: '8px',
//                         fontSize: '12px'
//                       }}
//                       formatter={(value: any) => [formatCurrency(value), 'Revenue']}
//                     />
//                     <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments</h2>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart data={stats.chartData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis 
//                       dataKey="date" 
//                       tickFormatter={formatDate}
//                       stroke="#9ca3af"
//                       style={{ fontSize: '12px' }}
//                     />
//                     <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
//                     <Tooltip 
//                       contentStyle={{ 
//                         backgroundColor: '#fff',
//                         border: '1px solid #e5e7eb',
//                         borderRadius: '8px',
//                         fontSize: '12px'
//                       }}
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="appointments" 
//                       stroke="#f59e0b" 
//                       strokeWidth={3}
//                       dot={{ fill: '#f59e0b', r: 4 }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default RevenueDashboard;