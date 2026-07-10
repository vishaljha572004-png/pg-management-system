import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, ShieldCheck, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const ProfileVerification = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    police_status: 'pending'
  });

  const [files, setFiles] = useState({
    police_document: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile/my-profile');
        if (data.profile_status === 'approved' || data.status === 'verified' || data.status === 'active') {
          navigate('/dashboard');
        }
        setProfile(data);
      } catch (_error) {
        // Handle 404 naturally since no profile might exist yet
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, field) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setFiles({ ...files, [field]: selected });
    }
  };

  const validateForm = () => {
    if (!profile.father_mobile && !profile.mother_mobile) {
      toast.error('Please provide at least one parent mobile number');
      return false;
    }
    
    if (profile.police_status === 'submitted') {
      const needsDoc = !profile.police_document && !files.police_document;
      if (needsDoc) {
        toast.error('Please upload your police verification document');
        return false;
      }
    }
    
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    
    try {
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (profile[key] !== null && profile[key] !== undefined) {
          let val = profile[key];
          if (typeof val === 'string' && val.includes('T') && (key.includes('date') || key === 'dob')) {
            val = val.split('T')[0];
          }
          formData.append(key, val);
        }
      });

      Object.keys(files).forEach(key => {
        if (files[key]) formData.append(key, files[key]);
      });

      formData.append('submitForVerification', true);

      await api.post('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Profile submitted for Admin Verification!');
      navigate('/dashboard'); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  if (profile.profile_status === 'submitted') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-warning/20 text-warning rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verification Submitted</h2>
          <p className="text-muted-foreground mb-6">
            Your details are currently awaiting admin verification. You will be notified once approved.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setProfile({ ...profile, profile_status: 'incomplete' })}>
              Edit Details
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/dashboard" className="inline-flex items-center text-primary hover:underline font-medium">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      {profile.profile_status === 'rejected' && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-4">
            <AlertCircle className="text-destructive mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-destructive">Verification Rejected</h3>
              <p className="text-sm mt-1">{profile.rejection_reason || 'Please review your details and re-submit.'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="bg-primary p-8 text-primary-foreground text-center">
          <ShieldCheck size={48} className="mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold">Quick Verification</h1>
          <p className="mt-2 text-primary-foreground/80">Just a few essential details required by the administration.</p>
        </div>

        <CardContent className="p-8">
          <form onSubmit={onSubmit} className="space-y-8">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold border-b pb-2">Parent/Guardian Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Father's Mobile</label>
                    <Input type="text" name="father_mobile" value={profile.father_mobile || ''} onChange={handleInputChange} placeholder="10-digit number" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Mother's Mobile</label>
                    <Input type="text" name="mother_mobile" value={profile.mother_mobile || ''} onChange={handleInputChange} placeholder="10-digit number" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold border-b pb-2">Police Verification</h2>
                <div className="bg-muted/50 border p-6 rounded-2xl">
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-1 block">Do you have a Police Verification Document?</label>
                    <select 
                      name="police_status" 
                      value={profile.police_status || 'pending'} 
                      onChange={handleInputChange} 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="pending">No, I'll provide it later</option>
                      <option value="submitted">Yes, I have it</option>
                    </select>
                  </div>

                  {profile.police_status === 'submitted' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Verification Number</label>
                        <Input type="text" name="police_verification_number" value={profile.police_verification_number || ''} onChange={handleInputChange} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Police Station Name</label>
                        <Input type="text" name="police_station_name" value={profile.police_station_name || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="md:col-span-2 mt-2">
                        <FileUploadBox label="Upload Police Certificate (Required)" field="police_document" current={profile.police_document} file={files.police_document} onChange={handleFileChange} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={saving} size="lg" className="min-w-[200px]">
                {saving ? 'Processing...' : 'Submit Details'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const FileUploadBox = ({ label, field, current, file, onChange }) => (
  <div className="border-2 border-dashed border-input rounded-xl p-6 text-center hover:bg-muted/50 transition-colors">
    <p className="font-semibold mb-3 text-sm">{label}</p>
    {file ? (
      <div className="bg-success/10 p-3 rounded-lg inline-flex items-center text-success font-bold text-sm">
        <CheckCircle size={16} className="mr-2" /> Selected: {file.name.substring(0, 15)}...
      </div>
    ) : current ? (
      <div className="bg-primary/10 p-3 rounded-lg inline-flex items-center text-primary font-bold text-sm">
        <CheckCircle size={16} className="mr-2" /> Document Uploaded
      </div>
    ) : (
      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium transition-colors hover:bg-secondary/80">
        <Upload size={16} className="mr-2" /> Browse File
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onChange(e, field)} />
      </label>
    )}
  </div>
);

export default ProfileVerification;
