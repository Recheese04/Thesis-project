import { Users, Activity, ShieldCheck, TrendingUp, LayoutDashboard } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, grad }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-5 text-white shadow-md`}>
      <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-8 w-36 h-36 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">{label}</p>
          <p className="text-4xl font-extrabold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Welcome back, {user?.first_name || 'Admin'}! 👋</h1>
            <p className="text-slate-500 text-xs mt-0.5">Here's what's happening with your system today.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="1,284" icon={Users} sub="+12% from last month" grad="from-[#0f2d5e] to-[#1a4a8a]" />
        <StatCard label="Active Sessions" value="432" icon={Activity} sub="+5% from last month" grad="from-[#1e4db7] to-[#3b6fd4]" />
        <StatCard label="Security Alerts" value="0" icon={ShieldCheck} sub="System is stable" grad="from-[#10b981] to-[#34d399]" />
        <StatCard label="Growth" value="18%" icon={TrendingUp} sub="+2% from last month" grad="from-[#2563eb] to-[#5b9ef7]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 border border-slate-200/60 rounded-2xl shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2">Recent Activity</h3>
          <p className="text-slate-500 text-sm">No recent logs to display.</p>
        </div>
      </div>
    </div>
  );
}