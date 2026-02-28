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
    img: img2, badge: "#f59e0b",
  },
  {
    id: 2, title: "Buwan ng Wika",
    category: "Cultural / Educational", date: "January 22, 2025",
    desc: "Promotes Filipino language and culture every August.",
    img: img3, badge: "#3b82f6",
  },
  {
    id: 3, title: "SciMath",
    category: "Educational / Academic", date: "November 15, 2024",
    desc: "Highlights Science and Math through competitions and activities.",
    img: img4, badge: "#ec4899",
  },
  {
    id: 4, title: "BISU Days",
    category: "Institutional / Cultural", date: "October 8, 2024",
    desc: "Marks the university's anniversary with events and performances.",
    img: img6, badge: "#10b981",
  },
  {
    id: 5, title: "Valentine's Day",
    category: "Cultural / Social", date: "September 20, 2024",
    desc: "Celebrates love and friendship with gifts and cards.",
    img: img1, badge: "#8b5cf6",
  },
  {
    id: 6, title: "Teachers' Day",
    category: "Cultural / Social", date: "August 5, 2024",
    desc: "Honors teachers for their dedication and contributions.",
    img: img5, badge: "#f97316",
  },
];

const FEATURES = [
  { icon: QrCode,       title: "QR Code Check-In",     desc: "Students scan to mark attendance instantly. No paper logs, no manual counting." },
  { icon: Cpu,          title: "RFID Integration",      desc: "Hardware-level check-in via RFID cards for supported events and venues." },
  { icon: Users,        title: "Member Management",     desc: "Full roster of students, officers, and departments in one organized system." },
  { icon: CalendarDays, title: "Event Scheduling",      desc: "Create and manage events with attendance requirements and time windows." },
  { icon: FileCheck,    title: "Clearance Automation",  desc: "Attendance-based clearance issued automatically when requirements are met." },
  { icon: BarChart3,    title: "Analytics & Reports",   desc: "Visual dashboards showing attendance rates, trends, and event metrics." },
  { icon: Bell,         title: "Announcements",         desc: "Push updates and notices directly to student members in real time." },
  { icon: Shield,       title: "Role-Based Access",     desc: "Separate portals for admins, officers, and students with appropriate permissions." },
];

const STATS = [
  { value: "500+", label: "Students Enrolled" },
  { value: "40+",  label: "Events Tracked" },
  { value: "98%",  label: "Attendance Accuracy" },
  { value: "3",    label: "User Roles Supported" },
];

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0 },
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

// ── Featured Slider ───────────────────────────────────────────────────────────

function FeaturedSlider() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1);
      setCurrent(c => (c + 1) % ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const go = (n) => {
    setDir(n > current ? 1 : -1);
    setCurrent((n + ACTIVITIES.length) % ACTIVITIES.length);
  };

  const a = ACTIVITIES[current];

  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '4/3', maxHeight: 440, boxShadow: '0 24px 64px rgba(9,24,50,0.28)' }}>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={current}
          custom={dir}
          initial={{ opacity: 0, x: dir * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -60 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <img src={a.img} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(9,24,50,0.85) 0%, rgba(9,24,50,0.3) 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(20px, 4vw, 32px)' }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 99, background: a.badge, color: 'white', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
              {a.category}
            </span>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'white', fontWeight: 800, fontSize: 'clamp(1.1rem, 3vw, 1.75rem)', margin: '0 0 8px' }}>
              {a.title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(12px, 1.5vw, 14px)', maxWidth: 320, lineHeight: 1.6, margin: '0 0 6px' }}>
              {a.desc}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>{a.date}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      {[{ dir: -1, side: 'left', icon: <ChevronLeft size={20} /> }, { dir: 1, side: 'right', icon: <ChevronRight size={20} /> }].map(({ dir: d, side, icon }) => (
        <button
          key={side}
          onClick={() => go(current + d)}
          style={{
            position: 'absolute',
            [side]: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 38, height: 38,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        >
          {icon}
        </button>
      ))}

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: 14, right: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
        {ACTIVITIES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              borderRadius: 99,
              background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main LandingPage ──────────────────────────────────────────────────────────

export default function LandingPage() {
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

        /* ── Responsive hero grid ── */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
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

        /* ── Responsive hero text buttons ── */
        .hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .cta-btn, .cta-ghost { width: 100%; justify-content: center; }
          .hero-ctas { flex-direction: column; }
        }
      `}</style>

      <div className="land">

        {/* ── Separated Nav component ── */}
        <LandingNav />

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(160deg, #091832 0%, #0c2554 55%, #0f3175 100%)',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 80,
          paddingBottom: 0,
        }}>
          <div className="dot-bg" style={{ position: 'absolute', inset: 0 }} />

          {/* Ambient radials */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse 65% 55% at 5% 10%, rgba(37,99,235,0.45) 0%, transparent 60%),
              radial-gradient(ellipse 50% 60% at 95% 90%, rgba(14,165,233,0.2) 0%, transparent 60%)
            `,
          }} />

          {/* Floating shapes (hidden on small screens to avoid clutter) */}
          <div className="float-a" style={{ position: 'absolute', top: 60, right: '8%', width: 280, height: 280, borderRadius: 48, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(96,165,250,0.15)', backdropFilter: 'blur(4px)', pointerEvents: 'none' }} />
          <div className="float-b" style={{ position: 'absolute', top: 140, right: '12%', width: 160, height: 160, borderRadius: 32, background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(96,165,250,0.2)', pointerEvents: 'none' }} />
          <div className="float-b" style={{ position: 'absolute', bottom: 120, left: '4%', width: 100, height: 100, borderRadius: 24, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(147,197,253,0.12)', pointerEvents: 'none' }} />

          {/* Ring decorations */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          {/* Content */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px) 100px', position: 'relative', zIndex: 2 }}>
            <div className="hero-grid">

              {/* Left: Text */}
              <div>
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
                  style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.4rem)', fontWeight: 900, color: 'white', lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.5px' }}
                >
                  Attendance Tracking<br />
                  <span className="gradient-text">Built for BISU.</span>
                </motion.h1>

                <motion.p {...fadeUp(0.26)} style={{ color: 'rgba(147,197,253,0.7)', fontSize: 'clamp(14px, 1.8vw, 17px)', lineHeight: 1.75, marginBottom: 40, maxWidth: 420 }}>
                  The centralized platform for Bohol Island State University — manage student attendance, events, clearances, and organizational records seamlessly.
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
                      <p className="jk" style={{ color: 'white', fontWeight: 800, fontSize: 'clamp(18px, 2.5vw, 22px)', lineHeight: 1, margin: 0 }}>{v}</p>
                      <p style={{ color: 'rgba(147,197,253,0.55)', fontSize: 12, marginTop: 4 }}>{l}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right: Featured Slider */}
              <motion.div {...fadeUp(0.22)} className="hero-slider-col" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -24, borderRadius: 40, background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.25) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <FeaturedSlider />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Wave bottom */}
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'clamp(48px, 7vw, 90px)', marginBottom: -2 }}>
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
                  A complete suite of tools for student organization management at BISU.
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
                    Access the BISU<br />Attendance Portal
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
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="jk" style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>BISU Attendance</p>
                <p style={{ color: 'rgba(147,197,253,0.4)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Management System</p>
              </div>
            </div>

            <p style={{ color: 'rgba(147,197,253,0.3)', fontSize: 12, margin: 0 }}>
              © 2026 Bohol Island State University — Candijay Campus. All rights reserved.
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