import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

// ── LandingNav ────────────────────────────────────────────────────────────────
// Sticky navigation bar for the BISU Attendance Management System landing page.
// Fully responsive: collapses to hamburger menu on mobile (< md breakpoint).
// Props: none (self-contained)
// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '#features',   label: 'Features'       },
  { href: '#activities', label: 'SDS Activities'  },
  { href: '#about',      label: 'About'           },
];

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Detect scroll for frosted-glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu when a nav link is clicked
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        .bisu-nav *  { box-sizing: border-box; }
        .bisu-nav    { font-family: 'DM Sans', sans-serif; }

        /* ── Nav link underline animation ── */
        .bisu-nav-link {
          font-weight: 500;
          font-size: 14px;
          color: #475569;
          text-decoration: none;
          position: relative;
          padding-bottom: 2px;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .bisu-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: #2563eb;
          transition: width 0.25s;
        }
        .bisu-nav-link:hover              { color: #2563eb; }
        .bisu-nav-link:hover::after       { width: 100%; }

        /* ── CTA button ── */
        .bisu-nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 700;
          font-size: 14px;
          padding: 10px 22px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transition: transform 0.18s, box-shadow 0.18s;
          white-space: nowrap;
        }
        .bisu-nav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(37,99,235,0.45);
        }

        /* ── Mobile link ── */
        .bisu-nav-mobile-link {
          font-weight: 500;
          font-size: 16px;
          color: #334155;
          text-decoration: none;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          display: block;
          transition: color 0.2s;
        }
        .bisu-nav-mobile-link:hover { color: #2563eb; }

        /* ── Responsive hide / show ── */
        @media (max-width: 767px) {
          .bisu-nav-desktop { display: none !important; }
          .bisu-nav-hamburger { display: flex !important; }
        }
        @media (min-width: 768px) {
          .bisu-nav-desktop { display: flex !important; }
          .bisu-nav-hamburger { display: none !important; }
        }
      `}</style>

      <div className="bisu-nav">
        <motion.nav
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
            transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
          }}
        >
          {/* ── Main bar ── */}
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 32px)',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>

            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 16, color: '#091832', lineHeight: 1.1, margin: 0 }}>
                  BISU Attendance
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Management System
                </p>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="bisu-nav-desktop" style={{ gap: 36, alignItems: 'center', flexShrink: 0 }}>
              {NAV_LINKS.map(({ href, label }) => (
                <a key={href} href={href} className="bisu-nav-link">{label}</a>
              ))}
            </div>

            {/* Desktop CTA */}
            <Link to="/login" className="bisu-nav-cta bisu-nav-desktop" style={{ flexShrink: 0 }}>
              Portal Login <ArrowRight size={15} />
            </Link>

            {/* Hamburger (mobile only) */}
            <button
              className="bisu-nav-hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#091832',
                padding: 6,
                borderRadius: 8,
                display: 'none', // overridden by media query
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* ── Mobile drawer ── */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  overflow: 'hidden',
                  background: 'white',
                  borderTop: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ padding: '16px clamp(16px, 4vw, 32px) 24px', display: 'flex', flexDirection: 'column' }}>
                  {NAV_LINKS.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      className="bisu-nav-mobile-link"
                      onClick={handleLinkClick}
                    >
                      {label}
                    </a>
                  ))}
                  <Link
                    to="/login"
                    className="bisu-nav-cta"
                    onClick={handleLinkClick}
                    style={{ marginTop: 16, width: 'fit-content' }}
                  >
                    Portal Login <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </>
  );
}