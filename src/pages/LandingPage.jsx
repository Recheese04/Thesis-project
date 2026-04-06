import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  QrCode, Users, FileCheck, Shield, BarChart3,
  ArrowRight, Bell, CalendarDays, Award, ChevronLeft, ChevronRight,
  Cpu, CheckCircle2,
} from 'lucide-react';

import LandingNav from '../components/layout/LandingNav';

// ── Image imports ─────────────────────────────────────────────────────────────
import img1 from '../images/valentines.jpg';
import img2 from '../images/intrams.jpg';
import img3 from '../images/buwan-ng-wika.jpg';
import img4 from '../images/scimath.jpg';
import img5 from '../images/teachersday.jpg';
import img6 from '../images/bisu day.jpg';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVITIES = [
  {
    id: 1, title: "Intramurals 2025",
    category: "Sports Event", date: "February 10–14, 2025",
    desc: "Campus-wide sports festival bringing together all colleges in friendly athletic competition.",
    img: img2, badge: "#f59e0b", pos: "80% center",
  },
  {
    id: 2, title: "Buwan ng Wika",
    category: "Cultural / Educational", date: "January 22, 2025",
    desc: "Promotes Filipino language and culture every August.",
    img: img3, badge: "#3b82f6", pos: "70% center",
  },
  {
    id: 3, title: "SciMath",
    category: "Educational / Academic", date: "November 15, 2024",
    desc: "Highlights Science and Math through competitions and activities.",
    img: img4, badge: "#ec4899", pos: "60% center",
  },
  {
    id: 4, title: "BISU Days",
    category: "Institutional / Cultural", date: "October 8, 2024",
    desc: "Marks the university's anniversary with events and performances.",
    img: img6, badge: "#10b981", pos: "30% center",
  },
  {
    id: 5, title: "Valentine's Day",
    category: "Cultural / Social", date: "September 20, 2024",
    desc: "Celebrates love and friendship with gifts and cards.",
    img: img1, badge: "#8b5cf6", pos: "60% center",
  },
  {
    id: 6, title: "Teachers' Day",
    category: "Cultural / Social", date: "August 5, 2024",
    desc: "Honors teachers for their dedication and contributions.",
    img: img5, badge: "#f97316", pos: "60% center",
  },
];

