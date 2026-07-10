import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ShieldCheck, Download, CreditCard, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { generateReceipt } from '../utils/ReceiptGenerator';

const MOCK_PAYMENT_OPTIONS = [
  { id: 'gpay', name: 'Google Pay', icon: 'G', color: 'bg-blue-500' },
  { id: 'phonepe', name: 'PhonePe', icon: 'P', color: 'bg-purple-600' },
  { id: 'paytm', name: 'Paytm', icon: '₹', color: 'bg-sky-500' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'B', color: 'bg-orange-500' },
  { id: 'amazon', name: 'Amazon Pay', icon: 'A', color: 'bg-slate-800' },
];

const PROCESSING_STEPS = [
  "Connecting...",
  "Preparing Payment...",
  "Processing...",
  "Verifying...",
  "Payment Successful"
];

const DevelopmentPaymentGateway = ({ onClose, paymentDetails, settings, onSuccess, studentInfo }) => {
  const [step, setStep] = useState('select_method'); // select_method, processing, success, error
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);
  const [transactionData, setTransactionData] = useState(null);
  const [simulatedError, setSimulatedError] = useState(null);

  const handlePay = async (methodId) => {
    setSelectedMethod(methodId);
    setStep('processing');
    
    // Simulate processing steps
    for (let i = 0; i < PROCESSING_STEPS.length - 1; i++) {
      setProcessingMsgIndex(i);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400)); // Total ~2-3 seconds
    }

    try {
      const generatedTxnId = `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      const payload = {
        id: paymentDetails.id,
        type: paymentDetails.type,
        transaction_id: generatedTxnId,
        payment_date: new Date().toISOString()
      };

      await api.post('/payments/simulate', payload);
      
      setTransactionData({
        transaction_id: generatedTxnId,
        receipt_number: `RCP${new Date().getFullYear()}${Math.floor(10000 + Math.random() * 90000)}`,
        timestamp: new Date(),
        status: 'Successful'
      });
      
      setProcessingMsgIndex(PROCESSING_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 800)); // show success message briefly
      setStep('success');
    } catch (error) {
      setSimulatedError(error.response?.data?.message || 'Payment simulation failed due to server error.');
      setStep('error');
    }
  };

  const handleDownloadReceipt = () => {
    generateReceipt({
      ...paymentDetails,
      transaction_id: transactionData.transaction_id,
      amount: paymentDetails.amount, // keeping it for receipt generator
      receipt_number: transactionData.receipt_number,
      student_name: studentInfo?.name,
      room_number: studentInfo?.room_number,
      phone: studentInfo?.phone
    }, settings?.pg_name);
  };

  const currentTimelineStep = step === 'select_method' ? 1 : step === 'processing' ? 2 : 3;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-auto relative">
        
        {/* Development Badge */}
        <div className="absolute top-5 left-6 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm z-10 flex items-center gap-1">
          <AlertCircle size={12} /> Dev Mode
        </div>

        {/* Header */}
        <div className="px-6 pt-14 pb-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 relative">
           <div className="text-center">
             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="text-indigo-500" size={24} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Checkout</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{settings?.pg_name || 'PG Management'}</p>
           </div>
           
           {step !== 'processing' && (
             <button onClick={onClose} className="absolute top-5 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
               <XCircle size={20} />
             </button>
           )}
        </div>

        {/* Timeline */}
        <div className="px-8 pt-6 pb-2">
           <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-700 ease-in-out"
                style={{ width: currentTimelineStep === 1 ? '33%' : currentTimelineStep === 2 ? '66%' : '100%' }}
              ></div>
              
              <div className={`relative z-10 flex flex-col items-center gap-1 ${currentTimelineStep >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${currentTimelineStep >= 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>1</div>
                 <span className="text-[9px] font-bold uppercase tracking-wider">Method</span>
              </div>
              <div className={`relative z-10 flex flex-col items-center gap-1 ${currentTimelineStep >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${currentTimelineStep >= 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>2</div>
                 <span className="text-[9px] font-bold uppercase tracking-wider">Process</span>
              </div>
              <div className={`relative z-10 flex flex-col items-center gap-1 ${currentTimelineStep >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${currentTimelineStep >= 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>3</div>
                 <span className="text-[9px] font-bold uppercase tracking-wider">Receipt</span>
              </div>
           </div>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Select Method */}
            {step === 'select_method' && (
              <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                
                {/* Premium Payment Summary Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 mb-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl -ml-10 -mb-10"></div>
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Student Name</p>
                          <p className="font-bold text-lg">{studentInfo?.name || 'Student'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Room</p>
                          <p className="font-bold text-lg">{studentInfo?.room_number || 'N/A'}</p>
                       </div>
                    </div>
                    <div className="h-px w-full bg-white/10"></div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Payment For</p>
                          <p className="font-bold capitalize">{paymentDetails.type} ({paymentDetails.billing_month})</p>
                       </div>
                       <div className="text-right">
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Amount</p>
                          <p className="font-bold text-xl blur-sm select-none">₹0,000</p>
                       </div>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Pay Using</h4>
                <div className="space-y-3">
                  {MOCK_PAYMENT_OPTIONS.map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => handlePay(opt.id)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-inner ${opt.color}`}>
                          {opt.icon}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">{opt.name}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Processing */}
            {step === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="py-16 text-center space-y-8">
                 <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                    <motion.div 
                      className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    ></motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       {processingMsgIndex === PROCESSING_STEPS.length - 1 ? (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                           <CheckCircle className="text-emerald-500" size={40} />
                         </motion.div>
                       ) : (
                         <ShieldCheck className="text-indigo-500" size={40} />
                       )}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                       {processingMsgIndex === PROCESSING_STEPS.length - 1 ? 'Complete' : 'Processing'}
                    </h3>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={processingMsgIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`text-sm font-medium ${processingMsgIndex === PROCESSING_STEPS.length - 1 ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                         {PROCESSING_STEPS[processingMsgIndex]}
                      </motion.p>
                    </AnimatePresence>
                 </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                 <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                      <CheckCircle className="text-emerald-500 drop-shadow-md" size={56} />
                    </motion.div>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-8">Your transaction has been verified.</p>

                 {/* Receipt Preview */}
                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 text-left border-2 border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
                    
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                       <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                          <FileText className="text-indigo-500" size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Receipt Generated</p>
                          <p className="text-xs text-slate-500">Official Document</p>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{transactionData.transaction_id}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Receipt No</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{transactionData.receipt_number}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-900 dark:text-white">{transactionData.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handleDownloadReceipt}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                    >
                      <Download size={18} /> Download
                    </button>
                    <button 
                      onClick={() => { onSuccess(); onClose(); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-2xl transition-colors"
                    >
                      Done
                    </button>
                 </div>
              </motion.div>
            )}

            {/* Step 4: Error */}
            {step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                 <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="text-rose-500" size={56} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Failed</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-8">{simulatedError}</p>
                 <button 
                    onClick={() => setStep('select_method')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    Try Again
                  </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default DevelopmentPaymentGateway;
