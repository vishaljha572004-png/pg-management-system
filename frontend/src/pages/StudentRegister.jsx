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

const registerSchema = z.object({
  org_code: z.string().min(1, 'Organization Code is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const StudentRegister = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Trigger OTP
      await api.post('/auth/otp/send', { phone: data.phone, purpose: 'student_signup' });
      setPendingData(data);
      setShowOTPModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPVerified = async (otpToken) => {
    setShowOTPModal(false);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { ...pendingData, otpToken });
      toast.success(response.data.message);
      
      // Auto-login logic for student after registration
      const loginResponse = await api.post('/auth/login', {
        org_code: pendingData.org_code,
        email: pendingData.phone,
        password: pendingData.password
      });
      
      login(loginResponse.data.user, loginResponse.data.accessToken);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding/Illustration */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative flex-col justify-between p-12 text-white overflow-hidden">
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
            Welcome to your new home.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400 text-lg"
          >
            Register as a student using your PG's Organization Code. Manage your rent, complaints, and profile all in one place.
          </motion.p>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © 2026 PG Management System. All rights reserved.
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[450px] space-y-6 py-10"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Student Registration</h2>
            <p className="text-muted-foreground">Create an account to join your PG</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Organization Code</label>
              <Input
                {...register('org_code')}
                placeholder="e.g. SDN3KD (Ask your PG Admin)"
                className="uppercase"
              />
              {errors.org_code && <p className="text-destructive text-sm mt-1">{errors.org_code.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Full Name</label>
              <Input
                {...register('name')}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email Address</label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="name@example.com"
                />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Phone Number</label>
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="9876543210"
                />
                {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Password</label>
              <PasswordInput
                {...register('password')}
                autoComplete="new-password"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Register & Join PG'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
      
      {showOTPModal && pendingData && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          phone={pendingData.phone}
          purpose="student_signup"
          onSuccess={onOTPVerified}
        />
      )}
    </div>
  );
};

export default StudentRegister;
