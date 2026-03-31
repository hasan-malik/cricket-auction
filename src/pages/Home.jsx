import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import franchises from '../data/franchises.json';
import auctionConfig from '../data/auctionConfig.json';
import { MODE_CONFIGS, SLOT_ICON, SLOT_LABEL } from '../data/modeConfig.js';

/**
 * Normal cap cursor — team color, no glow.
 */
function buildCapCursor(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="18" viewBox="0 0 28 18">
    <path d="M4 14 Q4 1 13 1 Q21 1 21 14 Z" fill="${color}"/>
    <path d="M4 14 Q2 14 2 15.5 Q2 17 4 16.5 Z" fill="${color}" fill-opacity="0.7"/>
    <rect x="3" y="13" width="25" height="3" rx="1.5" fill="${color}" fill-opacity="0.8"/>
    <circle cx="12" cy="2.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}') 27 14, auto`;
}

/**
 * Hover cap cursor — same shape with a soft glow halo behind it,
 * so the user knows they're over a clickable element.
 */
function buildCapCursorHover(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="22" viewBox="0 0 32 22">
    <ellipse cx="13" cy="16" rx="14" ry="7"   fill="${color}" fill-opacity="0.20"/>
    <ellipse cx="13" cy="16" rx="9"  ry="4.5" fill="${color}" fill-opacity="0.15"/>
    <path d="M4 14 Q4 1 13 1 Q21 1 21 14 Z" fill="${color}"/>
    <path d="M4 14 Q2 14 2 15.5 Q2 17 4 16.5 Z" fill="${color}" fill-opacity="0.7"/>
    <rect x="3" y="13" width="25" height="3" rx="1.5" fill="${color}" fill-opacity="0.8"/>
    <circle cx="12" cy="2.5" r="1.5" fill="rgba(255,255,255,0.65)"/>
  </svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}') 27 14, pointer`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [mode, setMode] = useState('fullXV'); // 'bullet' | 'blitz' | 'rapid' | 'fullXI' | 'fullXV'

  // Switch to team-colored cap cursor on franchise select, restore default on deselect.
  // A dynamic <style> tag bakes the hover variant (glowing cap) into CSS so that
  // clickable elements show the lit-up cursor while everything else shows the plain cap.
  useEffect(() => {
    if (selected) {
      const f = franchises.find(fr => fr.id === selected);
      if (f) {
        document.body.style.cursor = buildCapCursor(f.primaryColor);
        document.body.classList.add('custom-cursor');

        const style = document.createElement('style');
        style.id = 'cap-cursor-hover-style';
        style.textContent = `
          body.custom-cursor button:hover,
          body.custom-cursor a:hover,
          body.custom-cursor [role="button"]:hover,
          body.custom-cursor label:hover,
          body.custom-cursor select:hover { cursor: ${buildCapCursorHover(f.primaryColor)} !important; }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.body.style.cursor = '';
      document.body.classList.remove('custom-cursor');
      document.getElementById('cap-cursor-hover-style')?.remove();
    }
    return () => {
      document.body.style.cursor = '';
      document.body.classList.remove('custom-cursor');
      document.getElementById('cap-cursor-hover-style')?.remove();
    };
  }, [selected]);

  const handleStart = () => {
    if (!selected) return;
    navigate('/auction', {
      state: {
        franchiseId: selected,
        teamName:    teamName.trim() || franchises.find(f => f.id === selected)?.name,
        mode:        'blitz',
        blitzMode:   mode, // 'bullet' | 'blitz' | 'rapid' | 'fullXI' | 'fullXV'
      },
    });
  };

  const c = {
    text:       '#ffffff',
    muted:      'rgba(255,255,255,0.5)',
    cardBg:     'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.08)',
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      {/* ── Hero ─────────────────────────────────── */}
      <section className="section container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ maxWidth: '760px' }}
        >
          <motion.p variants={fadeUp} className="overline" style={{ marginBottom: '24px' }}>
            Pakistan Super League · Auction Simulator
          </motion.p>

          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: 'clamp(52px, 8vw, 96px)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              margin: '0 0 24px',
              color: c.text,
            }}
          >
            Build Your{' '}
            <span className="gradient-text-blue">Dream Squad.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{
              fontSize: '18px',
              lineHeight: 1.65,
              color: c.muted,
              maxWidth: '520px',
              margin: '0 0 40px',
            }}
          >
            Pick a franchise, set your strategy, and outbid the AI to assemble the
            ultimate PSL squad — powered by real Cricsheet match data.
          </motion.p>

          {/* Scout CTA */}
          <motion.div variants={fadeUp} style={{ marginBottom: '28px' }}>
            <Link
              to="/players"
              style={{ textDecoration: 'none' }}
            >
              <motion.span
                whileHover={{ x: 3, transition: { duration: 0.18 } }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4f8ef7',
                  cursor: 'pointer',
                }}
              >
                Scout all 279 players
                <span style={{ fontSize: '13px', opacity: 0.7 }}>→</span>
              </motion.span>
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '48px' }}
          >
            {[
              { label: '279 Players', sub: 'From Cricsheet data' },
              { label: '314 Matches', sub: 'Ball-by-ball stats' },
              { label: '6 Franchises', sub: 'Full PSL roster' },
              { label: `${auctionConfig.franchiseBudget} CR Budget`, sub: 'Per franchise' },
            ].map(({ label, sub }) => (
              <div key={label} className="badge">
                <span style={{ color: c.text, fontWeight: 600 }}>{label}</span>
                <span style={{ color: c.muted, fontSize: '12px' }}>· {sub}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Mode picker ───────────────────────────── */}
      <section className="section container" style={{ paddingBottom: '32px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.muted, marginBottom: '14px' }}>
            Game Mode
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[
              { id: 'bullet', label: '🔥 Bullet'  },
              { id: 'blitz',  label: '⚡ Blitz'   },
              { id: 'rapid',  label: '🐇 Rapid'   },
              { id: 'fullXI', label: 'Full XI'    },
              { id: 'fullXV', label: 'Full XV'    },
            ].map(m => {
              const active = mode === m.id;
              return (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    border: active
                      ? '1px solid rgba(245,158,11,0.7)'
                      : `1px solid ${c.cardBorder}`,
                    background: active
                      ? 'rgba(245,158,11,0.12)'
                      : c.cardBg,
                    color: active ? '#fbbf24' : c.muted,
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {m.label}
                </motion.button>
              );
            })}
          </div>
          {/* Mode info strip */}
          <p style={{ fontSize: '12px', color: c.muted }}>
            {(() => {
              const cfg   = MODE_CONFIGS[mode];
              const total = Object.values(cfg.poolRoles).reduce((a, b) => a + b, 0);
              const comp  = Object.entries(cfg.requiredSlots)
                .map(([s, n]) => `${n} ${SLOT_LABEL[s].toLowerCase()}${n > 1 ? 's' : ''}`)
                .join(' · ');
              return `${total} players · ${cfg.budget} CR budget · ${cfg.exactSquadSize} players each · ${cfg.timerSeconds}s timer · required: ${comp}`;
            })()}
          </p>
        </motion.div>
      </section>

      {/* ── Franchise picker ──────────────────────── */}
      <section className="section container" style={{ paddingBottom: '80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: c.muted,
            marginBottom: '20px',
          }}>
            Choose Your Franchise
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}>
            {franchises.map((f, i) => {
              const isChosen = selected === f.id;
              return (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(isChosen ? null : f.id)}
                  style={{
                    background: isChosen
                      ? `linear-gradient(135deg, ${f.primaryColor}22, ${f.primaryColor}11)`
                      : c.cardBg,
                    border: isChosen
                      ? `1px solid ${f.primaryColor}66`
                      : `1px solid ${c.cardBorder}`,
                    borderRadius: '16px',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
                    boxShadow: isChosen
                      ? `0 0 0 1px ${f.primaryColor}44, 0 8px 32px ${f.primaryColor}22`
                      : 'none',
                  }}
                >
                  {/* Color swatch */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${f.primaryColor}, ${f.primaryColor}88)`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    {f.shortName[0]}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isChosen ? f.primaryColor : c.text,
                      letterSpacing: '-0.02em',
                      marginBottom: '2px',
                    }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '12px', color: c.muted }}>
                      {f.city}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isChosen && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{
                          width: '22px', height: '22px',
                          borderRadius: '50%',
                          background: f.primaryColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', color: '#fff', flexShrink: 0,
                        }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Team name + CTA */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 16, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 8, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  paddingTop: '8px',
                }}>
                  <input
                    type="text"
                    placeholder="Custom team name (optional)"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStart()}
                    maxLength={30}
                    style={{
                      background: c.cardBg,
                      border: `1px solid ${c.cardBorder}`,
                      borderRadius: '9999px',
                      padding: '12px 20px',
                      fontSize: '15px',
                      color: c.text,
                      outline: 'none',
                      backdropFilter: 'blur(16px)',
                      width: '260px',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <motion.button
                    className="btn-primary"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    style={{ padding: '12px 32px', fontSize: '15px', background: '#d97706' }}
                  >
                    {mode === 'bullet' ? '🔥 Start Bullet →'
                      : mode === 'blitz'  ? '⚡ Start Blitz →'
                      : mode === 'rapid'  ? '🐇 Start Rapid →'
                      : mode === 'fullXI' ? 'Start Full XI →'
                      : 'Start Full XV →'}
                  </motion.button>
                </div>

                <p style={{ fontSize: '13px', color: c.muted, marginTop: '14px' }}>
                  {(() => {
                    const cfg   = MODE_CONFIGS[mode];
                    const total = Object.values(cfg.poolRoles).reduce((a, b) => a + b, 0);
                    return <>
                      Budget: <strong style={{ color: '#fbbf24' }}>{cfg.budget} CR</strong>
                      {' · '}Pool: <strong style={{ color: c.text }}>{total} players</strong>
                      {' · '}Squad: exactly <strong style={{ color: c.text }}>{cfg.exactSquadSize}</strong>
                      {' · '}Timer: <strong style={{ color: c.text }}>{cfg.timerSeconds}s</strong>
                      <br />
                      <span style={{ marginTop: '4px', display: 'inline-block' }}>
                        Required: {Object.entries(cfg.requiredSlots).map(([s, n], i) => (
                          <span key={s}>
                            {i > 0 && ' · '}
                            <strong style={{ color: c.text }}>{SLOT_ICON[s]} {n} {SLOT_LABEL[s].toLowerCase()}{n > 1 ? 's' : ''}</strong>
                          </span>
                        ))}
                        {cfg.wkCountsAsBatsman && <span style={{ color: c.muted }}> (WK counts as batsman)</span>}
                      </span>
                    </>;
                  })()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
