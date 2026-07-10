import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareWarning, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { DataTable } from '../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/admin');
      setComplaints(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (data) => {
    try {
      await api.post('/complaints/admin/update', {
        complaint_id: selectedComplaint.id,
        status: data.status,
        resolution_remark: data.resolution_remark
      });
      toast.success('Complaint updated successfully');
      setSelectedComplaint(null);
      reset();
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update complaint');
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Student',
      accessor: 'student_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.student_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.room_number ? `Room ${row.room_number} - Bed ${row.bed_number}` : 'Unassigned'}
          </p>
        </div>
      )
    },
    {
      header: 'Issue',
      accessor: 'title',
      sortable: true,
      cell: (row) => (
        <div className="max-w-[300px]">
          <p className="font-semibold truncate">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate">{row.description}</p>
          {row.resolution_remark && (
            <p className="text-xs text-success mt-1 truncate border-l-2 border-success pl-2">
              Note: {row.resolution_remark}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => {
        let variant = 'default';
        let icon = null;
        if (row.status === 'resolved') {
          variant = 'success';
          icon = <CheckCircle size={12} />;
        } else if (row.status === 'in_progress') {
          variant = 'warning';
          icon = <Wrench size={12} />;
        } else {
          variant = 'destructive';
          icon = <Clock size={12} />;
        }
        return (
          <Badge variant={variant} className="flex w-fit items-center gap-1">
            {icon}
            {row.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      }
    },
    {
      header: 'Action',
      accessor: 'actions',
      sortable: false,
      cell: (row) => {
        if (row.status !== 'resolved') {
          return (
            <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(row)}>
              Update
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">Closed</span>;
      }
    }
  ];

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <MessageSquareWarning size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complaint Resolution</h1>
            <p className="text-muted-foreground mt-1">Manage and resolve student issues.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>Track the status and resolution of issues reported by students.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={complaints} 
            searchPlaceholder="Search by title, student, or room..."
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      {/* Update Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card text-card-foreground border rounded-2xl p-6 w-full max-w-md shadow-lg"
            >
              <h3 className="text-xl font-bold mb-4">Update Complaint</h3>
              <p className="text-sm text-muted-foreground mb-6 font-medium">Ticket: <span className="text-foreground">{selectedComplaint.title}</span></p>
              
              <form onSubmit={handleSubmit(handleUpdateStatus)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select 
                    {...register('status', { required: true })} 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={selectedComplaint.status}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Resolution Remark (Optional)</label>
                  <textarea 
                    {...register('resolution_remark')} 
                    rows="3"
                    placeholder="e.g. Plumber fixed the tap..." 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => {setSelectedComplaint(null); reset();}}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Status
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintManagement;
