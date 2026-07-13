import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { DoorClosed, BedDouble, Plus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchRoomsAndStudents = async () => {
    try {
      const [roomRes, studentRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/rooms/unassigned-students')
      ]);
      setRooms(roomRes.data);
      setUnassignedStudents(studentRes.data);
    } catch (error) {
      console.error("Fetch Rooms Error:", error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndStudents();
  }, []);

  const handleCreateRoom = async (data) => {
    try {
      await api.post('/rooms', data);
      toast.success('Room created successfully');
      reset();
      fetchRoomsAndStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    }
  };

  const handleAssignBed = async (bedId, studentId) => {
    if (!studentId) return;
    try {
      await api.post('/rooms/assign-bed', { bed_id: bedId, student_id: studentId });
      toast.success('Bed assigned successfully');
      fetchRoomsAndStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign bed');
    }
  };

  const handleUnassignBed = async (bedId) => {
    try {
      await api.post('/rooms/unassign-bed', { bed_id: bedId });
      toast.success('Bed unassigned successfully');
      fetchRoomsAndStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unassign bed');
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <DoorClosed size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
            <p className="text-muted-foreground mt-1">Create rooms, manage beds, and assign students.</p>
          </div>
        </div>
      </div>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Add New Room
          </CardTitle>
          <CardDescription>Configure a new room and its bed capacity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreateRoom)} className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">Room Number</label>
              <Input 
                {...register('room_number', { required: 'Required' })} 
                placeholder="e.g. 101" 
              />
              {errors.room_number && <span className="text-xs text-destructive mt-1">{errors.room_number.message}</span>}
            </div>
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">Capacity (Beds)</label>
              <Input 
                type="number" 
                {...register('capacity', { required: 'Required', min: 1 })} 
                placeholder="e.g. 2" 
              />
              {errors.capacity && <span className="text-xs text-destructive mt-1">{errors.capacity.message}</span>}
            </div>
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">Rent per Bed (₹)</label>
              <Input 
                type="number" 
                {...register('rent_per_bed', { required: 'Required' })} 
                placeholder="e.g. 5000" 
              />
              {errors.rent_per_bed && <span className="text-xs text-destructive mt-1">{errors.rent_per_bed.message}</span>}
            </div>
            <div className="pt-6">
              <Button type="submit" className="w-full md:w-auto min-w-[120px]">
                Create Room
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rooms.map(room => (
          <Card key={room.id} className="overflow-hidden flex flex-col">
            <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Room {room.room_number}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">₹{room.rent_per_bed}/bed</Badge>
                  <Badge variant={room.status === 'available' ? 'success' : 'destructive'}>
                    {room.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground shadow-sm">
                <Users size={18} />
              </div>
            </div>

            <CardContent className="p-4 space-y-3 flex-grow">
              {room.beds.map(bed => (
                <div key={bed.bed_id} className="flex justify-between items-center p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bed.bed_status === 'available' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                      <BedDouble size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Bed {bed.bed_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {bed.bed_status === 'available' ? 'Available' : bed.student_name}
                      </p>
                    </div>
                  </div>

                  {bed.bed_status === 'available' ? (
                    <select 
                      onChange={(e) => handleAssignBed(bed.bed_id, e.target.value)}
                      className="text-sm flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      defaultValue=""
                    >
                      <option value="" disabled>Assign Student</option>
                      {unassignedStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.room_number ? `(Room ${s.room_number})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                      onClick={() => handleUnassignBed(bed.bed_id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomManagement;
