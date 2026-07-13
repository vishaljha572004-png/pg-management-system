import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Phone, ShieldCheck, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setProfile(response.data);
        setValue('phone', response.data.phone);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setValue]);

  const onUpdateProfile = async (data) => {
    try {
      const payload = { phone: data.phone };
      if (data.password) {
        payload.password = data.password;
      }
      
      await api.put('/auth/profile', payload);
      toast.success('Profile updated successfully');
      
      
      setProfile({ ...profile, phone: data.phone });
      setIsEditing(false);
      
      if (data.password) {
        toast('Next time you login, use your new password!', { icon: '🔐' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading || !profile) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl w-full space-y-8 mt-10">
        
        <Card className="overflow-hidden relative border-none shadow-xl">
          {}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-40 animate-blob"></div>

          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-8 mb-8 relative z-10">
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-extrabold uppercase shadow-inner border border-primary/20">
                {profile.name.charAt(0)}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-extrabold">{profile.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-sm font-medium text-success bg-success/10 px-3 py-1 rounded-full w-max mx-auto md:mx-0">
                  <ShieldCheck size={16} /> Verified Student
                </div>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                    <div className="p-2 bg-background rounded-lg text-muted-foreground"><Mail size={20} /></div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                      <p className="font-semibold text-foreground">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                    <div className="p-2 bg-background rounded-lg text-muted-foreground"><Phone size={20} /></div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                      <p className="font-semibold text-foreground">{profile.phone}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-6"
                    size="lg"
                  >
                    Edit Profile Settings
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2"><Phone size={16}/> Update Phone Number</label>
                    <Input 
                      {...register('phone', { required: true })} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2"><Lock size={16}/> New Password (Optional)</label>
                    <PasswordInput 
                      {...register('password')} 
                      autoComplete="new-password"
                      placeholder="Leave blank to keep current password"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full">
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;
