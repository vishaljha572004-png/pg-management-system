import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { OTPModal } from '../components/ui/OTPModal';
import { X } from 'lucide-react';

const loginSchema = z.object({
  org_code: z.string().min(1, 'Organization Code is required'),
  email: z.string().min(1, 'Phone or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  const [rememberMe, setRememberMe] = useState(true);

  React.useEffect(() => {
    const saved = localStorage.getItem('studentLoginDetails');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.org_code) setValue('org_code', parsed.org_code);
      if (parsed.email) setValue('email', parsed.email);
      if (parsed.password) setValue('password', parsed.password);
    }
  }, [setValue]);

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPg, setShowForgotPg] = useState(false);
  const [findPgPhone, setFindPgPhone] = useState('');
  const [findPgOtp, setFindPgOtp] = useState('');
  const [foundPg, setFoundPg] = useState(null);
  const [isFindingPg, setIsFindingPg] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { login } = useContext(AuthContext);

  const handleFindPg = async (e) => {
    e.preventDefault();
    setIsFindingPg(true);
    setFoundPg(null);
    try {
      const response = await api.post('/auth/find-pg', { phone: findPgPhone, otp: findPgOtp });
      setFoundPg(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to find PG');
    } finally {
      setIsFindingPg(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      toast.success(response.data.message);
      login(response.data.user, response.data.accessToken);
      if (rememberMe) {
        localStorage.setItem('studentLoginDetails', JSON.stringify(data));
      } else {
        localStorage.removeItem('studentLoginDetails');
      }
      window.location.href = '/dashboard';
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.requires_otp) {
        setPendingData({ ...data, phone: errData.phone });
        try {
          await api.post('/auth/otp/send', { phone: errData.phone, purpose: 'login' });
          setShowOTPModal(true);
        } catch (otpErr) {
          toast.error(otpErr.response?.data?.message || 'Failed to send OTP');
        }
      } else {
        const errMsg = errData?.details ? `${errData.message}: ${errData.details}` : (errData?.message || 'Login failed');
        toast.error(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPVerified = async (otpToken) => {
    setShowOTPModal(false);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { ...pendingData, otpToken });
      toast.success(response.data.message);
      login(response.data.user, response.data.accessToken);
      if (rememberMe) {
        localStorage.setItem('studentLoginDetails', JSON.stringify(pendingData));
      }
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed after OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding/Illustration */}
      <div className="hidden md:flex w-1/2 bg-zinc-900 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
            <div className="h-10 w-10 rounded-xl bg-white text-zinc-900 flex items-center justify-center">
              PG
            </div>
            PG System
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold tracking-tight mb-6 leading-tight"
          >
            Manage your property with unprecedented ease.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400 text-lg"
          >
            Streamlined rent collection, verified profiles, and seamless complaint resolution. Built for the modern property owner.
          </motion.p>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © 2026 PG Management System. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] space-y-8"
        >
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} action="#" method="POST">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Organization Code</label>
                  <button type="button" onClick={() => setShowForgotPg(true)} className="text-sm font-medium text-primary hover:underline">Forgot Code?</button>
                </div>
                <Input
                  {...register('org_code')}
                  type="text"
                  placeholder="e.g. PG123"
                  className="uppercase"
                />
                {errors.org_code && <p className="text-destructive text-sm mt-1">{errors.org_code.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mobile Number / Email</label>
                <Input
                  {...register('email')}
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter registered mobile or email"
                />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none">Password</label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
                </div>
                <PasswordInput
                  id="password"
                  {...register('password')}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Remember my details
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              <span className="opacity-70">Admins? </span>
              <Link to="/admin/login" className="font-semibold text-primary hover:underline">
                Admin Portal
              </Link>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Forgot PG Code Modal */}
      {showForgotPg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card text-card-foreground p-6 rounded-xl shadow-xl w-full max-w-md relative"
          >
            <button onClick={() => setShowForgotPg(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold mb-2">Find My PG Code</h3>
            <p className="text-sm text-muted-foreground mb-6">Enter your registered mobile number and OTP (use 1234 for demo) to get your organization code.</p>
            
            <form onSubmit={handleFindPg} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number</label>
                <Input value={findPgPhone} onChange={e => setFindPgPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">OTP</label>
                <Input value={findPgOtp} onChange={e => setFindPgOtp(e.target.value)} placeholder="1234" required />
              </div>
              <Button type="submit" className="w-full" disabled={isFindingPg}>
                {isFindingPg ? 'Finding...' : 'Find PG'}
              </Button>
            </form>

            {foundPg && (
              <div className="mt-6 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
                <p className="font-medium text-sm">Found PG: {foundPg.name}</p>
                <div className="mt-2 text-2xl font-bold tracking-widest text-center">
                  {foundPg.org_code}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showOTPModal && pendingData && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          phone={pendingData.phone}
          purpose="login"
          onSuccess={onOTPVerified}
        />
      )}
    </div>
  );
};

export default Login;
