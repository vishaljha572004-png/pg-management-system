import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload, Save, QrCode } from 'lucide-react';
import api, { BASE_URL } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'framer-motion';

const PaymentSettings = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setValue('pg_name', data.pg_name);
        setValue('upi_id', data.upi_id);
        setValue('account_name', data.account_name);
        setValue('payment_mode', data.payment_mode || 'development');
        if (data.qr_image_url) {
          setPreview(`${BASE_URL}${data.qr_image_url}`);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [setValue]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('pg_name', data.pg_name);
      formData.append('upi_id', data.upi_id);
      formData.append('account_name', data.account_name);
      formData.append('payment_mode', data.payment_mode);
      if (file) {
        formData.append('qr_image', file);
      }

      const response = await api.put('/settings', formData);
      
      toast.success(response.data.message || 'Settings saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">PG Settings</h1>
        <p className="text-muted-foreground mt-2">Update your PG name and upload your UPI QR code for rent collection.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold mb-2 block">PG / Property Name</label>
                  <Input 
                    type="text" 
                    {...register('pg_name', { required: 'PG Name is required' })}
                    placeholder="e.g. Royal Stays PG"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">UPI ID</label>
                  <Input 
                    type="text" 
                    {...register('upi_id')}
                    placeholder="e.g. 9876543210@ybl"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Account Holder Name</label>
                  <Input 
                    type="text" 
                    {...register('account_name')}
                    placeholder="e.g. PG Management"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Payment Gateway Mode</label>
                  <select 
                    {...register('payment_mode')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="development">Development Mode (Dummy Payments)</option>
                    <option value="qr_utr">QR + UTR Mode (Manual Verification)</option>
                    <option value="live_gateway" disabled>Live Gateway (Coming Soon)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use Development Mode for testing the premium payment gateway without real money.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">QR Code Image</label>
                <div className="border-2 border-dashed border-input rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                  {preview ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative inline-block w-full max-w-[280px] bg-white rounded-xl shadow-md p-3 mb-6">
                      <img src={preview} alt="QR Code Preview" className="w-full h-auto object-contain block rounded-lg border border-slate-100" />
                      <button type="button" onClick={() => { setPreview(null); setFile(null); }} className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-2 shadow-lg hover:bg-destructive/90 transition-colors z-10">
                        &times;
                      </button>
                    </motion.div>
                  ) : (
                    <QrCode size={48} className="text-muted-foreground mb-4 opacity-50" />
                  )}
                  
                  <label className="cursor-pointer bg-secondary text-secondary-foreground font-medium px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">
                    <Upload size={16} className="inline mr-2" />
                    {preview ? 'Change Image' : 'Upload QR Code'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-3">Upload a clean screenshot of your Google Pay, PhonePe, or Paytm QR.</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                size="lg"
                className="min-w-[200px]"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettings;
