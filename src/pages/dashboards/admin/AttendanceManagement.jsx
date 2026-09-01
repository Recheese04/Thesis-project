import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  ClipboardList, Loader2, Search, X, RefreshCw,
  Users, Calendar, CheckCircle2, QrCode, CreditCard, Hand,
  LogIn, LogOut, BarChart3, Activity, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useSchoolYear } from "@/context/SchoolYearContext";

const authH = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const fmt = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-PH", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const TYPE_COLORS = {
  QR: "bg-blue-50 text-blue-700 border-blue-200",
  RFID: "bg-violet-50 text-violet-700 border-violet-200",
  manual: "bg-amber-50 text-amber-700 border-amber-200",
};
const TYPE_ICONS = { QR: QrCode, RFID: CreditCard, manual: Hand };

const STATUS_COLORS = {
  checked_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  checked_out: "bg-slate-100 text-slate-500 border-slate-200",
};

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, grad }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-5 text-white shadow-md`}>
      <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-8 w-36 h-36 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">{label}</p>
          <p className="text-4xl font-extrabold tracking-tight">{value ?? "—"}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page (View-Only) ──────────────────────────────────────────────────
export default function AttendanceManagement() {
  const [events, setEvents] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState("");
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { selectedYearId } = useSchoolYear();

  // ── Fetch events ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingBase(true);
      try {
        const evRes = await axios.get(`/api/events?school_year_id=${selectedYearId}`, authH());
        setEvents(evRes.data);
        if (evRes.data.length) setSelectedEvent(String(evRes.data[0].id));
        else setSelectedEvent("");
      } catch {
        toast.error("Failed to load events.");
      } finally {
        setLoadingBase(false);
      }
    })();
  }, [selectedYearId]);

  // ── Fetch attendance per event ─────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!selectedEvent) { setRecords([]); setStats(null); return; }
    setLoadingAtt(true);
    try {
      const res = await axios.get(`/api/attendance/event/${selectedEvent}`, authH());
      setRecords(res.data.attendance ?? res.data);
      setStats(res.data.stats ?? null);
    } catch {
      toast.error("Failed to load attendance for this event.");
    } finally {
      setLoadingAtt(false);
    }
  }, [selectedEvent]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const total = stats?.total ?? records.length;
  const checkedIn = stats?.checked_in ?? records.filter(r => r.status === "checked_in").length;
  const checkedOut = stats?.checked_out ?? records.filter(r => r.status === "checked_out").length;
  const qrCount = records.filter(r => r.attendance_type === "QR").length;
  const rfidCount = records.filter(r => r.attendance_type === "RFID").length;
  const manualCount = records.filter(r => r.attendance_type === "manual").length;

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || r.user?.name?.toLowerCase().includes(q)
      || r.remarks?.toLowerCase().includes(q);
    const matchType = filterType === "all" || r.attendance_type === filterType;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const selectedEventObj = events.find(e => String(e.id) === selectedEvent);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Attendance Overview</h1>
              <p className="text-slate-500 text-xs mt-0.5">View student event attendance records</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={fetchAttendance} disabled={loadingAtt}
                className="border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 h-9 w-9 rounded-xl bg-white shadow-sm">
                <RefreshCw className={`w-4 h-4 ${loadingAtt ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>

        {/* Event selector bar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4 h-4 text-[#1e4db7]" />
              <span className="text-sm font-semibold text-slate-700">Viewing Event:</span>
            </div>
            <div className="flex-1 min-w-[220px] max-w-xs">
              {loadingBase ? (
                <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              ) : (
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="border-slate-200 bg-slate-50 h-10 text-sm rounded-xl font-medium">
                    <SelectValue placeholder="Select an event…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {events.map(ev => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {ev.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedEventObj && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1e4db7]" />
                <span className="font-medium text-slate-600">{total}</span>&nbsp;total records
              </div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ClipboardList} label="Total Records" value={total}
            sub={selectedEventObj?.title ?? "All events"}
            grad="from-[#0f2d5e] to-[#1a4a8a]"
          />
          <StatCard
            icon={LogIn} label="Checked In" value={checkedIn}
            sub={`${checkedOut} checked out`}
            grad="from-[#059669] to-[#10b981]"
          />
          <StatCard
            icon={QrCode} label="QR / RFID" value={qrCount + rfidCount}
            sub={`${manualCount} manual`}
            grad="from-[#2563eb] to-[#5b9ef7]"
          />
          <StatCard
            icon={BarChart3} label="Attendance Rate"
            value={total ? `${Math.round((checkedIn / total) * 100)}%` : "—"}
            sub="Currently active"
            grad="from-[#7c3aed] to-[#a78bfa]"
          />
        </div>

        {/* Type breakdown tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: QrCode, label: "QR Code", count: qrCount, bg: "bg-blue-50", ic: "text-blue-600" },
            { Icon: CreditCard, label: "RFID", count: rfidCount, bg: "bg-violet-50", ic: "text-violet-600" },
            { Icon: Hand, label: "Manual", count: manualCount, bg: "bg-amber-50", ic: "text-amber-600" },
          ].map(({ Icon, label, count, bg, ic }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student, remarks…"
                className="pl-9 pr-8 h-8 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="QR">QR Code</SelectItem>
                <SelectItem value="RFID">RFID</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loadingAtt ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-7 h-7 text-[#1e4db7] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No attendance records</h3>
              <p className="text-sm text-slate-400 mt-1">
                {search || filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters."
                  : "No attendance has been recorded for this event yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Time In</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Time Out</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const TypeIcon = TYPE_ICONS[r.attendance_type] || QrCode;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">
                                {r.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{r.user?.name ?? "Unknown"}</p>
                              {r.user?.student_number && (
                                <p className="text-xs text-slate-400 font-mono">{r.user.student_number}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={`text-[10px] font-semibold uppercase px-2 py-0.5 border gap-1 ${TYPE_COLORS[r.attendance_type] || ""}`}>
                            <TypeIcon className="w-3 h-3" />
                            {r.attendance_type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={`text-[10px] font-semibold uppercase px-2 py-0.5 border ${STATUS_COLORS[r.status] || ""}`}>
                            {r.status === "checked_in" ? "In" : "Out"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{fmt(r.time_in)}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{fmt(r.time_out)}</td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs truncate max-w-[160px]">{r.remarks || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loadingAtt && filtered.length > 0 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filtered.length}</strong> of{" "}
              <strong className="text-slate-700">{total}</strong> records
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}