import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { MessageSquareWarning, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';

const StudentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset } = useForm();

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/student');
      setComplaints(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleRaiseComplaint = async (data) => {
    try {
      await api.post('/complaints/student', data);
      toast.success('Complaint raised successfully');
      reset();
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to raise complaint');
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Complaints</h1>
          <p className="text-slate-500 dark:text-slate-400">Raise issues or track existing ones.</p>
        </div>

        {/* Raise Complaint Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquareWarning className="text-indigo-600" /> Raise New Complaint
          </h2>
          <form onSubmit={handleSubmit(handleRaiseComplaint)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Title</label>
              <input {...register('title', { required: true })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g. AC not cooling" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea {...register('description', { required: true })} rows="3" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Please describe the issue in detail..." />
            </div>
            <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
              Submit Complaint
            </button>
          </form>
        </div>

        {/* Complaint History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complaint History</h2>
          
          {complaints.length === 0 ? (
            <p className="text-slate-500">You haven't raised any complaints yet.</p>
          ) : (
            complaints.map(complaint => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={complaint.id} 
                className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{complaint.title}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                      complaint.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {complaint.status === 'resolved' ? <CheckCircle size={12} /> : 
                       complaint.status === 'in_progress' ? <Wrench size={12} /> : <Clock size={12} />}
                      {complaint.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{complaint.description}</p>
                <span className="text-xs text-slate-400">Raised on: {new Date(complaint.created_at).toLocaleDateString()}</span>
                
                {complaint.resolution_remark && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-green-500 text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Admin Remark: </span>
                    <span className="text-slate-600 dark:text-slate-400">{complaint.resolution_remark}</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentComplaints;
