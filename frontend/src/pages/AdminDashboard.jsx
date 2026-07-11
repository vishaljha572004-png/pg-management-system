import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Users, 
  BedDouble, 
  FileWarning, 
  Wallet, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck,
  TrendingUp,
  Activity,
  Copy,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingVerification: 0,
    vacatedStudents: 0,
    removedStudents: 0,
    pendingPoliceVerification: 0,
    totalRooms: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    pendingRentCount: 0,
    totalPendingAmount: 0,
    openComplaints: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        fill: true,
        label: 'Revenue',
        data: [120000, 190000, 150000, 220000, 180000, 280000, stats.monthlyRevenue || 300000],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { borderDash: [4, 4] } },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    maintainAspectRatio: false
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: `₹${stats.monthlyRevenue}`,
      subtext: "+12% from last month",
      icon: <Wallet className="w-5 h-5 text-primary" />,
      trend: "up"
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      subtext: `${stats.pendingVerification} pending verification`,
      icon: <Users className="w-5 h-5 text-primary" />,
      trend: "neutral"
    },
    {
      title: "Available Beds",
      value: stats.availableBeds,
      subtext: `${stats.occupiedBeds} currently occupied`,
      icon: <BedDouble className="w-5 h-5 text-primary" />,
      trend: "neutral"
    },
    {
      title: "Pending Dues",
      value: `₹${stats.totalPendingAmount}`,
      subtext: `Across ${stats.pendingRentCount} students`,
      icon: <TrendingUp className="w-5 h-5 text-destructive" />,
      trend: "down"
    }
  ];

  const actionCards = [
    { title: "Verifications", icon: <UserCheck size={20} />, count: stats.pendingVerification, path: "/admin/tenant-verification", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Police Ver.", icon: <ShieldCheck size={20} />, count: stats.pendingPoliceVerification, path: "/admin/tenant-verification", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Complaints", icon: <FileWarning size={20} />, count: stats.openComplaints, path: "/admin/complaints", color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Pending Rent", icon: <Wallet size={20} />, count: stats.pendingRentCount, path: "/admin/rent", color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            {stats.pgName || 'PG Management'}
          </h1>
          <p className="text-muted-foreground mt-1">Share this code with your students to register.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center sm:items-end">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Organization Code</span>
          <div className="flex items-center">
            <span className="text-3xl font-black text-primary tracking-widest">{stats.orgCode || '----'}</span>
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3 ml-4">
              <button 
                onClick={() => {
                  const code = stats.orgCode || '';
                  if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(code).then(() => toast.success('Code copied to clipboard!'));
                  } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = code;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      toast.success('Code copied to clipboard!');
                    } catch (err) {
                      toast.error('Failed to copy');
                    }
                    document.body.removeChild(textArea);
                  }
                }}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="Copy Code"
              >
                <Copy size={18} />
              </button>
              <button 
                onClick={() => {
                  const text = `Join our PG on the PG Management App!\n\nOrganization Code: ${stats.orgCode || ''}`;
                  if (navigator.share && window.isSecureContext) {
                    navigator.share({ title: 'Join our PG', text }).catch(console.error);
                  } else {
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(text).then(() => toast.success('Share text copied!'));
                    } else {
                      const textArea = document.createElement("textarea");
                      textArea.value = text;
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        toast.success('Share text copied!');
                      } catch (err) {}
                      document.body.removeChild(textArea);
                    }
                  }
                }}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="Share Code"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {kpi.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly collection performance across all properties.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Action Center</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionCards.map((action, i) => (
              <Link key={i} to={action.path}>
                <div className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all cursor-pointer mb-2">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${action.bg} ${action.color}`}>
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{action.title}</h4>
                      <p className="text-xs text-muted-foreground">{action.count} pending items</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
            
            <div className="pt-4 border-t">
              <Link to="/admin/reports">
                <Button className="w-full" variant="outline">
                  <Activity className="mr-2 h-4 w-4" /> Generate Full Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
