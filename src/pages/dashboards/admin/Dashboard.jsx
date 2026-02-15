import { Users, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-syne">Welcome back, {user?.first_name}!</h1>
        <p className="text-slate-400">Here's what's happening with your system today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="1,284" icon={Users} trend="+12%" />
        <StatCard title="Active Sessions" value="432" icon={Activity} trend="+5%" />
        <StatCard title="Security Alerts" value="0" icon={ShieldCheck} trend="Stable" />
        <StatCard title="Growth" value="18%" icon={TrendingUp} trend="+2%" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          {/* Activity component would go here */}
          <p className="text-slate-500 text-sm">No recent logs to display.</p>
        </div>
      </div>
    </div>
  );
}