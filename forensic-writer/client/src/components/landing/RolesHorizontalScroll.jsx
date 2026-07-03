import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Search, Gavel } from 'lucide-react';

const panels = [
  {
    icon: <ShieldAlert size={40} color="#22D3EE" />,
    title: 'System Administrator',
    tasks: ['Manage users and permissions', 'Assign system roles', 'Monitor overarching system activity'],
    preview: 'Admin Console Active',
  },
  {
    icon: <Search size={40} color="#3B82F6" />,
    title: 'Forensic Investigator',
    tasks: ['Create new investigation cases', 'Upload raw digital evidence', 'Analyze extracted metadata logs'],
    preview: 'Investigation Workspace',
  },
  {
    icon: <Gavel size={40} color="#a78bfa" />,
    title: 'Legal Authority',
    tasks: ['Review generated investigation reports', 'Verify evidence SHA-256 authenticity', 'Download court-ready documents'],
    preview: 'Review & Audit Log',
  },
];

export function RolesHorizontalScroll() {
  const outerRef = useRef(null);
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;

    const onScroll = () => {
      // getBoundingClientRect works regardless of overflow-x:hidden on body
      const top = outer.getBoundingClientRect().top;
      const outerH = outer.offsetHeight;
      const winH = window.innerHeight;

      // scrolled = how many px we've scrolled past the top of this section
      const scrolled = -top;
      const total = outerH - winH;
      const progress = Math.max(0, Math.min(1, scrolled / total));

      // Each panel is 100vw wide; shift by (panels-1) * 100vw total
      const vw = window.innerWidth;
      const shift = progress * (panels.length - 1) * vw;
      track.style.transform = `translateX(-${shift}px)`;

      setActiveIndex(Math.round(progress * (panels.length - 1)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="roles"
      ref={outerRef}
      style={{
        // 300vh gives us scroll room for 3 panels
        height: `${panels.length * 100}vh`,
        position: 'relative',
        background: '#0B1220',
      }}
    >
      {/* ── sticky viewport ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          // IMPORTANT: overflow hidden here, NOT on body
          overflow: 'hidden',
          borderTop: '1px solid #1F2937',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: 'center', paddingTop: '3.5rem', flexShrink: 0 }}>
          <p style={{
            color: '#22D3EE', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontSize: '0.8rem', marginBottom: '0.4rem',
          }}>
            Access Control
          </p>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.6rem, 4vw, 3rem)',
            fontWeight: 700, color: '#fff', margin: 0,
          }}>
            Role Based System Access
          </h3>
        </div>

        {/* ── sliding track ── */}
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            // exactly 3 × 100vw so each panel fills the viewport
            width: `${panels.length * 100}vw`,
            flex: 1,
            alignItems: 'center',
            // no CSS transition — JS drives it frame-by-frame via scroll
            willChange: 'transform',
          }}
        >
          {panels.map((panel, idx) => (
            <div
              key={idx}
              style={{
                width: '100vw',
                height: '100%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 clamp(1rem, 6vw, 6rem)',
                boxSizing: 'border-box',
              }}
            >
              {/* Card */}
              <div style={{
                width: '100%', maxWidth: '56rem',
                background: 'linear-gradient(135deg, rgba(31,41,55,0.6), #111827)',
                borderRadius: '1.5rem',
                border: '1px solid #1F2937',
                padding: 'clamp(1.5rem, 4vw, 3.5rem)',
                display: 'flex', flexDirection: 'row',
                alignItems: 'center', gap: '3rem',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 0 60px rgba(0,0,0,0.6)',
              }}>
                {/* glow */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '16rem', height: '16rem',
                  background: '#3B82F6', borderRadius: '50%',
                  opacity: 0.06, filter: 'blur(80px)', pointerEvents: 'none',
                }} />

                {/* left */}
                <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
                  <div style={{
                    display: 'inline-flex', padding: '1.25rem',
                    borderRadius: '1rem', background: '#0B1220',
                    border: '1px solid #1F2937',
                    boxShadow: 'inset 0 0 20px rgba(34,211,238,0.1)',
                    marginBottom: '1.5rem',
                  }}>
                    {panel.icon}
                  </div>
                  <h4 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 'clamp(1.4rem, 2.5vw, 2.25rem)',
                    fontWeight: 700, color: '#E5E7EB', marginBottom: '1.25rem',
                  }}>
                    {panel.title}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {panel.tasks.map((task, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9CA3AF', fontSize: '1rem' }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: '#22D3EE', flexShrink: 0,
                          boxShadow: '0 0 6px #22D3EE', display: 'block',
                        }} />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* right — mock terminal */}
                <div style={{
                  flex: 1, background: '#0B1220',
                  borderRadius: '0.75rem', padding: '1.5rem',
                  border: '1px solid #1F2937',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  position: 'relative', zIndex: 10,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #1F2937',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#22D3EE', letterSpacing: '0.05em' }}>
                      {panel.preview}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['#ef4444', '#eab308', '#22c55e'].map(c => (
                        <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.8, display: 'block' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {['75%', '50%', '83%'].map((w, i) => (
                      <div key={i} style={{ height: '0.9rem', background: '#1F2937', borderRadius: 4, width: w }} />
                    ))}
                  </div>
                  <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #1F2937' }}>
                    <div style={{
                      height: '2.5rem',
                      background: 'rgba(59,130,246,0.2)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(59,130,246,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: '#3B82F6', fontSize: '0.875rem', fontWeight: 600 }}>Access Authorized</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* dots + hint */}
        <div style={{ textAlign: 'center', paddingBottom: '1.75rem', flexShrink: 0 }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(148,163,184,0.4)', marginBottom: '0.75rem' }}>
            Scroll to Explore Roles ↓
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {panels.map((_, i) => (
              <div key={i} style={{
                height: 8,
                width: i === activeIndex ? 24 : 8,
                borderRadius: 4,
                background: i === activeIndex ? '#22D3EE' : 'rgba(255,255,255,0.18)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
