import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Zap, CheckCircle, Clock } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const ElectricityBilling = () => {
  const [bills, setBills] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchBillsAndRooms = async () => {
    try {
      const [billsRes, roomsRes] = await Promise.all([
        api.get('/electricity'),
        api.get('/rooms')
      ]);
      setBills(billsRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillsAndRooms();
  }, []);

  const handleAddBill = async (data) => {
    try {
      await api.post('/electricity', data);
      toast.success('Bill added successfully');
      reset();
      fetchBillsAndRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add bill');
    }
  };

  const handleMarkPaid = async (billId) => {
    try {
      await api.post('/electricity/pay', { bill_id: billId });
      toast.success('Bill marked as paid');
      fetchBillsAndRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Room No',
      accessor: 'room_number',
      sortable: true,
      cell: (row) => <span className="font-bold">{row.room_number}</span>
    },
    {
      header: 'Month',
      accessor: 'billing_month',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.billing_month}</span>
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{new Date(row.due_date).toLocaleDateString()}</span>
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => <span className="font-semibold">₹{row.amount}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'paid' ? 'success' : 'warning'} className="flex w-fit items-center gap-1">
          {row.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
          {row.status.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Action',
      accessor: 'actions',
      sortable: false,
      cell: (row) => {
        if (row.status !== 'paid') {
          return (
            <Button size="sm" onClick={() => handleMarkPaid(row.id)}>
              Mark Paid
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">Cleared</span>;
      }
    }
  ];

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Electricity Billing</h1>
            <p className="text-muted-foreground mt-1">Add and manage electricity bills for rooms.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Add New Bill
          </CardTitle>
          <CardDescription>Record a new electricity bill for a specific room.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleAddBill)} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
            <div>
              <label className="text-sm font-medium mb-1 block">Room</label>
              <select 
                {...register('room_id', { required: 'Required' })} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                defaultValue=""
              >
                <option value="" disabled>Select Room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.room_number}</option>
                ))}
              </select>
              {errors.room_id && <span className="text-xs text-destructive mt-1">{errors.room_id.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
              <Input 
                type="number" 
                {...register('amount', { required: 'Required' })} 
                placeholder="e.g. 1500" 
              />
              {errors.amount && <span className="text-xs text-destructive mt-1">{errors.amount.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Month</label>
              <Input 
                {...register('billing_month', { required: 'Required' })} 
                placeholder="e.g. August 2026" 
              />
              {errors.billing_month && <span className="text-xs text-destructive mt-1">{errors.billing_month.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Due Date</label>
              <Input 
                type="date" 
                {...register('due_date', { required: 'Required' })} 
              />
              {errors.due_date && <span className="text-xs text-destructive mt-1">{errors.due_date.message}</span>}
            </div>
            <div className="pt-6">
              <Button type="submit" className="w-full">
                Add Bill
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bills List</CardTitle>
          <CardDescription>View and manage all electricity bills.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={bills} 
            searchPlaceholder="Search by room, month, or amount..."
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

    </div>
  );
};

export default ElectricityBilling;
