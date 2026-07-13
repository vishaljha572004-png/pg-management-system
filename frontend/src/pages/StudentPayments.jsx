import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, Clock, CheckCircle, XCircle, Download, FileText, CreditCard, ChevronRight } from 'lucide-react';
import { generateReceipt } from '../utils/ReceiptGenerator';
import UnifiedPaymentGateway from '../components/UnifiedPaymentGateway';

const StudentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); 

  const fetchPayments = async () => {
    try {
      const response = await api.get('/rent/my-rent');
      setPayments(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load payment history');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load payment settings', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchPayments(), fetchSettings()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {}
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
             <CreditCard size={28} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Payments</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your rent and view transaction history.</p>
          </div>
        </div>

        {}
        <div className="space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                     <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                     <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                  </div>
                  <div className="w-full md:w-32 space-y-4 flex flex-col items-end">
                     <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                     <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center shadow-sm">
              <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <FileText className="text-indigo-300 dark:text-indigo-700" size={64} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No payment history available</h3>
              <p className="text-slate-500 font-medium">When you have dues, they will appear here securely.</p>
            </div>
          ) : (
            payments.map(payment => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={payment.id} 
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                      <IndianRupee size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Monthly Rent 
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 mb-4 pl-12">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{payment.billing_month}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      Generated: {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {payment.status === 'rejected' && (
                    <div className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm flex items-start gap-3 border border-rose-100 dark:border-rose-900/30 mt-2">
                      <XCircle size={20} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold mb-1">Verification Failed</p>
                        <p>{payment.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto relative z-10 pl-12 md:pl-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                  <div className="flex items-center gap-3 md:justify-end w-full">
                     {payment.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">
                          <CheckCircle size={14} /> PAID
                        </span>
                     ) : payment.status === 'pending_verification' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                          <Clock size={14} /> VERIFYING
                        </span>
                     ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30">
                          <Clock size={14} /> {payment.status === 'rejected' ? 'RETRY' : 'PENDING'}
                        </span>
                     )}
                  </div>
                  
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    ₹{payment.amount}
                  </span>
                  
                  {payment.status === 'paid' ? (
                    <div className="flex flex-col items-start md:items-end w-full">
                      {payment.transaction_id && <span className="text-xs font-medium text-slate-400 mb-2 font-mono">TXN: {payment.transaction_id}</span>}
                      <button 
                        onClick={() => generateReceipt({ ...payment, type: 'rent', student_name: JSON.parse(localStorage.getItem('user'))?.name, phone: JSON.parse(localStorage.getItem('user'))?.phone })}
                        className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> Receipt
                      </button>
                    </div>
                  ) : payment.status === 'pending_verification' ? (
                    <div className="flex flex-col items-start md:items-end w-full">
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">Admin Approval Pending</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveModal({ id: payment.id, type: 'rent' })}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group/btn"
                    >
                      {payment.status === 'rejected' ? 'Pay Again' : 'Pay Now'}
                      <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <UnifiedPaymentGateway
            onClose={() => setActiveModal(null)}
            paymentDetails={activeModal}
            settings={settings}
            studentInfo={JSON.parse(localStorage.getItem('user')) || {}}
            onSuccess={() => {
              setActiveModal(null);
              fetchPayments();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentPayments;
