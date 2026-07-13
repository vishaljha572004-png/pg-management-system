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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const SuperAdminLogin = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  const [rememberMe, setRememberMe] = useState(true);

  React.useEffect(() => {
    const saved = localStorage.getItem('superAdminLoginDetails');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email) setValue('email', parsed.email);
      if (parsed.password) setValue('password', parsed.password);
    }
  }, [setValue]);

  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/super-admin/login', data);
      toast.success(response.data.message);
      login(response.data.user, response.data.accessToken);
      if (rememberMe) {
        localStorage.setItem('superAdminLoginDetails', JSON.stringify(data));
      } else {
        localStorage.removeItem('superAdminLoginDetails');
      }
      window.location.href = '/super-admin-dashboard';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      localStorage.removeItem('superAdminLoginDetails');
      setRememberMe(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative flex-col justify-between p-12 text-white overflow-hidden">
        {}
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

      {}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] space-y-8"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Super Admin</h2>
            <p className="text-muted-foreground">Sign in to manage the platform</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} action="#" method="POST">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@example.com"
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
            
            <div className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Back to Student Login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
