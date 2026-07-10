import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Trash2, Pin, Users, Home, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminNoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_type: 'all', // all, room, individual
    target_id: '',
    is_pinned: false,
    expiry_date: ''
  });

  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchNotices();
    fetchOptions();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data } = await api.get('/notices');
      setNotices(data);
    } catch (_) {
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/admin/rooms'),
        api.get('/admin/students')
      ]);
      setRooms(rRes.data);
      setStudents(sRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.target_type !== 'all' && !formData.target_id) {
      return toast.error('Please select a target');
    }
    try {
      await api.post('/notices', formData);
      toast.success('Notice published successfully');
      setFormData({ title: '', description: '', target_type: 'all', target_id: '', is_pinned: false, expiry_date: '' });
      fetchNotices();
    } catch (_) {
      toast.error('Failed to publish notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (_) {
      toast.error('Failed to delete notice');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      
      {/* Left Col: Create Notice */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Megaphone className="text-indigo-600" /> Publish Notice
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setFormData({...formData, target_type: 'all'})} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 ${formData.target_type === 'all' ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-500'}`}><Users size={18} /><span className="text-xs">All</span></button>
                <button type="button" onClick={() => setFormData({...formData, target_type: 'room'})} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 ${formData.target_type === 'room' ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-500'}`}><Home size={18} /><span className="text-xs">Room</span></button>
                <button type="button" onClick={() => setFormData({...formData, target_type: 'individual'})} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 ${formData.target_type === 'individual' ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-500'}`}><User size={18} /><span className="text-xs">Student</span></button>
              </div>
            </div>

            {formData.target_type === 'room' && (
              <select name="target_id" value={formData.target_id} onChange={handleInputChange} required className="w-full p-2 border border-slate-200 rounded-lg dark:bg-slate-700">
                <option value="">Select Room...</option>
                {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
              </select>
            )}

            {formData.target_type === 'individual' && (
              <select name="target_id" value={formData.target_id} onChange={handleInputChange} required className="w-full p-2 border border-slate-200 rounded-lg dark:bg-slate-700">
                <option value="">Select Student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.room_number ? 'Room ' + s.room_number : 'No Room'})</option>)}
              </select>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expiry Date (Optional)</label>
              <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="is_pinned" id="is_pinned" checked={formData.is_pinned} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
              <label htmlFor="is_pinned" className="text-sm text-slate-700 dark:text-slate-300">Pin to top</label>
            </div>

            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold mt-4 transition-colors">
              Publish Notice
            </button>
          </form>
        </div>
      </div>

      {/* Right Col: Notice List */}
      <div className="w-full lg:w-2/3 space-y-4">
        {loading ? <div className="text-center py-10">Loading...</div> : notices.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500">No notices published yet.</div>
        ) : (
          notices.map(notice => (
            <motion.div key={notice.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${notice.is_pinned ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  {notice.is_pinned && <Pin className="text-red-500" size={18} />} {notice.title}
                </h3>
                <button onClick={() => handleDelete(notice.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-4 text-xs font-medium">
                <span className={`px-2 py-0.5 rounded-full ${notice.target_type === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                  Target: {notice.target_type.toUpperCase()} {notice.target_id && `(ID: ${notice.target_id})`}
                </span>
                <span className="text-slate-400">Published on {new Date(notice.created_at).toLocaleDateString()}</span>
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{notice.description}</p>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
};

export default AdminNoticeBoard;
