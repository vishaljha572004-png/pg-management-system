import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, CalendarDays, Download, IndianRupee } from 'lucide-react';
import { generateReceipt } from '../utils/ReceiptGenerator';
import { DataTable } from '../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const RentCollection = () => {
  const [rentRecords, setRentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { register: regGenerate, handleSubmit: handleGenSubmit, reset: resetGen, formState: { isSubmitting: isGenSubmitting } } = useForm();
  const { register: regPay, handleSubmit: handlePaySubmit, reset: resetPay, formState: { isSubmitting: isPaySubmitting } } = useForm();

  const [selectedRent, setSelectedRent] = useState(null);

  const fetchRentRecords = async () => {
    try {
      const response = await api.get('/rent');
      setRentRecords(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch rent records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentRecords();
  }, []);

  const onGenerate = async (data) => {
    try {
      const response = await api.post('/rent/generate', data);
      toast.success(response.data.message);
      resetGen();
      fetchRentRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate rent');
    }
  };

  const onPay = async (data) => {
    try {
      await api.post('/rent/pay', { payment_id: selectedRent.id, transaction_id: data.transaction_id });
      toast.success('Rent marked as paid successfully');
      setSelectedRent(null);
      resetPay();
      fetchRentRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment update failed');
    }
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: 'student_name',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.student_name}</span>
    },
    {
      header: 'Room/Bed',
      accessor: 'room_number',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.room_number} - {row.bed_number}</span>
    },
    {
      header: 'Month',
      accessor: 'billing_month',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.billing_month}</span>
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
            <Button size="sm" onClick={() => setSelectedRent(row)}>
              Mark Paid
            </Button>
          );
        }
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="text-xs text-muted-foreground">Trx: {row.transaction_id || 'N/A'}</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => generateReceipt({ ...row, type: 'rent' })}>
              <Download size={14} className="mr-1" /> Receipt
            </Button>
          </div>
        );
      }
    }
  ];

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <IndianRupee size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rent Collection</h1>
            <p className="text-muted-foreground mt-1">Generate monthly bills and collect payments.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Generate Monthly Rent
            </CardTitle>
            <CardDescription className="mt-1">Creates pending invoices for all occupied beds.</CardDescription>
          </div>
          <form onSubmit={handleGenSubmit(onGenerate)} className="flex w-full md:w-auto gap-3">
            <Input 
              {...regGenerate('billing_month', { required: true })} 
              placeholder="e.g. August 2026" 
              className="w-full md:w-[200px]"
            />
            <Button type="submit" disabled={isGenSubmitting}>
              {isGenSubmitting ? 'Generating...' : 'Generate'}
            </Button>
          </form>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rent Records</CardTitle>
          <CardDescription>Overview of all generated rent invoices and their statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={rentRecords} 
            searchPlaceholder="Search by student name, room, or month..."
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedRent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card text-card-foreground border rounded-2xl p-6 w-full max-w-md shadow-lg relative"
            >
              <h3 className="text-xl font-bold mb-2">Process Payment</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Collecting <span className="font-semibold text-foreground">₹{selectedRent.amount}</span> from <span className="font-semibold text-foreground">{selectedRent.student_name}</span>.
              </p>
              
              <form onSubmit={handlePaySubmit(onPay)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Transaction ID (Optional)</label>
                  <Input 
                    {...regPay('transaction_id')} 
                    placeholder="e.g. CASH or UPI Ref No" 
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => {setSelectedRent(null); resetPay();}}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPaySubmitting}>
                    {isPaySubmitting ? 'Processing...' : 'Confirm Payment'}
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

export default RentCollection;