const FEATURES = [
  { icon: QrCode, title: "QR Code Check-In", desc: "Students scan to mark attendance instantly. No paper logs, no manual counting." },
  { icon: Cpu, title: "RFID Integration", desc: "Hardware-level check-in via RFID cards for supported events and venues." },
  { icon: Users, title: "Member Management", desc: "Full roster of students, officers, and colleges in one organized system." },
  { icon: CalendarDays, title: "Event Scheduling", desc: "Create and manage events with attendance requirements and time windows." },
  { icon: FileCheck, title: "Clearance Automation", desc: "Attendance-based clearance issued automatically when requirements are met." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Visual dashboards showing attendance rates, trends, and event metrics." },
  { icon: Bell, title: "Announcements", desc: "Push updates and notices directly to student members in real time." },
  { icon: Shield, title: "Role-Based Access", desc: "Separate portals for admins, officers, and students with appropriate permissions." },
];

const STATS = [
  { value: "500+", label: "Students Enrolled" },
  { value: "40+", label: "Events Tracked" },
  { value: "98%", label: "Attendance Accuracy" },
  { value: "3", label: "User Roles Supported" },
];

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Infinite Marquee strip ────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = [...ACTIVITIES, ...ACTIVITIES, ...ACTIVITIES];
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <motion.div
        style={{ display: 'flex', gap: 20, width: 'max-content' }}
        animate={{ x: ['0%', '-33.33%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 28 }}
      >
        {items.map((a, i) => (
          <div
            key={`${a.id}-${i}`}
            style={{
              position: 'relative',
              flexShrink: 0,
              width: 'clamp(200px, 22vw, 260px)',
              height: 176,
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
              cursor: 'pointer',
            }}
          >
            <img
              src={a.img}
              alt={a.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', display: 'block' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,24,50,0.85) 0%, transparent 55%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, background: a.badge, color: 'white', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                {a.category}
              </span>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0, lineHeight: 1.3 }}>{a.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '3px 0 0' }}>{a.date}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Main LandingPage ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent(c => (c + 1) % ACTIVITIES.length);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  const go = (n) => setCurrent((n + ACTIVITIES.length) % ACTIVITIES.length);
  const activity = ACTIVITIES[current];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        .land       { font-family: 'DM Sans', sans-serif; color: #0f172a; }
        .jk         { font-family: 'Plus Jakarta Sans', sans-serif; }
        .dot-bg     {
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }

        @keyframes float  {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-16px) rotate(3deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-10px) rotate(-2deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse2 {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.1); }
        }

        .float-a { animation: float  6s ease-in-out infinite; }
        .float-b { animation: floatB 8s ease-in-out infinite; }
        .pulse2  { animation: pulse2 3s ease-in-out infinite; }

        .gradient-text {
          background: linear-gradient(135deg, #93c5fd 0%, #dbeafe 50%, #93c5fd 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; font-weight: 700; font-size: 15px;
          padding: 14px 32px; border-radius: 14px; border: none;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 6px 24px rgba(37,99,235,0.38);
          transition: transform 0.18s, box-shadow 0.18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(37,99,235,0.48);
        }
        .cta-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.1);
          color: white; font-weight: 600; font-size: 15px;
          padding: 14px 28px; border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.2);
          cursor: pointer; text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }
        .cta-ghost:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.4);
        }

        /* ── Hero carousel ── */
        .hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .cta-btn, .cta-ghost { width: 100%; justify-content: center; }
          .hero-ctas { flex-direction: column; }
        }

        /* ── Responsive features grid ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        /* ── Responsive stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 20px;
        }

        /* ── Responsive footer ── */
        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .footer-inner { flex-direction: column; align-items: flex-start; }
        }

        /* ── Hero responsive ── */
        .hero-section { min-height: 100vh; }
        .hero-bg-img {
          transition: object-position 0.5s ease;
        }
        .hero-overlay-left {
          background: linear-gradient(to right, rgba(9,24,50,0.95) 0%, rgba(9,24,50,0.8) 35%, rgba(9,24,50,0.45) 65%, rgba(9,24,50,0.25) 100%);
        }
        @media (max-width: 768px) {
          .hero-section { min-height: 100svh; }
          .hero-bg-img {
            object-position: var(--mobile-pos, 55% center) !important;
          }
          .hero-overlay-left {
            background: linear-gradient(to bottom, rgba(9,24,50,0.88) 0%, rgba(9,24,50,0.6) 40%, rgba(9,24,50,0.35) 70%, rgba(9,24,50,0.5) 100%);
          }
        }
        .hero-bottom-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding: 18px 24px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        @media (max-width: 480px) {
          .hero-bottom-bar {
            padding: 14px 16px;
            gap: 14px;
          }
        }
      `}</style>

      <div className="land">

        {/* ── Separated Nav component ── */}
        <LandingNav />

        {/* ── HERO (Full-screen immersive carousel) ───────────────────────── */}
        <section className="hero-section" style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* ── Background carousel images (cross-fade) ── */}
          <AnimatePresence mode="sync">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            >
              <img
                src={activity.img}
                alt=""
                className="hero-bg-img"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                  objectPosition: activity.pos || '60% center',
                  '--mobile-pos': activity.pos || '55% center',
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* ── Gradient overlays to blend image into dark blue ── */}
          {/* Left-heavy gradient so text is readable (responsive via CSS class) */}
          <div className="hero-overlay-left" style={{
            position: 'absolute', inset: 0, zIndex: 1,
          }} />
          {/* Bottom gradient for smooth transition to next section */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(to top, rgba(9,24,50,0.98) 0%, rgba(9,24,50,0.4) 30%, transparent 55%)',
          }} />
          {/* Top gradient for nav area */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(to bottom, rgba(9,24,50,0.7) 0%, transparent 25%)',
          }} />

          {/* Dot pattern overlay */}
          <div className="dot-bg" style={{ position: 'absolute', inset: 0, zIndex: 2 }} />

          {/* Ambient color radials */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: `
              radial-gradient(ellipse 65% 55% at 5% 10%, rgba(37,99,235,0.3) 0%, transparent 60%),
              radial-gradient(ellipse 50% 60% at 95% 90%, rgba(14,165,233,0.12) 0%, transparent 60%)
            `,
          }} />

          {/* Floating shapes */}
          <div className="float-a" style={{ position: 'absolute', top: 60, right: '8%', width: 280, height: 280, borderRadius: 48, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(96,165,250,0.08)', pointerEvents: 'none', zIndex: 2 }} />
          <div className="float-b" style={{ position: 'absolute', bottom: 200, left: '4%', width: 100, height: 100, borderRadius: 24, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(147,197,253,0.06)', pointerEvents: 'none', zIndex: 2 }} />

          {/* Ring decorations */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none', zIndex: 2 }} />

          {/* ── Hero Content ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 3, paddingTop: 'clamp(100px, 15vw, 120px)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)', width: '100%' }}>

              <motion.div {...fadeUp(0.1)}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(96,165,250,0.28)', marginBottom: 28 }}>
                  <span className="pulse2" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                  <span className="jk" style={{ color: '#bfdbfe', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Live at BISU Candijay
                  </span>
                </div>
              </motion.div>

              <motion.h1
                {...fadeUp(0.18)}
                className="jk"
                style={{
                  fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)', fontWeight: 900,
                  color: 'white', lineHeight: 1.06, marginBottom: 24,
                  letterSpacing: '-1px', maxWidth: 680,
                  textShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                Attendance Tracking<br />
                <span className="gradient-text">Built for BISU Candijay.</span>
              </motion.h1>

              <motion.p {...fadeUp(0.26)} style={{
                color: 'rgba(191,219,254,0.8)', fontSize: 'clamp(14px, 1.8vw, 18px)',
                lineHeight: 1.75, marginBottom: 40, maxWidth: 480,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                The centralized platform for BISU Candijay Campus — manage student attendance, events, clearances, and organizational records seamlessly.
              </motion.p>

              <motion.div {...fadeUp(0.32)} className="hero-ctas">
                <Link to="/login" className="cta-btn">
                  Access Portal <ArrowRight size={17} />
                </Link>
                <a href="#activities" className="cta-ghost">
                  View Activities
                </a>
              </motion.div>

              {/* Trust badges */}
              <motion.div {...fadeUp(0.4)} style={{ display: 'flex', gap: 28, marginTop: 40, flexWrap: 'wrap' }}>
                {[['500+', 'Students'], ['40+', 'Events'], ['98%', 'Accuracy']].map(([v, l]) => (
                  <div key={l}>
                    <p className="jk" style={{ color: 'white', fontWeight: 800, fontSize: 'clamp(18px, 2.5vw, 24px)', lineHeight: 1, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{v}</p>
                    <p style={{ color: 'rgba(147,197,253,0.6)', fontSize: 12, marginTop: 4 }}>{l}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* ── Bottom event info bar ── */}
          <div style={{ position: 'relative', zIndex: 3, padding: '0 clamp(16px, 4vw, 32px) 40px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <motion.div
                {...fadeUp(0.45)}
                className="hero-bottom-bar"
              >
                {/* Current event info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }}>
                    <img src={activity.img} alt={activity.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: activity.badge, color: 'white', fontSize: 9, fontWeight: 700 }}>{activity.category}</span>
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{activity.date}</span>
                    </div>
                    <p className="jk" style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.title}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {[{ d: -1, icon: <ChevronLeft size={16} /> }, { d: 1, icon: <ChevronRight size={16} /> }].map(({ d, icon }, idx) => (
                    <button
                      key={idx}
                      onClick={() => go(current + d)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'white', transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                      {icon}
                    </button>
                  ))}

                  {/* Dot indicators */}
                  <div style={{ display: 'flex', gap: 5, marginLeft: 6 }}>
                    {ACTIVITIES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        style={{
                          width: i === current ? 20 : 6, height: 6,
                          borderRadius: 99,
                          background: i === current ? '#60a5fa' : 'rgba(255,255,255,0.25)',
                          border: 'none', cursor: 'pointer', padding: 0,
                          transition: 'all 0.35s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Wave bottom */}
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'clamp(48px, 7vw, 90px)', marginBottom: -2, position: 'relative', zIndex: 3 }}>
            <path d="M0,0 C240,90 480,0 720,50 C960,90 1200,10 1440,60 L1440,90 L0,90 Z" fill="#f8fafc" />
          </svg>
        </section>

        {/* ── MARQUEE STRIP ─────────────────────────────────────────────────── */}
        <section id="activities" style={{ background: '#f8fafc', padding: 'clamp(48px, 7vw, 80px) 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)', marginBottom: 40 }}>
            <FadeIn>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p className="jk" style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    SDS Office Showcase
                  </p>
                  <h2 className="jk" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.3rem)', fontWeight: 800, color: '#091832', lineHeight: 1.2, marginBottom: 10 }}>
                    Events &amp; Activities
                  </h2>
                  <p style={{ color: '#64748b', fontSize: 15, maxWidth: 480, margin: 0 }}>
                    Highlights from BISU Candijay Campus events managed and tracked through the system.
                  </p>
                </div>
                <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  See all events <ArrowRight size={15} />
                </a>
              </div>
            </FadeIn>
          </div>
          <MarqueeStrip />
        </section>

        {/* Wave into Features */}
        <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'clamp(40px, 5vw, 70px)', background: '#f8fafc', marginBottom: -2 }}>
          <path d="M0,35 C360,70 1080,0 1440,35 L1440,70 L0,70 Z" fill="#091832" />
        </svg>

        {/* ── FEATURES ──────────────────────────────────────────────────────── */}
        <section id="features" style={{ background: '#091832', padding: 'clamp(48px, 7vw, 80px) 0 clamp(60px, 8vw, 100px)', position: 'relative', overflow: 'hidden' }}>
          <div className="dot-bg" style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.22) 0%, transparent 60%)' }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)', position: 'relative', zIndex: 2 }}>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <p className="jk" style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Platform Capabilities
                </p>
                <h2 className="jk" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', fontWeight: 800, color: 'white', marginBottom: 14 }}>
                  Everything You Need
                </h2>
                <p style={{ color: 'rgba(147,197,253,0.6)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
                  A complete suite of tools for student organization management at BISU Candijay.
                </p>
              </div>
            </FadeIn>

            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <div
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                      e.currentTarget.style.transform = 'none';
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 20,
                      padding: '26px 22px',
                      transition: 'all 0.25s ease',
                      height: '100%',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                      <f.icon style={{ width: 20, height: 20, color: '#93c5fd' }} />
                    </div>
                    <h3 className="jk" style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 8, marginTop: 0 }}>{f.title}</h3>
                    <p style={{ color: 'rgba(147,197,253,0.55)', fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Wave out of Features */}
        <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'clamp(40px, 5vw, 70px)', background: '#f8fafc', transform: 'scaleY(-1)', marginBottom: -2 }}>
          <path d="M0,35 C360,70 1080,0 1440,35 L1440,70 L0,70 Z" fill="#091832" />
        </svg>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#f8fafc', padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 32px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <FadeIn>
              <div className="stats-grid">
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.55 }}
                    style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 3vw, 32px) 24px', textAlign: 'center', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
                  >
                    <p className="jk" style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: '#1d4ed8', lineHeight: 1, margin: 0 }}>{s.value}</p>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, fontWeight: 500, marginBottom: 0 }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
        <section id="about" style={{ padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 32px)', background: '#f8fafc' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <FadeIn>
              <div style={{
                borderRadius: 28,
                background: 'linear-gradient(135deg, #0c2554 0%, #1d4ed8 100%)',
                padding: 'clamp(32px, 6vw, 64px) clamp(24px, 6vw, 64px)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(29,78,216,0.35)',
              }}>
                <div className="dot-bg" style={{ position: 'absolute', inset: 0 }} />
                <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <p className="jk" style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
                    Ready to get started?
                  </p>
                  <h2 className="jk" style={{ color: 'white', fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)', fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
                    Access the TAPasok<br />Attendance Portal
                  </h2>
                  <p style={{ color: 'rgba(191,219,254,0.7)', fontSize: 'clamp(13px, 1.8vw, 16px)', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.7 }}>
                    Sign in with your university credentials to manage attendance, events, and clearances.
                  </p>
                  <Link
                    to="/login"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: 'white', color: '#1d4ed8',
                      padding: '14px 32px', borderRadius: 14,
                      fontWeight: 800, fontSize: 15, textDecoration: 'none',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    Sign In Now <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <footer style={{ background: '#070f22', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }} className="footer-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/bisu-logo.png" alt="BISU" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <p className="jk" style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>TAPasok</p>
                <p style={{ color: 'rgba(147,197,253,0.4)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>BISU Candijay</p>
              </div>
            </div>

            <p style={{ color: 'rgba(147,197,253,0.3)', fontSize: 12, margin: 0 }}>
              © 2026 TAPasok — BISU Candijay Campus. All rights reserved.
            </p>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: 'rgba(147,197,253,0.35)', fontSize: 12 }}>All systems operational</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}