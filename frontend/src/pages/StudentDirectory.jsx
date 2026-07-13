import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, MoreVertical, LogOut, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { DataTable } from '../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const StudentDirectory = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', phone: '', email: '' });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/admin/students');
        setStudents(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleInviteStudent = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await api.post('/admin/students/invite', inviteData);
      toast.success('Student invited successfully. They can now login.');
      setShowInviteModal(false);
      setInviteData({ name: '', phone: '', email: '' });
      
      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite student');
    } finally {
      setIsInviting(false);
    }
  };

  const handleVacate = async (studentId) => {
    const { value: reason } = await Swal.fire({
      title: 'Vacate Student',
      input: 'text',
      inputLabel: 'Exit Reason',
      inputPlaceholder: 'e.g., Course Completed',
      showCancelButton: true
    });
    if (reason) {
      try {
        await api.post(`/admin/students/${studentId}/vacate`, { exit_reason: reason });
        toast.success('Student vacated successfully');
        setStudents(students.map(s => s.id === studentId ? { ...s, status: 'vacated', room_number: null, bed_number: null } : s));
      } catch (_) {
        toast.error('Failed to vacate student');
      }
    }
  };

  const handleRemove = async (studentId) => {
    const { value: type } = await Swal.fire({
      title: 'Remove Student',
      input: 'select',
      inputOptions: {
        'soft': 'Soft Delete (Disable login only)',
        'permanent': 'Permanent Delete (Wipe all data)'
      },
      inputPlaceholder: 'Select remove type',
      showCancelButton: true
    });
    if (type) {
      try {
        await api.post(`/admin/students/${studentId}/remove`, { type });
        toast.success(`Student removed (${type})`);
        if (type === 'permanent') {
          setStudents(students.filter(s => s.id !== studentId));
        } else {
          setStudents(students.map(s => s.id === studentId ? { ...s, status: 'removed', room_number: null, bed_number: null } : s));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to remove student');
      }
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone',
      sortable: false,
      cell: (row) => <span className="text-muted-foreground">{row.phone || 'N/A'}</span>
    },
    {
      header: 'Room',
      accessor: 'room_number',
      sortable: true,
      cell: (row) => (
        <span className="font-medium">
          {row.room_number ? `${row.room_number} - ${row.bed_number}` : 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => {
        let variant = 'default';
        let label = 'Unknown';
        
        if (row.status === 'vacated') { variant = 'warning'; label = 'Vacated'; }
        else if (row.status === 'removed') { variant = 'destructive'; label = 'Removed'; }
        else if (row.room_number) { variant = 'success'; label = 'Resident'; }
        else { variant = 'secondary'; label = 'Pending Allocation'; }

        return <Badge variant={variant}>{label}</Badge>;
      }
    },
    {
      header: 'Rent',
      accessor: 'rent_per_bed',
      sortable: true,
      cell: (row) => row.rent_per_bed ? `₹${row.rent_per_bed}/mo` : '-'
    },
    {
      header: 'Joined',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground text-sm">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleVacate(row.id); }} disabled={row.status === 'vacated' || row.status === 'removed'}>
            <LogOut className="h-4 w-4 mr-1" /> Vacate
          </Button>
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleRemove(row.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
            <p className="text-muted-foreground mt-1">Manage all registered residents.</p>
          </div>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          Invite Student
        </Button>
      </div>

      {showInviteModal && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Invite New Student</CardTitle>
                <CardDescription>Send an invitation to a new student to join your PG.</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteStudent} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={inviteData.name}
                  onChange={e => setInviteData({...inviteData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input 
                  type="tel" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={inviteData.phone}
                  onChange={e => setInviteData({...inviteData, phone: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (Optional)</label>
                <input 
                  type="email" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={inviteData.email}
                  onChange={e => setInviteData({...inviteData, email: e.target.value})}
                />
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? 'Inviting...' : 'Send Invitation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>A comprehensive list of all students registered in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={students} 
            searchPlaceholder="Search by name, email, or room..."
            itemsPerPage={10}
          />
        </CardContent>
      </Card>
      
    </div>
  );
};

export default StudentDirectory;
