import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const OTPModal = ({ isOpen, onClose, phone, purpose, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen && cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, cooldown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setCooldown(60);
    }
  }, [isOpen]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/otp/verify', { phone, otp, purpose });
      toast.success(response.data.message || 'Phone verified successfully!');
      onSuccess(response.data.otpToken);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      const response = await api.post('/auth/otp/send', { phone, purpose });
      toast.success(response.data.message || 'OTP resent successfully');
      setCooldown(60);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card text-card-foreground p-6 rounded-xl shadow-xl w-full max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X size={20} />
          </button>
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold tracking-tight">Verify Mobile</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We've sent a 6-digit code to <br />
              <span className="font-semibold text-foreground">
                {phone.replace(/(\d{2})(\d{4})(\d{4})/, '+91 ******$3')}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2 flex justify-center">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="text-center text-3xl tracking-[0.5em] font-mono p-4 h-16 w-full max-w-[280px]"
                placeholder="------"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="text-center mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline inline-block mx-auto"
              >
                {isResending ? 'Sending...' : cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend OTP'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground underline inline-block mx-auto"
              >
                Change mobile number
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
