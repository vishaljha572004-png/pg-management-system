import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { BarChart3, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';


ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
);

const ReportsAnalytics = () => {
  const [financeData, setFinanceData] = useState([]);
  const [occupancyData, setOccupancyData] = useState(null);
  const [complaintData, setComplaintData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [finRes, occRes, compRes] = await Promise.all([
          api.get('/reports/finance'),
          api.get('/reports/occupancy'),
          api.get('/reports/complaints')
        ]);
        setFinanceData(finRes.data);
        setOccupancyData(occRes.data);
        setComplaintData(compRes.data);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || error.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>;

  
  const barChartData = {
    labels: financeData.map(d => d.billing_month),
    datasets: [
      {
        label: 'Collected Revenue (₹)',
        data: financeData.map(d => d.total_collected),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderRadius: 4
      },
      {
        label: 'Pending Dues (₹)',
        data: financeData.map(d => d.total_pending),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 4
      }
    ]
  };

  const occupancyChartData = occupancyData ? {
    labels: ['Occupied Beds', 'Available Beds'],
    datasets: [{
      data: [occupancyData.occupied_beds, occupancyData.available_beds],
      backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(226, 232, 240, 0.8)'],
      borderWidth: 0
    }]
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400">Financial insights and occupancy metrics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Revenue Overview</h2>
            <div className="h-80 w-full">
              {financeData.length > 0 ? (
                <Bar 
                  data={barChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } } 
                  }} 
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No financial data available</div>
              )}
            </div>
          </motion.div>

          {}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-indigo-500" /> Bed Occupancy
            </h2>
            <div className="h-64 w-full flex justify-center">
              {occupancyChartData ? (
                <Pie 
                  data={occupancyChartData} 
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No data</div>
              )}
            </div>
            
            {occupancyData && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400 text-sm">Total Capacity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{occupancyData.total_beds} Beds</span>
                </div>
                <div className="flex justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <span className="text-indigo-700 dark:text-indigo-300 text-sm">Occupancy Rate</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                    {Math.round((occupancyData.occupied_beds / occupancyData.total_beds) * 100) || 0}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Complaint Resolution Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {complaintData.length > 0 ? complaintData.map(stat => (
              <div key={stat.status} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">{stat.status.replace('_', ' ')} Tickets</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.count}</span>
              </div>
            )) : (
              <p className="text-slate-500">No complaints registered in the system yet.</p>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ReportsAnalytics;
