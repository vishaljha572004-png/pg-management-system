import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import toast from 'react-hot-toast';
import api from '../services/api';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pgs'); 
  
  
  const [pgs, setPGs] = useState([]);
  const [showCreatePG, setShowCreatePG] = useState(false);
  const [pgFormData, setPgFormData] = useState({ name: '', owner_name: '', contact_number: '', email: '' });
  
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  
  const [selectedHostelId, setSelectedHostelId] = useState(null);
  const [hostelDetails, setHostelDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  
  
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

  const handleViewHostelDetails = async (id) => {
    setSelectedHostelId(id);
    setIsDetailsLoading(true);
    setHostelDetails(null);
    try {
      const response = await api.get(`/super-admin/pgs/${id}`);
      setHostelDetails(response.data);
    } catch (error) {
      toast.error('Failed to load hostel details');
    } finally {
      setIsDetailsLoading(false);
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
          Registered Hostels
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
            <h2 className="text-xl font-semibold">Registered Hostels</h2>
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
            <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-border">
              <Input 
                placeholder="Search by Hostel Name, Org Code, Admin Name or Email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <select
                className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-400">
                  <tr>
                    <th className="px-6 py-3">Hostel Info</th>
                    <th className="px-6 py-3">Admin Details</th>
                    <th className="px-6 py-3">Students</th>
                    <th className="px-6 py-3">Rooms/Beds</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pgs
                    .filter(pg => {
                      const searchStr = `${pg.name} ${pg.org_code} ${pg.admin_name} ${pg.admin_email}`.toLowerCase();
                      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === 'all' || pg.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(pg => (
                    <tr key={pg.id} className="border-b dark:border-zinc-700 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{pg.name}</div>
                        <div className="font-mono text-xs text-primary font-bold mt-1">Code: {pg.org_code}</div>
                        <div className="text-xs text-muted-foreground mt-1">Since {new Date(pg.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {pg.admin_name ? (
                          <>
                            <div className="font-medium text-foreground">{pg.admin_name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{pg.admin_email}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{pg.admin_phone}</div>
                          </>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">No Admin Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {pg.total_students}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs"><span className="font-medium text-foreground">{pg.total_rooms}</span> Rooms</div>
                        <div className="text-xs mt-1"><span className="font-medium text-emerald-600">{pg.available_rooms}</span> Available</div>
                        <div className="text-xs mt-1"><span className="font-medium text-blue-600">{pg.occupied_rooms}</span> Occupied</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pg.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {pg.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-y-2 flex flex-col items-end">
                        <Button variant="default" size="sm" onClick={() => handleViewHostelDetails(pg.id)} className="w-full sm:w-auto">
                          View Details
                        </Button>
                        <div className="flex gap-3 text-xs">
                          <button onClick={() => handleUpdatePGStatus(pg.id, pg.status)} className="text-blue-600 hover:underline font-medium">
                            {pg.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeletePG(pg.id)} className="text-red-600 hover:underline font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pgs.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">No hostels registered yet.</td></tr>}
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
                  <PasswordInput autoComplete="new-password" placeholder="Password" value={adminFormData.password} onChange={e => setAdminFormData({...adminFormData, password: e.target.value})} required />
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

      {}
      {selectedHostelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-background w-full max-w-4xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-semibold">Hostel Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedHostelId(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isDetailsLoading ? (
                <div className="flex justify-center items-center h-40">Loading details...</div>
              ) : hostelDetails ? (
                <div className="space-y-8">
                  
                  {}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Hostel Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{hostelDetails.hostel.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Organization Code</span>
                          <span className="font-mono text-primary font-bold">{hostelDetails.hostel.org_code}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Status</span>
                          <span className="capitalize font-medium">{hostelDetails.hostel.status}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-muted-foreground">Registered On</span>
                          <span className="font-medium">{new Date(hostelDetails.hostel.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-muted p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-foreground">{hostelDetails.hostel.total_students}</div>
                          <div className="text-xs text-muted-foreground">Students</div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-foreground">{hostelDetails.hostel.total_rooms}</div>
                          <div className="text-xs text-muted-foreground">Rooms</div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center border border-emerald-100 dark:border-emerald-800">
                          <div className="text-2xl font-bold text-emerald-600">{hostelDetails.hostel.available_rooms}</div>
                          <div className="text-xs text-emerald-600/80">Available Beds</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600">{hostelDetails.hostel.occupied_rooms}</div>
                          <div className="text-xs text-blue-600/80">Occupied Beds</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {}
                  <div>
                    <h4 className="text-md font-semibold mb-3 border-b pb-1">Administrators</h4>
                    {hostelDetails.admins.length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                        {hostelDetails.admins.map(admin => (
                          <div key={admin.id} className="border p-3 rounded-lg flex justify-between items-center bg-card">
                            <div>
                              <div className="font-medium text-sm">{admin.name}</div>
                              <div className="text-xs text-muted-foreground">{admin.email}</div>
                              <div className="text-xs text-muted-foreground">{admin.phone}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {admin.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No admins registered for this hostel.</p>
                    )}
                  </div>

                  {}
                  <div>
                    <h4 className="text-md font-semibold mb-3 border-b pb-1 flex justify-between">
                      <span>Registered Students</span>
                      <span className="text-xs font-normal bg-muted px-2 py-1 rounded-full">{hostelDetails.students.length} found</span>
                    </h4>
                    {hostelDetails.students.length > 0 ? (
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Contact</th>
                              <th className="px-3 py-2">Room / Bed</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hostelDetails.students.map(student => (
                              <tr key={student.id} className="border-t hover:bg-muted/50">
                                <td className="px-3 py-2 font-medium">{student.name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{student.phone}<br/>{student.email}</td>
                                <td className="px-3 py-2">
                                  {student.room_number ? `R${student.room_number} / B${student.bed_number}` : <span className="text-amber-600">Unassigned</span>}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={student.status === 'active' ? 'text-green-600' : 'text-red-600'}>{student.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No students registered yet.</p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center text-red-500">Failed to load data.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
