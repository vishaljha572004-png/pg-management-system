import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import api, { BASE_URL } from '../services/api';

const PaymentVerification = () => {
  const [payments, setPayments] = useState({ rent: [], electricity: [] });
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, id: null, type: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/payments/pending');
      setPayments(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id, type, action) => {
    if (action === 'reject' && !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await api.post('/payments/verify', {
        id, type, action, rejection_reason: rejectionReason
      });
      toast.success(`Payment ${action}ed successfully`);
      setRejectionModal({ isOpen: false, id: null, type: null });
      setRejectionReason('');
      fetchPending();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} payment`);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>;

  const allPending = [...payments.rent, ...payments.electricity].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <CheckCircle className="text-indigo-500" size={32} />
            Payment Verification
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Verify manual UPI submissions by matching the UTR with your bank statements.</p>
        </div>

        {allPending.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
            <p className="text-slate-500 mt-2">There are no pending payment verifications at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allPending.map((p) => (
              <motion.div 
                key={`${p.type}-${p.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider mb-2 ${
                      p.type === 'rent' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.type} Bill
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {p.type === 'rent' ? p.student_name : `Room ${p.room_number}`}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Month: {p.billing_month}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{p.amount}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(p.payment_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Transaction ID (UTR)</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.transaction_id}</p>
                    </div>
                    {p.screenshot_url && (
                      <button 
                        onClick={() => setSelectedImage(`${BASE_URL}${p.screenshot_url}`)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <ImageIcon size={16} /> View Screenshot
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-2">
                  <button 
                    onClick={() => handleVerify(p.id, p.type, 'approve')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button 
                    onClick={() => setRejectionModal({ isOpen: true, id: p.id, type: p.type })}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-screen">
              <button 
                className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-white/20 rounded-full p-2"
                onClick={() => setSelectedImage(null)}
              >
                <XCircle size={32} />
              </button>
              <img src={selectedImage} alt="Payment Screenshot" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            </div>
          </motion.div>
        )}

        {}
        {rejectionModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-rose-600">Reject Payment</h3>
                <button onClick={() => setRejectionModal({ isOpen: false, id: null, type: null })} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason for Rejection</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR not found in bank statement, Invalid screenshot..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 h-32 resize-none"
                ></textarea>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end">
                <button 
                  onClick={() => setRejectionModal({ isOpen: false, id: null, type: null })}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleVerify(rejectionModal.id, rejectionModal.type, 'reject')}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentVerification;
