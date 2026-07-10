import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { XCircle, Upload, Info, QrCode, CreditCard, FileCheck, CheckCircle } from 'lucide-react';
import api, { BASE_URL } from '../services/api';

const QRPaymentGateway = ({ onClose, paymentDetails, settings, onSuccess, studentInfo }) => {
  const [step, setStep] = useState(1); // 1: Scan, 2: Details
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const onSubmit = async (data) => {
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-auto">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
           <div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <QrCode className="text-indigo-500" size={24} /> Pay via UPI QR
             </h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manual Verification Process</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
             <XCircle size={20} />
           </button>
        </div>

        {/* Timeline */}
        <div className="px-8 pt-6 pb-2">
           <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%' }}
              ></div>
              
              <div className={`relative z-10 flex flex-col items-center gap-1 ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>1</div>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Scan QR</span>
              </div>
              <div className={`relative z-10 flex flex-col items-center gap-1 ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800'}`}>2</div>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Submit Details</span>
              </div>
           </div>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6 text-center">
                
                {/* Payment summary box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                  <div className="text-left">
                     <p className="text-xs text-slate-500 font-semibold uppercase">Amount Due</p>
                     <p className="font-bold text-slate-900 dark:text-white">Hidden</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-slate-500 font-semibold uppercase">For</p>
                     <p className="font-bold text-slate-900 dark:text-white capitalize">{paymentDetails.type} ({paymentDetails.billing_month})</p>
                  </div>
                </div>

                {/* Main QR Display */}
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border-2 border-slate-100 dark:border-slate-700 inline-block w-full max-w-[280px] relative group overflow-hidden">
                   {settings?.qr_image_url ? (
                     <div className="aspect-square relative flex items-center justify-center bg-white rounded-xl">
                        <img src={`${BASE_URL}${settings.qr_image_url}`} alt="UPI QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                     </div>
                   ) : (
                     <div className="aspect-square bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-xl text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                           <QrCode size={48} className="mx-auto mb-2 opacity-50" />
                           <p className="text-sm font-medium">No QR Configured</p>
                        </div>
                     </div>
                   )}
                </div>

                <div className="space-y-1">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{settings?.account_name || 'PG Administrator'}</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full">{settings?.upi_id || 'UPI ID Not Available'}</p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl text-xs sm:text-sm flex items-start gap-2 text-left border border-indigo-100 dark:border-indigo-900/50">
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  <p>Scan using any UPI app. Do not pay less or more than your required due amount.</p>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
                >
                  I Have Completed the Payment
                  <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Modern Floating Label Inputs */}
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
                      onClick={() => setStep(1)}
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
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default QRPaymentGateway;
