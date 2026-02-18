import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, QrCode, Users, BarChart3, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const features = [
  { icon: QrCode,      title: 'QR Code Check-In',    desc: 'Instant attendance marking via QR scan' },
  { icon: Users,       title: 'Member Management',    desc: 'Students, officers & departments in one place' },
  { icon: BarChart3,   title: 'Attendance Analytics', desc: 'Real-time reports and completion tracking' },
  { icon: ShieldCheck, title: 'Clearance System',     desc: 'Automated clearance based on attendance' },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const navigate                        = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

      const response = await axios.post('/api/login', {
        email:    formData.email,
        password: formData.password,
      }, { withCredentials: true });

      const { token, user, role, membership, organization_id } = response.data;

      // Persist everything the app needs
      localStorage.setItem('token',           token);
      localStorage.setItem('user',            JSON.stringify(user));
      localStorage.setItem('user_role',       role);                          // 'admin' | 'officer' | 'member'
      localStorage.setItem('membership',      JSON.stringify(membership));    // OrganizationMember row or null
      localStorage.setItem('organization_id', organization_id ?? '');        // org they manage, or ''

      // Route based on role returned by the server
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'officer') {
        navigate('/officer/dashboard');
      } else {
        navigate('/student/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500&display=swap');

        .login-root    { font-family: 'DM Sans', sans-serif; }
        .font-display  { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes formIn {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          60%     { transform: translateX(6px); }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%     { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .anim-panel  { animation: panelIn    0.75s cubic-bezier(.22,1,.36,1) both; }
        .anim-form   { animation: formIn     0.75s cubic-bezier(.22,1,.36,1) 0.12s both; }
        .anim-shake  { animation: shake      0.35s ease-in-out; }
        .anim-glow   { animation: glowPulse  3s ease-in-out infinite; }
        .anim-spin   { animation: spin       0.75s linear infinite; }

        .dot-bg {
          background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px);
          background-size: 26px 26px;
        }

        .panel-clip { clip-path: polygon(0 0, 92% 0, 100% 100%, 0 100%); }

        .field {
          width: 100%;
          height: 46px;
          padding: 0 14px 0 42px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          font-family: 'DM Sans', sans-serif;
        }
        .field::placeholder { color: #94a3b8; }
        .field:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12);
        }
        .field-pr { padding-right: 46px; }

        .submit-btn {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 4px 20px rgba(37,99,235,0.32);
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 28px rgba(37,99,235,0.4);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(37,99,235,0.25);
        }
        .submit-btn:disabled {
          background: #93c5fd;
          box-shadow: none;
          cursor: not-allowed;
        }

        .feature-card {
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          transition: background 0.25s, border-color 0.25s;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
        }

        .custom-check {
          width: 16px; height: 16px;
          border-radius: 5px;
          border: 1.5px solid #cbd5e1;
          background: white;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .custom-check:checked {
          background: #2563eb;
          border-color: #2563eb;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4L3.5 6.5L9 1' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          background-size: 10px 8px;
        }
      `}</style>

      <div className="login-root min-h-screen flex bg-white">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[56%] panel-clip relative overflow-hidden anim-panel"
          style={{ background: '#091832' }}>

          <div className="absolute inset-0 dot-bg" />
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 70% 55% at 10% 10%, rgba(37,99,235,0.45) 0%, transparent 60%),
              radial-gradient(ellipse 55% 65% at 90% 90%, rgba(14,165,233,0.18) 0%, transparent 60%)
            `
          }} />

          <div className="absolute -bottom-56 -left-56 w-[560px] h-[560px] rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="absolute -bottom-36 -left-36 w-[380px] h-[380px] rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="absolute -top-20 right-24 w-[220px] h-[220px] rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }} />

          <div className="anim-glow absolute top-16 left-8 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 70%)' }} />

          <div className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, #2563eb, #60a5fa 40%, transparent)' }} />

          <div className="relative z-10 flex flex-col h-full px-12 py-10 pr-20">

            {/* Logo */}
            <div className="flex items-center gap-3 mb-14">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 6px 20px rgba(37,99,235,0.45)' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="font-display text-white font-extrabold text-[17px] leading-none tracking-tight">
                  BISU Attendance
                </p>
                <p style={{ color: 'rgba(147,197,253,0.55)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '4px' }}>
                  Management System
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(96,165,250,0.25)' }}>
                <span className="anim-glow w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span style={{ color: '#bfdbfe', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  System Online
                </span>
              </div>

              <h1 className="font-display font-extrabold text-white leading-[1.08] mb-5"
                style={{ fontSize: 'clamp(1.9rem,3vw,2.65rem)' }}>
                Attendance Tracking<br />
                <span style={{
                  background: 'linear-gradient(90deg, #93c5fd 0%, #dbeafe 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Built for BISU.
                </span>
              </h1>

              <p style={{ color: 'rgba(147,197,253,0.6)', fontSize: '14.5px', lineHeight: '1.75', maxWidth: '300px' }}>
                Centralized platform for Bohol Island State University — manage student attendance, events, and clearances seamlessly.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-auto">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="feature-card">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <Icon style={{ width: 15, height: 15, color: '#93c5fd' }} />
                  </div>
                  <p className="font-display font-bold text-white mb-1" style={{ fontSize: 13, lineHeight: 1.3 }}>
                    {title}
                  </p>
                  <p style={{ color: 'rgba(147,197,253,0.45)', fontSize: 11, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-10 pt-5 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ color: 'rgba(147,197,253,0.35)', fontSize: 11 }}>© 2026 Bohol Island State University</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span style={{ color: 'rgba(147,197,253,0.4)', fontSize: 11 }}>All systems normal</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL (Form) ───────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-14 bg-white">
          <div className="w-full max-w-[390px] anim-form">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2.5 mb-9">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-display font-extrabold text-[#091832] text-[16px]">BISU Attendance</span>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="font-display font-extrabold text-[#091832] mb-2"
                style={{ fontSize: '28px', letterSpacing: '-0.3px' }}>
                Welcome back 👋
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>
                Sign in to your account to continue
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="anim-shake mb-5 p-3.5 rounded-xl flex items-start gap-2.5"
                style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: '#dc2626', fontSize: 13.5, lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div className="mb-5">
                <label htmlFor="email" className="font-display block mb-2"
                  style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#94a3b8', pointerEvents:'none' }} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@bisu.edu.ph"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="field"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="font-display"
                    style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                    Password
                  </label>
                  <Link to="/forgot-password"
                    style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = '#1d4ed8'}
                    onMouseLeave={e => e.target.style.color = '#2563eb'}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#94a3b8', pointerEvents:'none' }} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="field field-pr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', background:'none', border:'none', cursor:'pointer', padding:2, display:'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    {showPassword
                      ? <EyeOff style={{ width:16, height:16 }} />
                      : <Eye    style={{ width:16, height:16 }} />
                    }
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-start gap-2.5 mb-6">
                <input id="remember" type="checkbox" className="custom-check" />
                <label htmlFor="remember" style={{ fontSize:14, color:'#64748b', cursor:'pointer', userSelect:'none', lineHeight:1.5 }}>
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="submit-btn mb-5">
                {loading ? (
                  <>
                    <span className="anim-spin" style={{
                      display:'inline-block', width:16, height:16,
                      border:'2.5px solid rgba(255,255,255,0.35)',
                      borderTopColor:'white', borderRadius:'50%'
                    }} />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>

            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: '#f1f5f9' }} />
              <span style={{ color:'#cbd5e1', fontSize:12, fontWeight:500 }}>or</span>
              <div className="flex-1 h-px" style={{ background: '#f1f5f9' }} />
            </div>

            {/* Register */}
            <p className="text-center" style={{ fontSize:14, color:'#94a3b8' }}>
              Don't have an account?{' '}
              <Link to="/register"
                style={{ color:'#2563eb', fontWeight:700, textDecoration:'none', fontFamily:'Plus Jakarta Sans, sans-serif' }}
                onMouseEnter={e => e.target.style.color = '#1d4ed8'}
                onMouseLeave={e => e.target.style.color = '#2563eb'}>
                Request Access
              </Link>
            </p>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <ShieldCheck style={{ width:13, height:13, color:'#cbd5e1' }} />
              <span style={{ fontSize:11.5, color:'#cbd5e1' }}>Secured with end-to-end encryption</span>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}