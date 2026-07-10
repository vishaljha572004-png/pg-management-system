import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../services/api';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pgs'); // 'pgs' or 'admins'
  
  // PGs State
  const [pgs, setPGs] = useState([]);
  const [showCreatePG, setShowCreatePG] = useState(false);
  const [pgFormData, setPgFormData] = useState({ name: '', owner_name: '', contact_number: '', email: '' });
  
  // Admins State
  const [admins, setAdmins] = useState([]);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', phone: '', password: '', pg_id: '' });
  
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      if (activeTab === 'pgs') {
        const response = await api.get('/super-admin/pgs');
        setPGs(response.data);
      } else {
        const response = await api.get('/super-admin/admins');
        setAdmins(response.data);
        // Also fetch PGs for dropdown
        const pgResponse = await api.get('/super-admin/pgs');
        setPGs(pgResponse.data);
      }
    } catch (_error) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- PG Handlers ---
  const handleCreatePG = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/super-admin/pgs', pgFormData);
      toast.success('PG created successfully');
      setShowCreatePG(false);
      setPgFormData({ name: '', owner_name: '', contact_number: '', email: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create PG');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePGStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/super-admin/pgs/${id}/status`, { status: newStatus });
      toast.success(`PG ${newStatus} successfully`);
      fetchData();
    } catch (_error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeletePG = async (id) => {
    if (window.confirm('Are you sure you want to delete this PG? This will delete ALL associated data!')) {
      try {
        await api.delete(`/super-admin/pgs/${id}`);
        toast.success('PG deleted successfully');
        fetchData();
      } catch (_error) {
        toast.error('Failed to delete PG');
      }
    }
  };

  // --- Admin Handlers ---
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/super-admin/admins', adminFormData);
      toast.success('Admin created successfully');
      setShowCreateAdmin(false);
      setAdminFormData({ name: '', email: '', phone: '', password: '', pg_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAdminStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/super-admin/admins/${id}/status`, { status: newStatus });
      toast.success(`Admin ${newStatus} successfully`);
      fetchData();
    } catch (_error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await api.delete(`/super-admin/admins/${id}`);
        toast.success('Admin deleted successfully');
        fetchData();
      } catch (_error) {
        toast.error('Failed to delete admin');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage SaaS Tenants (PGs) and their Admins</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-border">
        <button
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pgs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          onClick={() => setActiveTab('pgs')}
        >
          PG Management
        </button>
        <button
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'admins' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          onClick={() => setActiveTab('admins')}
        >
          Admin Management
        </button>
      </div>

      {activeTab === 'pgs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Registered PGs</h2>
            <Button onClick={() => setShowCreatePG(!showCreatePG)}>
              {showCreatePG ? 'Cancel' : 'Register New PG'}
            </Button>
          </div>

          {showCreatePG && (
            <Card>
              <CardHeader>
                <CardTitle>Register New PG</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePG} className="space-y-4 max-w-md">
                  <Input placeholder="PG Name" value={pgFormData.name} onChange={e => setPgFormData({...pgFormData, name: e.target.value})} required />
                  <Input placeholder="Owner Name" value={pgFormData.owner_name} onChange={e => setPgFormData({...pgFormData, owner_name: e.target.value})} required />
                  <Input type="tel" placeholder="Contact Number" value={pgFormData.contact_number} onChange={e => setPgFormData({...pgFormData, contact_number: e.target.value})} required />
                  <Input type="email" placeholder="Email Address" value={pgFormData.email} onChange={e => setPgFormData({...pgFormData, email: e.target.value})} required />
                  <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Register PG'}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-400">
                  <tr>
                    <th className="px-6 py-3">PG Name</th>
                    <th className="px-6 py-3">Org Code</th>
                    <th className="px-6 py-3">Owner</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pgs.map(pg => (
                    <tr key={pg.id} className="border-b dark:border-zinc-700">
                      <td className="px-6 py-4 font-medium text-foreground">{pg.name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-primary">{pg.org_code}</td>
                      <td className="px-6 py-4">{pg.owner_name}<br/><span className="text-xs">{pg.contact_number}</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pg.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {pg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-3">
                        <button onClick={() => handleUpdatePGStatus(pg.id, pg.status)} className="text-blue-600 hover:underline">
                          {pg.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => handleDeletePG(pg.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {pgs.length === 0 && <tr><td colSpan="5" className="px-6 py-4 text-center">No PGs registered yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">PG Admins</h2>
            <Button onClick={() => setShowCreateAdmin(!showCreateAdmin)}>
              {showCreateAdmin ? 'Cancel' : 'Create Admin'}
            </Button>
          </div>

          {showCreateAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select PG</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={adminFormData.pg_id}
                      onChange={e => setAdminFormData({...adminFormData, pg_id: e.target.value})}
                      required
                    >
                      <option value="">Select a PG...</option>
                      {pgs.map(pg => <option key={pg.id} value={pg.id}>{pg.name} ({pg.org_code})</option>)}
                    </select>
                  </div>
                  <Input placeholder="Full Name" value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} required />
                  <Input type="email" placeholder="Email Address" value={adminFormData.email} onChange={e => setAdminFormData({...adminFormData, email: e.target.value})} required />
                  <Input type="tel" placeholder="Phone Number" value={adminFormData.phone} onChange={e => setAdminFormData({...adminFormData, phone: e.target.value})} required />
                  <Input type="password" placeholder="Password" value={adminFormData.password} onChange={e => setAdminFormData({...adminFormData, password: e.target.value})} required />
                  <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Admin'}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-400">
                  <tr>
                    <th className="px-6 py-3">PG Name</th>
                    <th className="px-6 py-3">Admin Name</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.id} className="border-b dark:border-zinc-700">
                      <td className="px-6 py-4">
                        {admin.pg_name || <span className="text-muted-foreground italic">None (Super Admin)</span>}
                        {admin.org_code && <div className="text-xs font-mono text-primary">{admin.org_code}</div>}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{admin.name}</td>
                      <td className="px-6 py-4">{admin.email}<br/><span className="text-xs">{admin.phone}</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-3">
                        <button onClick={() => handleUpdateAdminStatus(admin.id, admin.status)} className="text-blue-600 hover:underline">
                          {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && <tr><td colSpan="5" className="px-6 py-4 text-center">No admins found.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
