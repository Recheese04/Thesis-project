import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    User, Mail, Phone, GraduationCap, Building2, BookOpen,
    Lock, Eye, EyeOff, Save, Loader2, CheckCircle2,
    Users, Clock, Shield, UserPlus, Camera, Trash2, LogOut, AlertTriangle
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// ── Tab Button ──
function Tab({ active, icon: Icon, label, onClick }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${active
                ? "bg-[#0f2d5e] text-white shadow-md shadow-[#0f2d5e]/25"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}>
            <Icon className="w-4 h-4" /> {label}
        </button>
    );
}

// ── Section Label ──
function SLabel({ icon: Icon, text }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-[#0f2d5e]/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#0f2d5e]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2d5e]/60">{text}</span>
            <div className="flex-1 h-px bg-slate-100" />
        </div>
    );
}

export default function StudentProfile() {
    const [tab, setTab] = useState("profile");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Profile form
    const [profileForm, setProfileForm] = useState({
        contact_number: "", email: "",
    });

    // Password form
    const [pwdForm, setPwdForm] = useState({
        current_password: "", new_password: "", new_password_confirmation: "",
    });
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

    // Organizations
    const [allOrgs, setAllOrgs] = useState([]);
    const [myOrgs, setMyOrgs] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [joiningOrg, setJoiningOrg] = useState(null);

    const fetchProfile = async () => {
        try {
            const res = await axios.get("/api/me", authH());
            setUser(res.data.user);
            // Keep localStorage in sync so the Sidebar shows the current avatar
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setProfileForm({
                contact_number: res.data.user?.contact_number || "",
                email: res.data.user?.email || "",
            });
        } catch (err) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgs = async () => {
        try {
            const [orgsRes, myOrgsRes, pendingRes] = await Promise.all([
                axios.get("/api/organizations", authH()),
                axios.get("/api/profile/my-organizations", authH()).catch(() => ({ data: [] })),
                axios.get("/api/profile/join-requests", authH()).catch(() => ({ data: [] })),
            ]);
            setAllOrgs(orgsRes.data);
            setMyOrgs(Array.isArray(myOrgsRes.data) ? myOrgsRes.data : []);
            setPendingRequests(Array.isArray(pendingRes.data) ? pendingRes.data : []);
        } catch (err) {
            console.error("Error loading orgs", err);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchOrgs();
    }, []);

    // ── Avatar Upload ──
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("avatar", file);
        setAvatarLoading(true);
        try {
            await axios.post("/api/profile/avatar", fd, {
                ...authH(),
                headers: { ...authH().headers, "Content-Type": "multipart/form-data" },
            });
            toast.success("Profile picture updated!");
            await fetchProfile();
            window.dispatchEvent(new Event('userUpdated'));
        } catch (err) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setAvatarLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveAvatar = async () => {
        setAvatarLoading(true);
        try {
            await axios.delete("/api/profile/avatar", authH());
            toast.success("Profile picture removed");
            await fetchProfile();
            window.dispatchEvent(new Event('userUpdated'));
        } catch (err) {
            toast.error("Failed to remove photo");
        } finally {
            setAvatarLoading(false);
        }
    };

    // ── Save Profile ──
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await axios.put("/api/profile", profileForm, authH());
            toast.success("Profile updated!");
            fetchProfile();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Change Password ──
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwdForm.new_password !== pwdForm.new_password_confirmation) {
            toast.error("Passwords don't match");
            return;
        }
        setSaving(true);
        try {
            await axios.post("/api/profile/password", pwdForm, authH());
            toast.success("Password changed!");
            setPwdForm({ current_password: "", new_password: "", new_password_confirmation: "" });
        } catch (err) {
            console.error("Change Password Error:", err, err.response?.data);
            let msg = "Failed to change password";
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                msg = Array.isArray(firstError) ? firstError[0] : firstError;
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Leave Org ──
    const [leavingOrg, setLeavingOrg] = useState(null);
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const handleLeaveOrg = async () => {
        if (!leavingOrg) return;
        setSubmittingLeave(true);
        try {
            await axios.delete(`/api/profile/organizations/${leavingOrg.organization_id}/leave`, authH());
            toast.success(`You have left ${leavingOrg.organization?.name || "the organization"}.`);
            setLeavingOrg(null);
            fetchOrgs();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to leave organization.";
            toast.error(msg);
        } finally {
            setSubmittingLeave(false);
        }
    };

    // ── Join by Code ──
    const [inviteCode, setInviteCode] = useState('');
    const [joiningCode, setJoiningCode] = useState(false);

    const handleJoinByCode = async (e) => {
        if (e) e.preventDefault();
        if (!inviteCode.trim()) {
            toast.error("Please enter an invite code.");
            return;
        }
        setJoiningCode(true);
        try {
            await axios.post(`/api/profile/join-by-code`, { invite_code: inviteCode }, authH());
            toast.success("Successfully joined the organization!");
            setInviteCode('');
            fetchOrgs();
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid invite code.";
            toast.error(msg);
        } finally {
            setJoiningCode(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#0f2d5e]" />
            </div>
        );
    }

    const myOrgIds = myOrgs.map((m) => m.organization_id);
    const pendingOrgIds = pendingRequests.map((r) => r.organization_id);
    const availableOrgs = allOrgs.filter(
        (o) => !myOrgIds.includes(o.id) && !pendingOrgIds.includes(o.id)
    );

    const avatarUrl = user?.profile_picture_url || null;
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <Card className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] border-0 shadow-xl rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4">
                    {/* Avatar with camera overlay */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar src={avatarUrl} name={fullName} size={72} />
                        {/* Camera button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarLoading}
                            title="Change profile picture"
                            style={{
                                position: 'absolute', bottom: -4, right: -4,
                                width: 26, height: 26, borderRadius: '50%',
                                background: '#2563eb', border: '2px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'white',
                            }}
                        >
                            {avatarLoading
                                ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                : <Camera style={{ width: 12, height: 12 }} />
                            }
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold truncate">
                            {user?.first_name} {user?.middle_name ? user.middle_name + " " : ""}{user?.last_name}
                        </h1>
                        <p className="text-blue-200 text-sm">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className="bg-white/20 border-white/30 text-white text-[10px]">
                                {user?.student_number}
                            </Badge>
                            <Badge className="bg-white/20 border-white/30 text-white text-[10px]">
                                {user?.year_level}
                            </Badge>
                            {avatarUrl && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    disabled={avatarLoading}
                                    title="Remove photo"
                                    style={{
                                        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: 8, padding: '2px 8px', cursor: 'pointer',
                                        color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    <Trash2 style={{ width: 10, height: 10 }} /> Remove photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tab Bar */}
            <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                <Tab active={tab === "profile"} icon={User} label="My Info" onClick={() => setTab("profile")} />
                <Tab active={tab === "password"} icon={Lock} label="Password" onClick={() => setTab("password")} />
                <Tab active={tab === "organizations"} icon={Users} label="Organizations" onClick={() => setTab("organizations")} />
            </div>

            {/* ── TAB: Profile ── */}
            {tab === "profile" && (
                <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
                    <SLabel icon={GraduationCap} text="Student Information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-400 font-semibold uppercase">Student Number</Label>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                <Shield className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-mono text-slate-700">{user?.student_number}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-400 font-semibold uppercase">Department</Label>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-700 truncate">{user?.department?.name || "—"}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-400 font-semibold uppercase">Course / Program</Label>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                <BookOpen className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-700 truncate">{user?.course || "—"}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-400 font-semibold uppercase">Year Level</Label>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                <GraduationCap className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-700">{user?.year_level || "—"}</span>
                            </div>
                        </div>
                    </div>

                    <SLabel icon={Mail} text="Editable Information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-slate-700 font-semibold text-xs">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                                    className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-700 font-semibold text-xs">Contact Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={profileForm.contact_number}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, contact_number: e.target.value }))}
                                    placeholder="09XX XXX XXXX"
                                    className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveProfile} disabled={saving}
                            className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white h-10 px-6">
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
                        </Button>
                    </div>
                </Card>
            )}

            {/* ── TAB: Password ── */}
            {tab === "password" && (
                <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <SLabel icon={Lock} text="Change Password" />
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        {[
                            { key: "current_password", label: "Current Password", show: showPwd.current, toggle: () => setShowPwd((p) => ({ ...p, current: !p.current })) },
                            { key: "new_password", label: "New Password", show: showPwd.new, toggle: () => setShowPwd((p) => ({ ...p, new: !p.new })) },
                            { key: "new_password_confirmation", label: "Confirm New Password", show: showPwd.confirm, toggle: () => setShowPwd((p) => ({ ...p, confirm: !p.confirm })) },
                        ].map(({ key, label, show, toggle }) => (
                            <div key={key} className="space-y-1">
                                <Label className="text-slate-700 font-semibold text-xs">{label}</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type={show ? "text" : "password"}
                                        value={pwdForm[key]}
                                        onChange={(e) => setPwdForm((p) => ({ ...p, [key]: e.target.value }))}
                                        placeholder="••••••••"
                                        required
                                        className="pl-9 pr-10 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                                    />
                                    <button type="button" tabIndex={-1} onClick={toggle}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                            <Shield className="w-3.5 h-3.5 text-[#1e4db7] shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600">
                                Password must be at least 8 characters long.
                            </p>
                        </div>
                        <Button type="submit" disabled={saving}
                            className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white h-10 px-6">
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing…</> : <><Lock className="mr-2 h-4 w-4" />Change Password</>}
                        </Button>
                    </form>
                </Card>
            )}

            {/* ── TAB: Organizations ── */}
            {tab === "organizations" && (
                <div className="space-y-5">

                    {/* My Organizations */}
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                        <SLabel icon={Users} text="My Organizations" />
                        {myOrgs.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Users className="w-8 h-8 text-slate-300" />
                                <p className="text-sm text-slate-400">You haven't joined any organizations yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {myOrgs.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#0f2d5e]/10 flex items-center justify-center shrink-0">
                                            <Users className="w-4 h-4 text-[#0f2d5e]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{m.organization?.name || m.name || "—"}</p>
                                        </div>
                                        <Badge className={`text-[10px] px-2 capitalize border ${m.designation !== "Member" ? "bg-[#1e4db7]/10 text-[#1e4db7] border-[#1e4db7]/20" :
                                                "bg-blue-50 text-blue-600 border-blue-200"
                                            }`}>
                                            {m.designation || "Member"}
                                        </Badge>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border text-[10px]">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                        </Badge>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setLeavingOrg(m)}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border hover:border-red-100 ml-1 rounded-lg"
                                            title="Leave Organization"
                                        >
                                            <LogOut className="w-4 h-4 ml-0.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <SLabel icon={Clock} text="Pending Requests" />
                            <div className="space-y-2">
                                {pendingRequests.map((r) => (
                                    <div key={r.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{r.organization?.name || "—"}</p>
                                        </div>
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[10px]">
                                            Pending Approval
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Join with Invite Code */}
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                        <SLabel icon={UserPlus} text="Join an Organization" />
                        <p className="text-sm text-slate-500 mb-4 mt-1">
                            Ask your organization officer for their unique 6-character invite code and enter it below to join instantly.
                        </p>
                        
                        <form onSubmit={handleJoinByCode} className="flex gap-2">
                            <Input 
                                placeholder="e.g. AB12CD" 
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value)}
                                className="font-mono text-center tracking-widest uppercase rounded-xl border-slate-300 focus-visible:ring-blue-600 focus-visible:ring-offset-1 h-11"
                                maxLength={6}
                            />
                            <Button 
                                type="submit"
                                disabled={joiningCode || !inviteCode.trim()} 
                                className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white rounded-xl h-11 px-6 shadow-sm transition-all flex items-center gap-2"
                            >
                                {joiningCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                <span>Join</span>
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Leave Organization Dialog */}
            <Dialog open={!!leavingOrg} onOpenChange={(open) => !open && !submittingLeave && setLeavingOrg(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Leave Organization
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-base text-slate-600">
                            Are you sure you want to leave <strong>{leavingOrg?.organization?.name}</strong>? 
                            This action cannot be undone. You will lose access to all its events and resources.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setLeavingOrg(null)} 
                            disabled={submittingLeave}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleLeaveOrg} 
                            disabled={submittingLeave}
                            className="rounded-xl gap-2 bg-red-600 hover:bg-red-700"
                        >
                            {submittingLeave && <Loader2 className="w-4 h-4 animate-spin" />}
                            Yes, Leave Organization
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
