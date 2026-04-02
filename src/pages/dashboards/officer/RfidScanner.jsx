import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
    CreditCard, Wifi, WifiOff, CheckCircle2, XCircle, Loader2,
    Calendar, RefreshCw, LogIn, LogOut, Users, Clock, Zap,
    AlertTriangle, Radio, Volume2, VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import AvatarImg from "@/components/Avatar";


// ── Constants ──────────────────────────────────────────────────────────────
const authH = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const MAX_LOG = 50;

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("en-PH", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

function playBeep(success = true) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = success ? 880 : 220;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + (success ? 0.15 : 0.4));
    } catch { /* silent fail */ }
}

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

// ── Main Component ─────────────────────────────────────────────────────────
export default function RfidScanner() {
    // Data
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [loading, setLoading] = useState(true);

    // Scanner
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [mode, setMode] = useState("checkin"); // checkin | checkout
    const [soundOn, setSoundOn] = useState(true);
    const [scanLog, setScanLog] = useState([]);
    const [lastScan, setLastScan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    // Stats
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, checkedOut: 0 });

    // Refs
    const portRef = useRef(null);
    const readerRef = useRef(null);
    const bufferRef = useRef("");
    const modeRef = useRef(mode);

    useEffect(() => { modeRef.current = mode; }, [mode]);

    // ── Load events ────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get("/api/events?role=officer", authH());
                setEvents(res.data);
                if (res.data.length) setSelectedEvent(String(res.data[0].id));
            } catch {
                toast.error("Failed to load events.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Handle Escape key to dismiss overlay ────────────────────────────────
    useEffect(() => {
        if (!showOverlay) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setShowOverlay(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showOverlay]);

    // ── Fetch attendance stats when event changes ──────────────────────────
    const fetchStats = useCallback(async () => {
        if (!selectedEvent) return;
        try {
            const res = await axios.get(`/api/attendance/event/${selectedEvent}`, authH());
            const s = res.data.stats;
            if (s) setStats({ total: s.total, checkedIn: s.checked_in, checkedOut: s.checked_out });
        } catch { /* ignore */ }
    }, [selectedEvent]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Process scanned UID ────────────────────────────────────────────────
    const processUid = useCallback(async (uid) => {
        if (!selectedEvent || processing) return;
        setProcessing(true);

        const currentMode = modeRef.current;
        const endpoint = currentMode === "checkin"
            ? "/api/attendance/rfid-checkin"
            : "/api/attendance/rfid-checkout";

        const entry = {
            id: Date.now(), uid,
            time: new Date().toISOString(),
            status: "processing",
            action: currentMode,
            studentName: "—",
            message: "Processing…",
        };
        setScanLog(prev => [entry, ...prev].slice(0, MAX_LOG));

        try {
            const res = await axios.post(endpoint, {
                event_id: selectedEvent,
                rfid_uid: uid,
            }, authH());

            // 200 with 'Already checked in' is a soft warning, not a hard error
            const isWarning = res.status === 200 && currentMode === "checkin";

            const updated = {
                ...entry,
                status: isWarning ? "warning" : "success",
                action: currentMode,
                studentName: res.data.student_name || "Unknown",
                profilePicture: res.data.profile_picture_url || null,
                studentNumber: res.data.student_number || "",
                course: res.data.course || "",
                yearLevel: res.data.year_level || "",
                message: res.data.message,
            };
            setScanLog(prev => prev.map(e => e.id === entry.id ? updated : e));
            setLastScan(updated);
            setShowOverlay(true);
            if (soundOn) playBeep(!isWarning);
            fetchStats();

        } catch (err) {
            const msg = err.response?.data?.message ?? "Scan failed";
            const updated = {
                ...entry,
                status: "error",
                action: currentMode,
                studentName: err.response?.data?.student_name || "—",
                profilePicture: err.response?.data?.profile_picture_url || null,
                studentNumber: err.response?.data?.student_number || "",
                message: msg,
            };
            setScanLog(prev => prev.map(e => e.id === entry.id ? updated : e));
            setLastScan(updated);
            setShowOverlay(true);
            if (soundOn) playBeep(false);
        } finally {
            setProcessing(false);
        }
    }, [selectedEvent, processing, soundOn, fetchStats]);

    // ── Connect to serial device ───────────────────────────────────────────
    const connectSerial = async () => {
        if (!("serial" in navigator)) {
            toast.error("Web Serial API not supported. Use Chrome or Edge.");
            return;
        }

        setConnecting(true);
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            portRef.current = port;
            setConnected(true);
            toast.success("RFID Scanner connected!");

            const decoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(decoder.writable);
            const reader = decoder.readable.getReader();
            readerRef.current = { reader, readableStreamClosed };

            (async () => {
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        if (value) {
                            bufferRef.current += value;
                            const lines = bufferRef.current.split("\n");
                            bufferRef.current = lines.pop() || "";
                            for (const line of lines) {
                                // aggressively strip any hidden serial bytes, line endings, spaces, etc.
                                // ALSO strip the 'UID' or 'UID:' prefix if the Arduino sends it
                                let rawUid = line.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                if (rawUid.startsWith('UID')) {
                                    rawUid = rawUid.substring(3);
                                }
                                if (rawUid.length >= 4) {
                                    processUid(rawUid);
                                }
                            }
                        }
                    }
                } catch (err) {
                    if (err.name !== "TypeError") {
                        console.error("Serial read error:", err);
                    }
                } finally {
                    reader.releaseLock();
                }
            })();

        } catch (err) {
            if (err.name !== "NotFoundError") {
                toast.error("Failed to connect: " + err.message);
            }
        } finally {
            setConnecting(false);
        }
    };

    const disconnectSerial = async () => {
        try {
            if (readerRef.current) {
                const { reader, readableStreamClosed } = readerRef.current;
                await reader.cancel();
                await readableStreamClosed.catch(() => { });
                readerRef.current = null;
            }
            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }
        } catch { /* ignore */ }
        setConnected(false);
        bufferRef.current = "";
        toast.info("Scanner disconnected.");
    };

    useEffect(() => {
        return () => { disconnectSerial(); };
    }, []);

    const selectedEventObj = events.find(e => String(e.id) === selectedEvent);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <TooltipProvider>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7c3aed]/25">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-[#1e1b4b] tracking-tight">RFID Scanner</h1>
                            <p className="text-slate-500 text-xs mt-0.5">Scan student RFID cards for event attendance</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon"
                                    onClick={() => setSoundOn(!soundOn)}
                                    className="border-slate-200 text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-xl bg-white shadow-sm">
                                    {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{soundOn ? "Mute" : "Unmute"} sounds</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={fetchStats}
                                    className="border-slate-200 text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-xl bg-white shadow-sm">
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Refresh stats</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Connection + Event bar */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Event selector */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Calendar className="w-4 h-4 text-[#7c3aed]" />
                            <span className="text-sm font-semibold text-slate-700">Event:</span>
                        </div>
                        <div className="flex-1 min-w-[200px] max-w-xs">
                            {loading ? (
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
                                                    {ev.title || ev.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Mode toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => { setMode("checkin"); setLastScan(null); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "checkin"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}>
                                <LogIn className="w-3.5 h-3.5" />
                                Check In
                            </button>
                            <button
                                onClick={() => { setMode("checkout"); setLastScan(null); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "checkout"
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}>
                                <LogOut className="w-3.5 h-3.5" />
                                Check Out
                            </button>
                        </div>


                        <Button
                            onClick={connected ? disconnectSerial : connectSerial}
                            disabled={connecting}
                            className={`rounded-xl h-10 px-5 font-semibold text-sm shadow-md ${connected
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/25"
                                : "bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:opacity-90 text-white shadow-[#7c3aed]/25"
                                }`}>
                            {connecting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting…</>
                            ) : connected ? (
                                <><WifiOff className="mr-2 h-4 w-4" />Disconnect</>
                            ) : (
                                <><Wifi className="mr-2 h-4 w-4" />Connect Scanner</>
                            )}
                        </Button>

                        {/* Connection indicator */}
                        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${connected
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                            {connected ? "Connected" : "Disconnected"}
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Users} label="Total Scans" value={stats.total}
                        sub={selectedEventObj?.title || selectedEventObj?.name || "Select event"}
                        grad="from-[#7c3aed] to-[#6d28d9]"
                    />
                    <StatCard
                        icon={LogIn} label="Checked In" value={stats.checkedIn}
                        sub="Currently present"
                        grad="from-[#059669] to-[#10b981]"
                    />
                    <StatCard
                        icon={LogOut} label="Checked Out" value={stats.checkedOut}
                        sub="Departed"
                        grad="from-[#2563eb] to-[#5b9ef7]"
                    />
                    <StatCard
                        icon={Zap} label="Session Scans" value={scanLog.length}
                        sub="This session"
                        grad="from-[#d97706] to-[#fbbf24]"
                    />
                </div>

                {/* ── JARVIS Identity Panel ── */}
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ${!lastScan
                    ? "bg-[#0b1220] border border-slate-700/50 min-h-[260px]"
                    : lastScan.status === "success"
                        ? "bg-[#071a10] border border-emerald-500/40 min-h-[300px]"
                        : lastScan.status === "warning"
                            ? "bg-[#1a1400] border border-amber-500/40 min-h-[300px]"
                            : lastScan.status === "error"
                                ? "bg-[#1a0708] border border-red-500/40 min-h-[300px]"
                                : "bg-[#0b1220] border border-slate-600/40 min-h-[300px]"
                    }`}>

                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: "linear-gradient(#00ffff 1px,transparent 1px),linear-gradient(90deg,#00ffff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

                    {/* Corner brackets — HUD frame */}
                    {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-8 h-8`}>
                            <div className={`absolute w-full h-0.5 ${lastScan?.status === "success" ? "bg-emerald-400" :
                                lastScan?.status === "warning" ? "bg-amber-400" :
                                    lastScan?.status === "error" ? "bg-red-400" : "bg-cyan-400"
                                } ${i < 2 ? "top-0" : "bottom-0"}`} />
                            <div className={`absolute h-full w-0.5 ${lastScan?.status === "success" ? "bg-emerald-400" :
                                lastScan?.status === "warning" ? "bg-amber-400" :
                                    lastScan?.status === "error" ? "bg-red-400" : "bg-cyan-400"
                                } ${i % 2 === 0 ? "left-0" : "right-0"}`} />
                        </div>
                    ))}

                    {/* Scan line sweep animation */}
                    {(processing || !lastScan) && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-[scanline_2s_linear_infinite]"
                                style={{ animation: "scanline 2s linear infinite" }} />
                        </div>
                    )}

                    <style>{`
                        @keyframes scanline { 0% { top: 0%; } 100% { top: 100%; } }
                        @keyframes ringPulse { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 1; } }
                        @keyframes ringRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                        @keyframes flickerIn { 0%,19%,21%,23%,25%,54%,56%,100% { opacity:1; } 20%,22%,24%,55% { opacity:0; } }
                        @keyframes overlayBackdrop { from { backdrop-filter: blur(0px); background: rgba(0,0,0,0); } to { backdrop-filter: blur(16px); background: rgba(5,9,16,0.92); } }
                        @keyframes overlayContent { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                        @keyframes glitchSweep { 0% { clip-path: inset(0 0 100% 0); } 100% { clip-path: inset(0 0 0 0); } }
                    `}</style>

                    {/* ── FULLSCREEN CINEMATIC OVERLAY ── */}
                    {showOverlay && lastScan && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
                            style={{ animation: "overlayBackdrop 0.4s ease-out forwards" }}>

                            {/* Hex/Grid Background FX for Overlay */}
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15) 0%, transparent 60%)" }} />
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px", transform: "perspective(500px) rotateX(45deg) scale(2)", transformOrigin: "bottom" }} />

                            {/* Radar sweep line */}
                            <div className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12 animate-[scanline_3s_linear_infinite]" style={{ left: "-20%", animation: "ringRotate 4s linear infinite" }} />

                            {/* Main Overlay Content Box */}
                            <div className="relative z-10 w-full max-w-6xl px-4 md:px-8 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16"
                                style={{ animation: "overlayContent 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>

                                {/* GIANT Portrait Side */}
                                <div className="relative shrink-0 flex items-center justify-center">

                                    {/* Glowing Backdrop Frame */}
                                    <div className="absolute inset-[-12px] rounded-[2.5rem] bg-gradient-to-b from-transparent to-transparent border border-white/10 opacity-60"
                                        style={{
                                            boxShadow: lastScan.status === "success" ? "0 0 50px #10b98133, inset 0 0 30px #10b98122" : lastScan.status === "error" ? "0 0 50px #ef444433, inset 0 0 30px #ef444422" : "0 0 50px #f59e0b33, inset 0 0 30px #f59e0b22",
                                            animation: "ringPulse 3s ease-in-out infinite"
                                        }} />

                                    {/* Massive Photo */}
                                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-800 flex items-center justify-center z-10 aspect-[3/4]"
                                        style={{ width: "min(400px, 40vw)" }}>
                                        <div className="absolute inset-0 bg-cyan-500 mix-blend-overlay opacity-10 pointer-events-none z-10" />
                                        {lastScan.profilePicture ? (
                                            <img src={lastScan.profilePicture} alt={lastScan.studentName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-8xl font-black text-slate-600">
                                                {lastScan.studentName?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Floating Status Badge */}
                                    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full flex items-center justify-center border-4 border-[#050910] shadow-[0_0_40px_rgba(0,0,0,0.9)] z-20"
                                        style={{ background: lastScan.status === "success" ? "#10b981" : lastScan.status === "error" ? "#ef4444" : "#f59e0b" }}>
                                        {lastScan.status === "success" ? <CheckCircle2 className="w-12 h-12 text-white" /> :
                                            lastScan.status === "error" ? <XCircle className="w-12 h-12 text-white" /> :
                                                <AlertTriangle className="w-12 h-12 text-white animate-pulse" />}
                                    </div>
                                </div>

                                {/* Typography / Data Side */}
                                <div className="flex-1 text-center md:text-left space-y-8 py-8">
                                    {/* Identity Header */}
                                    <div>
                                        <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                                            <div className="w-3 h-3 rounded-full animate-pulse"
                                                style={{ background: lastScan.status === "success" ? "#34d399" : lastScan.status === "error" ? "#f87171" : "#fbbf24" }} />
                                            <span className="font-mono text-sm tracking-[0.3em] uppercase font-bold"
                                                style={{
                                                    color: lastScan.status === "success" ? "#34d399" : lastScan.status === "error" ? "#f87171" : "#fbbf24",
                                                    animation: "flickerIn 0.3s ease-out",
                                                }}>
                                                {lastScan.status === "success" && lastScan.action === "checkin" ? "CHECKED IN · IDENTITY VERIFIED" :
                                                    lastScan.status === "success" && lastScan.action === "checkout" ? "CHECKED OUT · IDENTITY VERIFIED" :
                                                        lastScan.status === "warning" ? `SYSTEM WARNING` : "ACCESS DENIED"}
                                            </span>
                                        </div>

                                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-none mb-2"
                                            style={{ textShadow: lastScan.status === "success" ? "0 0 40px #10b98160" : lastScan.status === "error" ? "0 0 40px #ef444460" : "0 0 40px #f59e0b60" }}>
                                            {lastScan.studentName}
                                        </h1>
                                        <p className="text-2xl font-mono text-cyan-400 capitalize tracking-widest mt-4 opacity-90" style={{ animation: "glitchSweep 0.5s ease-out" }}>
                                            {lastScan.message}
                                        </p>
                                    </div>

                                    {/* Tech Data Blocks */}
                                    <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-700/60 max-w-lg mx-auto md:mx-0">
                                        <div>
                                            <p className="text-[11px] font-mono font-bold tracking-[0.25em] text-slate-500 uppercase mb-1">Student ID</p>
                                            <p className="font-mono text-2xl text-slate-200">{lastScan.studentNumber || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-mono font-bold tracking-[0.25em] text-slate-500 uppercase mb-1">Year Level</p>
                                            <p className="font-mono text-xl text-slate-200">{lastScan.yearLevel || "—"}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[11px] font-mono font-bold tracking-[0.25em] text-slate-500 uppercase mb-1">Program / Course</p>
                                            <p className="font-mono text-xl text-slate-200">{lastScan.course || "—"}</p>
                                        </div>
                                    </div>

                                    {/* Scan Metadata */}
                                    <div className="pt-6 flex items-center justify-center md:justify-start gap-4">
                                        <div className="px-3 py-1.5 rounded bg-slate-800/80 border border-slate-700 font-mono text-xs text-slate-400">
                                            UID: {lastScan.uid}
                                        </div>
                                        <div className="px-3 py-1.5 rounded bg-slate-800/80 border border-slate-700 font-mono text-xs text-slate-400">
                                            {fmt(lastScan.time)}
                                        </div>
                                        <button onClick={() => setShowOverlay(false)} className="px-3 py-1.5 rounded text-slate-500 hover:text-white transition-colors cursor-pointer ml-auto">
                                            Dismiss [ESC]
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative z-10 p-8 flex flex-col items-center gap-6">

                        {!lastScan ? (
                            /* ── Idle state ── */
                            <div className="flex flex-col items-center justify-center py-6 gap-4">
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
                                    <div className="absolute inset-2 rounded-full border border-cyan-400/20 animate-pulse" />
                                    <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center">
                                        <Radio className="w-10 h-10 text-cyan-400/60" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="font-mono font-bold text-cyan-300 tracking-[0.3em] uppercase text-sm">
                                        {connected ? "AWAITING SCAN" : "SCANNER OFFLINE"}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1 font-mono">
                                        {connected ? "Place RFID card on reader" : "Connect scanner to begin"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* ── Identity card ── */
                            <div className="w-full flex flex-col lg:flex-row items-center gap-8" style={{ animation: "fadeInUp 0.4s ease-out" }}>

                                {/* Photo with rings */}
                                <div className="relative shrink-0 flex items-center justify-center" style={{ width: 180, height: 180 }}>
                                    {/* Outer slow-rotating dashed ring */}
                                    <div className="absolute inset-0 rounded-full border-2 border-dashed opacity-40"
                                        style={{
                                            borderColor: lastScan.status === "success" ? "#34d399" : lastScan.status === "error" ? "#f87171" : "#67e8f9",
                                            animation: "ringRotate 8s linear infinite",
                                        }} />
                                    {/* Middle pulse ring */}
                                    <div className="absolute rounded-full border"
                                        style={{
                                            inset: 12,
                                            borderColor: lastScan.status === "success" ? "#10b981" : lastScan.status === "error" ? "#ef4444" : "#22d3ee",
                                            animation: "ringPulse 2s ease-in-out infinite",
                                            boxShadow: lastScan.status === "success"
                                                ? "0 0 20px #10b98155, inset 0 0 20px #10b98122"
                                                : lastScan.status === "error"
                                                    ? "0 0 20px #ef444455, inset 0 0 20px #ef444422"
                                                    : "0 0 20px #22d3ee55",
                                        }} />
                                    {/* Inner counter-rotating ring */}
                                    <div className="absolute rounded-full border border-dotted opacity-30"
                                        style={{
                                            inset: 20,
                                            borderColor: lastScan.status === "success" ? "#6ee7b7" : lastScan.status === "error" ? "#fca5a5" : "#a5f3fc",
                                            animation: "ringRotate 5s linear infinite reverse",
                                        }} />
                                    {/* The photo itself */}
                                    <div className="relative" style={{ inset: 28, position: "absolute", borderRadius: "50%", overflow: "hidden" }}>
                                        <AvatarImg
                                            src={lastScan.profilePicture}
                                            name={lastScan.studentName}
                                            size={124}
                                        />
                                    </div>
                                    {/* Status icon bottom-right */}
                                    <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center border-2 border-black shadow-lg"
                                        style={{ background: lastScan.status === "success" ? "#10b981" : lastScan.status === "error" ? "#ef4444" : "#64748b" }}>
                                        {lastScan.status === "success"
                                            ? <CheckCircle2 className="w-5 h-5 text-white" />
                                            : lastScan.status === "error"
                                                ? <XCircle className="w-5 h-5 text-white" />
                                                : <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        }
                                    </div>
                                </div>

                                {/* Info block */}
                                <div className="flex-1 min-w-0 text-center lg:text-left space-y-4">
                                    {/* Status label */}
                                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                                        <div className="w-2 h-2 rounded-full animate-pulse"
                                            style={{
                                                background:
                                                    lastScan.status === "success" ? "#34d399" :
                                                        lastScan.status === "warning" ? "#fbbf24" :
                                                            lastScan.status === "error" ? "#f87171" : "#94a3b8"
                                            }} />
                                        <span className="font-mono text-[11px] tracking-[0.25em] uppercase font-bold"
                                            style={{
                                                color:
                                                    lastScan.status === "success" ? "#34d399" :
                                                        lastScan.status === "warning" ? "#fbbf24" :
                                                            lastScan.status === "error" ? "#f87171" : "#94a3b8",
                                                animation: "flickerIn 0.3s ease-out",
                                            }}>
                                            {lastScan.status === "success" && lastScan.action === "checkin" ? "CHECKED IN · VERIFIED" :
                                                lastScan.status === "success" && lastScan.action === "checkout" ? "CHECKED OUT · VERIFIED" :
                                                    lastScan.status === "warning" ? `⚠ ${lastScan.message.toUpperCase()}` :
                                                        lastScan.status === "error" ? "ACCESS DENIED" : "PROCESSING"}
                                        </span>
                                    </div>

                                    {/* Name — biggest element */}
                                    <h2 className="text-4xl font-extrabold tracking-tight text-white leading-none" style={{ textShadow: lastScan.status === "success" ? "0 0 30px #10b98160" : lastScan.status === "error" ? "0 0 30px #ef444460" : "none" }}>
                                        {lastScan.studentName}
                                    </h2>

                                    {/* Data rows */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-xs mx-auto lg:mx-0">
                                        {lastScan.studentNumber && (
                                            <div>
                                                <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-500 uppercase">Student ID</p>
                                                <p className="font-mono text-sm text-slate-200 mt-0.5">{lastScan.studentNumber}</p>
                                            </div>
                                        )}
                                        {lastScan.yearLevel && (
                                            <div>
                                                <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-500 uppercase">Year Level</p>
                                                <p className="font-mono text-sm text-slate-200 mt-0.5">{lastScan.yearLevel}</p>
                                            </div>
                                        )}
                                        {lastScan.course && (
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-500 uppercase">Program</p>
                                                <p className="font-mono text-sm text-slate-200 mt-0.5">{lastScan.course}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message + UID + time */}
                                    <div className="pt-2 border-t border-slate-700/60">
                                        <p className="text-sm font-semibold"
                                            style={{ color: lastScan.status === "success" ? "#34d399" : lastScan.status === "error" ? "#f87171" : "#94a3b8" }}>
                                            {lastScan.message}
                                        </p>
                                        <p className="text-[11px] font-mono text-slate-600 mt-1">
                                            UID: {lastScan.uid} &nbsp;·&nbsp; {fmt(lastScan.time)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Processing bar at bottom */}
                    {processing && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-800">
                            <div className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" style={{ width: "60%" }} />
                        </div>
                    )}
                </div>


                {/* Scan log table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#7c3aed]" />
                            <h2 className="text-sm font-bold text-slate-800">Scan History</h2>
                            <Badge variant="outline" className="text-[10px] ml-1">{scanLog.length} scans</Badge>
                        </div>
                        {scanLog.length > 0 && (
                            <Button
                                variant="ghost" size="sm"
                                onClick={() => { setScanLog([]); setLastScan(null); }}
                                className="h-7 text-xs text-slate-500 hover:text-red-600">
                                Clear
                            </Button>
                        )}
                    </div>

                    {scanLog.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold">No scans yet</p>
                            <p className="text-xs mt-1">Scanned cards will appear here in real-time</p>
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr className="text-xs text-slate-500 uppercase tracking-wide">
                                        <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">Student</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">RFID UID</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">Time</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">Message</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {scanLog.map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3">
                                                {entry.status === "success" ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-xs font-semibold text-emerald-600">Success</span>
                                                    </div>
                                                ) : entry.status === "error" ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-xs font-semibold text-red-600">Failed</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                                        <span className="text-xs font-semibold text-slate-500">Processing</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <AvatarImg
                                                        src={entry.profilePicture || null}
                                                        name={entry.studentName}
                                                        size={32}
                                                    />
                                                    <span className="font-medium text-slate-800">{entry.studentName}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{entry.uid}</span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{fmt(entry.time)}</td>
                                            <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate">{entry.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Web Serial API support note */}
                {!("serial" in navigator) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900">Web Serial API Not Supported</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Your browser does not support the Web Serial API. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> (version 89+) to connect your RFID scanner.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
