import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import franchises from '../data/franchises.json';
import auctionConfig from '../data/auctionConfig.json';

/**
 * Build a side-profile cricket cap cursor (like 🧢 emoji):
 * dome on the left, visor extending right, hotspot at visor tip.
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

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [selected, setSelected] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [mode, setMode] = useState('full'); // 'full' | 'bullet' | 'blitz' | 'rapid'

  // Switch to team-colored cap cursor on franchise select, restore bat on deselect
  useEffect(() => {
    if (selected) {
      const f = franchises.find(fr => fr.id === selected);
      if (f) document.body.style.cursor = buildCapCursor(f.primaryColor);
    } else {
      document.body.style.cursor = '';
    }
    return () => { document.body.style.cursor = ''; };
  }, [selected]);

  const handleStart = () => {
    if (!selected) return;
    const isBlitz = mode !== 'full';
    navigate('/auction', {
      state: {
        franchiseId: selected,
        teamName: teamName.trim() || franchises.find(f => f.id === selected)?.name,
        mode: isBlitz ? 'blitz' : 'full',
        blitzSize: mode === 'rapid' ? 50 : mode === 'bullet' ? 15 : 30, // blitz → 30
      },
    });
  };

  const c = {
    text:    isLight ? '#111827' : '#ffffff',
    muted:   isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
    cardBg:  isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.04)',
    cardBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
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
              { id: 'bullet', label: '🔥 Bullet',      sub: '15 players · 8 CR · 3 squad · 6s · scored' },
              { id: 'blitz',  label: '⚡ Blitz',       sub: '30 players · 15 CR · 6 squad · 8s · scored' },
              { id: 'rapid',  label: '🐇 Rapid',       sub: '50 players · 25 CR · 9 squad · 10s · scored' },
              { id: 'full',   label: 'Full Auction',  sub: `279 players · ${auctionConfig.franchiseBudget} CR · 20 squad · 15s` },
            ].map(m => {
              const active = mode === m.id;
              const isBlitz = m.id !== 'full';
              return (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    border: active
                      ? `1px solid ${isBlitz ? 'rgba(245,158,11,0.7)' : 'rgba(59,130,246,0.7)'}`
                      : `1px solid ${c.cardBorder}`,
                    background: active
                      ? isBlitz ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)'
                      : c.cardBg,
                    color: active
                      ? isBlitz ? '#fbbf24' : '#60a5fa'
                      : c.muted,
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
            {mode === 'full'   && `279 players · ${auctionConfig.franchiseBudget} CR budget · up to 20 players · 15s timer`}
            {mode === 'bullet' && '15 top-rated players · 8 CR budget · 3 player cap · 6s timer · value-scored results'}
            {mode === 'blitz'  && '30 top-rated players · 15 CR budget · 6 player cap · 8s timer · value-scored results'}
            {mode === 'rapid'  && '50 top-rated players · 25 CR budget · 9 player cap · 10s timer · value-scored results'}
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
                    style={{ padding: '12px 32px', fontSize: '15px', background: mode !== 'full' ? '#d97706' : undefined }}
                  >
                    {mode === 'full' ? 'Start Auction →' : mode === 'bullet' ? '🔥 Start Bullet →' : mode === 'blitz' ? '⚡ Start Blitz →' : '🐇 Start Rapid →'}
                  </motion.button>
                </div>

                <p style={{ fontSize: '13px', color: c.muted, marginTop: '14px' }}>
                  {mode === 'full' && <>
                    Budget: <strong style={{ color: c.text }}>{auctionConfig.franchiseBudget} {auctionConfig.currency}</strong>
                    {' · '}Squad: <strong style={{ color: c.text }}>{auctionConfig.minSquadSize}–{auctionConfig.maxSquadSize}</strong>
                    {' · '}Overseas: <strong style={{ color: c.text }}>{auctionConfig.minOverseasPlayers}–{auctionConfig.maxOverseasPlayers}</strong>
                  </>}
                  {mode === 'bullet' && <>
                    Budget: <strong style={{ color: '#fbbf24' }}>8 CR</strong>
                    {' · '}Players: <strong style={{ color: c.text }}>15</strong>
                    {' · '}Squad cap: <strong style={{ color: c.text }}>3</strong>
                    {' · '}Timer: <strong style={{ color: c.text }}>6s</strong>
                  </>}
                  {mode === 'blitz' && <>
                    Budget: <strong style={{ color: '#fbbf24' }}>15 CR</strong>
                    {' · '}Players: <strong style={{ color: c.text }}>30</strong>
                    {' · '}Squad cap: <strong style={{ color: c.text }}>6</strong>
                    {' · '}Timer: <strong style={{ color: c.text }}>8s</strong>
                  </>}
                  {mode === 'rapid' && <>
                    Budget: <strong style={{ color: '#fbbf24' }}>25 CR</strong>
                    {' · '}Players: <strong style={{ color: c.text }}>50</strong>
                    {' · '}Squad cap: <strong style={{ color: c.text }}>9</strong>
                    {' · '}Timer: <strong style={{ color: c.text }}>10s</strong>
                  </>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
