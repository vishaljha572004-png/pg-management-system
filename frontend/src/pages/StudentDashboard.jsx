import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Home, 
  IndianRupee, 
  Zap, 
  MessageSquareWarning, 
  ShieldCheck,
  Bell,
  CheckCircle2,
  Megaphone,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    roomInfo: null,
    latestRent: null,
    activeComplaints: 0,
    latestElectricity: null
  });
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardRes, noticesRes, notifRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/notices'),
          api.get('/notifications')
        ]);
        setData(dashboardRes.data);
        setNotices(noticesRes.data);
        setNotifications(notifRes.data.notifications || []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  const { roomInfo, latestRent, activeComplaints, latestElectricity } = data;

  const cards = [
    {
      title: "My Room",
      value: roomInfo ? `Room ${roomInfo.room_number}` : "Not Assigned",
      subtext: roomInfo ? `Bed ${roomInfo.bed_number}` : "Please contact admin",
      icon: <Home className="w-5 h-5 text-primary" />,
    },
    {
      title: "Rent Status",
      value: latestRent ? `₹${latestRent.amount}` : "No Dues",
      subtext: latestRent ? `Status: ${latestRent.status} (${latestRent.billing_month})` : "All cleared",
      icon: <IndianRupee className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: "Electricity Bill",
      value: latestElectricity ? `₹${latestElectricity.amount}` : "No Bill Yet",
      subtext: latestElectricity ? `Status: ${latestElectricity.status}` : "All cleared",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
    },
    {
      title: "Active Complaints",
      value: activeComplaints,
      subtext: "Open tickets",
      icon: <MessageSquareWarning className="w-5 h-5 text-destructive" />,
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 px-8 py-10 shadow-lg flex justify-between items-start">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-student" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-student)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-zinc-400 max-w-xl">
            Here's a quick overview of your PG stay. Don't forget to pay your dues on time to avoid late fees.
          </p>
        </div>

        <div className="relative z-10 group">
          <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white" size="icon">
            <div className="flex flex-col gap-1 items-center justify-center p-1">
              <div className="w-1 h-1 bg-current rounded-full" />
              <div className="w-1 h-1 bg-current rounded-full" />
              <div className="w-1 h-1 bg-current rounded-full" />
            </div>
          </Button>
          <div className="absolute right-0 mt-2 w-48 rounded-md bg-popover text-popover-foreground shadow-md border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <Link to="/student/profile" className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Link>
            <Link to="/verify-profile" className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify Profile
            </Link>
          </div>
        </div>
      </div>

      {}
      {(data.profile_status !== 'approved' || data.police_status !== 'approved') && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.profile_status !== 'approved' && (
            <Card className={`border-l-4 ${data.profile_status === 'rejected' ? 'border-l-destructive bg-destructive/5' : 'border-l-amber-500'}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${data.profile_status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>
                    <MessageSquareWarning size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Profile Verification {data.profile_status === 'rejected' ? 'Rejected' : 'Pending'}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">Status: <span className={`font-medium capitalize ${data.profile_status === 'rejected' ? 'text-destructive' : 'text-amber-600 dark:text-amber-500'}`}>{data.profile_status}</span></p>
                  </div>
                </div>
                <Link to="/verify-profile">
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {data.profile_status === 'approved' && data.police_status !== 'approved' && (
             <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Police Verification Pending</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">Status: <span className="font-medium capitalize text-blue-600 dark:text-blue-500">{data.police_status}</span></p>
                  </div>
                </div>
                <Link to="/verify-profile">
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </CardContent>
             </Card>
          )}
        </div>
      )}

      {}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={18} className="text-primary" /> My Notifications
            </CardTitle>
            <CardDescription>Alerts regarding your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">No new notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl border ${!n.is_read ? 'bg-background border-primary/30' : 'bg-muted/50 border-transparent'}`}>
                    <h4 className="font-bold text-sm">{n.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <span className="text-[10px] text-muted-foreground block mt-2">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone size={20} className="text-primary" />
                  Notice Board
                </CardTitle>
                <CardDescription>Important updates from administration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 size={40} className="mb-3 text-muted" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} className="relative p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                    {notice.is_pinned && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive flex items-center justify-center shadow-sm">
                        <span className="text-[10px] text-white">📌</span>
                      </div>
                    )}
                    <h4 className="font-bold text-sm mb-1">{notice.title}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{notice.description}</p>
                    <p className="text-xs text-muted-foreground/60 mt-3">{new Date(notice.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
