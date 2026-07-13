import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, ShieldCheck, Download, FileText, ChevronRight, QrCode, AlertCircle, Upload, FileCheck } from 'lucide-react';
import api, { BASE_URL } from '../services/api';
import { generateReceipt } from '../utils/ReceiptGenerator';

const MOCK_PAYMENT_OPTIONS = [
  { id: 'gpay', name: 'Google Pay', icon: 'G', color: 'bg-blue-500', scheme: 'gpay://upi/pay' },
  { id: 'phonepe', name: 'PhonePe', icon: 'P', color: 'bg-purple-600', scheme: 'phonepe://pay' },
  { id: 'paytm', name: 'Paytm', icon: '₹', color: 'bg-sky-500', scheme: 'paytmmp://pay' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'B', color: 'bg-orange-500', scheme: 'bhim://pay' },
  { id: 'amazon', name: 'Amazon Pay', icon: 'A', color: 'bg-slate-800', scheme: 'upi://pay' }, 
];

const PROCESSING_STEPS = [
  "Connecting...",
  "Preparing Payment...",
  "Processing...",
  "Verifying...",
  "Payment Successful"
];

const UnifiedPaymentGateway = ({ onClose, paymentDetails, settings, onSuccess, studentInfo }) => {
  const [step, setStep] = useState('initial'); 
  const [isMobile, setIsMobile] = useState(false);
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);
  const [transactionData, setTransactionData] = useState(null);
  const [simulatedError, setSimulatedError] = useState(null);
  
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const generateUpiUrl = (scheme) => {
    const upiId = settings?.upi_id || 'test@upi';
    const name = encodeURIComponent(settings?.account_name || 'PG Administrator');
    const amount = paymentDetails.amount || 0;
    const txnId = `TXN${new Date().getTime()}`;
    return `${scheme}?pa=${upiId}&pn=${name}&tr=${txnId}&am=${amount}&cu=INR`;
  };

  const handleAppLaunch = (opt) => {
    const url = generateUpiUrl(opt.scheme);
    
    
    window.location.href = url;

    
    setTimeout(() => {
      if (document.hidden) {
         
      } else {
         toast.error(`The selected UPI application is not available on this device. Please choose another UPI app or scan the QR Code.`, { duration: 4000 });
      }
    }, 1500);
  };

  const handleCompletedPaymentClick = () => {
    if (settings?.payment_mode === 'development') {
      startDevelopmentSimulation();
    } else {
      setStep('manual_form');
    }
  };

  const startDevelopmentSimulation = async () => {
    setStep('dev_processing');
    
    
    for (let i = 0; i < PROCESSING_STEPS.length - 1; i++) {
      setProcessingMsgIndex(i);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
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
      await new Promise(r => setTimeout(r, 800));
      setStep('dev_success');
    } catch (error) {
      setSimulatedError(error.response?.data?.message || 'Payment simulation failed due to server error.');
      setStep('error');
    }
  };

  const onManualFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', paymentDetails.id);
      formData.append('type', paymentDetails.type);
      formData.append('transaction_id', data.transaction_id);
      formData.append('payment_date', data.payment_date);
      if (file) {
        formData.append('screenshot', file);
      }

      const response = await api.post('/payments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(response.data.message);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDownloadReceipt = () => {
    generateReceipt({
      ...paymentDetails,
      transaction_id: transactionData.transaction_id,
      amount: paymentDetails.amount,
      receipt_number: transactionData.receipt_number,
      student_name: studentInfo?.name,
      room_number: studentInfo?.room_number,
      phone: studentInfo?.phone
    }, settings?.pg_name);
  };

  
  const currentTimelineStep = step === 'initial' ? 1 : (step === 'dev_processing' || step === 'manual_form') ? 2 : step === 'dev_success' ? 3 : 1;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-auto relative">
        
        {settings?.payment_mode === 'development' && (
          <div className="absolute top-5 left-6 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm z-10 flex items-center gap-1">
            <AlertCircle size={12} /> Dev Mode
          </div>
        )}

        {}
        <div className="px-6 pt-14 pb-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 relative text-center">
           <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="text-indigo-500" size={24} />
           </div>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Checkout</h3>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{settings?.pg_name || 'PG Management'}</p>
           
           {step !== 'dev_processing' && (
             <button onClick={onClose} className="absolute top-5 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
               <XCircle size={20} />
             </button>
           )}
        </div>

        {}
        <div className="px-8 pt-6 pb-2 hidden sm:block">
           <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-700 ease-in-out"
                style={{ width: currentTimelineStep === 1 ? '33%' : currentTimelineStep === 2 ? '66%' : '100%' }}
              ></div>
              
              <div className={`relative z-10 flex flex-col items-center gap-1 ${currentTimelineStep >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${currentTimelineStep >= 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>1</div>
                 <span className="text-[9px] font-bold uppercase tracking-wider">{isMobile ? 'Method' : 'Scan'}</span>
              </div>
              <div className={`relative z-10 flex flex-col items-center gap-1 ${currentTimelineStep >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${currentTimelineStep >= 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>2</div>
                 <span className="text-[9px] font-bold uppercase tracking-wider">{settings?.payment_mode === 'development' ? 'Process' : 'Verify'}</span>
              </div>
              <div className={`relative z-10 flex flex-col items-center gap-1 ${currentTimelineStep >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-500 ${currentTimelineStep >= 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>3</div>
                 <span className="text-[9px] font-bold uppercase tracking-wider">Receipt</span>
              </div>
           </div>
        </div>

        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {}
            {step === 'initial' && (
              <motion.div key="initial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6 text-center">
                
                {}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Student</p>
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
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Paying For</p>
                          <p className="font-bold capitalize">{paymentDetails.type} ({paymentDetails.billing_month})</p>
                       </div>
                       <div className="text-right">
                          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Amount</p>
                          <p className="font-bold text-xl blur-sm select-none opacity-80">₹0,000</p>
                       </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 inline-block w-full max-w-[280px] mx-auto">
                   {settings?.qr_image_url ? (
                     <div className="aspect-square relative flex items-center justify-center bg-white rounded-xl">
                        <img src={`${BASE_URL}${settings.qr_image_url}`} alt="UPI QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                     </div>
                   ) : (
                     <div className="aspect-square bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-2xl text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                           <QrCode size={48} className="mx-auto mb-2 opacity-50" />
                           <p className="text-sm font-medium">No QR Configured</p>
                        </div>
                     </div>
                   )}
                   <div className="mt-4 space-y-0.5">
                     <p className="font-bold text-slate-900 dark:text-slate-800 text-lg leading-tight">{settings?.account_name || 'PG Administrator'}</p>
                     <p className="text-xs font-medium text-slate-500">{settings?.upi_id || 'UPI ID Not Available'}</p>
                   </div>
                </div>
                
                {isMobile ? (
                  <div className="text-left">
                    <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Choose Your UPI App</h4>
                    <div className="space-y-3">
                      {MOCK_PAYMENT_OPTIONS.map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => handleAppLaunch(opt)}
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
                  </div>
                ) : (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 p-4 rounded-2xl text-sm border border-indigo-100 dark:border-indigo-900/50">
                    <p className="font-medium">Scan this QR Code using any UPI application on your mobile phone to complete the payment.</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={handleCompletedPaymentClick}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
                  >
                    I Have Completed the Payment
                    <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {}
            {step === 'dev_processing' && (
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

            {}
            {step === 'dev_success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center pb-4">
                 <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                      <CheckCircle className="text-emerald-500 drop-shadow-md" size={56} />
                    </motion.div>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-8">Your transaction has been verified.</p>

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

            {}
            {step === 'manual_form' && (
              <motion.div key="manual" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Submit Payment Details</h3>
                   <p className="text-sm text-slate-500">Provide the UTR to send for verification.</p>
                </div>
                <form onSubmit={handleSubmit(onManualFormSubmit)} className="space-y-6">
                  
                  {}
                  <div className="relative">
                    <input 
                      type="text" 
                      id="utr"
                      {...register('transaction_id', { required: 'Transaction ID is required' })}
                      className="block px-4 pb-3 pt-6 w-full text-sm text-slate-900 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:ring-0 dark:text-white appearance-none peer transition-colors"
                      placeholder=" "
                    />
                    <label htmlFor="utr" className="absolute text-sm text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:text-indigo-600 peer-focus:dark:text-indigo-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 font-semibold uppercase tracking-wider">
                      Transaction ID (UTR) <span className="text-rose-500">*</span>
                    </label>
                    {errors.transaction_id && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1">{errors.transaction_id.message}</p>}
                  </div>

                  <div className="relative mt-8">
                    <input 
                      type="datetime-local" 
                      id="pdate"
                      {...register('payment_date', { required: 'Payment Date is required' })}
                      className="block px-4 pb-3 pt-6 w-full text-sm text-slate-900 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:ring-0 dark:text-white appearance-none peer transition-colors"
                      placeholder=" "
                    />
                    <label htmlFor="pdate" className="absolute text-sm text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:text-indigo-600 peer-focus:dark:text-indigo-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 font-semibold uppercase tracking-wider">
                      Payment Date & Time <span className="text-rose-500">*</span>
                    </label>
                    {errors.payment_date && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1">{errors.payment_date.message}</p>}
                  </div>

                  <div className="mt-8">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">Payment Screenshot (Optional)</label>
                    <label className={`cursor-pointer flex flex-col items-center justify-center w-full px-4 py-8 rounded-2xl border-2 border-dashed transition-all ${preview ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      {preview ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-xl overflow-hidden mb-3 shadow-md border border-slate-200">
                             <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><FileCheck size={16}/> Image Attached</span>
                          <span className="text-xs text-slate-400 mt-1">Click to replace</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500">
                          <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center mb-3">
                             <Upload size={20} className="text-indigo-500" />
                          </div>
                          <span className="text-sm font-medium">Click to upload screenshot</span>
                          <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  </div>

                  <div className="pt-6 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setStep('initial')}
                      className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</>
                      ) : 'Submit Verification'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {}
            {step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                 <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="text-rose-500" size={56} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Failed</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-8">{simulatedError}</p>
                 <button 
                    onClick={() => setStep('initial')}
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

export default UnifiedPaymentGateway;
