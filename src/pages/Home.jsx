import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import franchises from '../data/franchises.json';
import auctionConfig from '../data/auctionConfig.json';

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

  const handleStart = () => {
    if (!selected) return;
    navigate('/auction', {
      state: {
        franchiseId: selected,
        teamName: teamName.trim() || franchises.find(f => f.id === selected)?.name,
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

          {/* Stats strip */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '48px' }}
          >
            {[
              { label: '279 Players', sub: 'From Cricsheet data' },
              { label: '314 Matches', sub: 'Ball-by-ball stats' },
              { label: '6 Franchises', sub: 'Full PSL roster' },
              { label: '18 CR Budget', sub: 'Per franchise' },
            ].map(({ label, sub }) => (
              <div key={label} className="badge">
                <span style={{ color: c.text, fontWeight: 600 }}>{label}</span>
                <span style={{ color: c.muted, fontSize: '12px' }}>· {sub}</span>
              </div>
            ))}
          </motion.div>
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
                    style={{ padding: '12px 32px', fontSize: '15px' }}
                  >
                    Start Auction →
                  </motion.button>
                </div>

                <p style={{
                  fontSize: '13px',
                  color: c.muted,
                  marginTop: '14px',
                }}>
                  Budget: <strong style={{ color: c.text }}>{auctionConfig.franchiseBudget} {auctionConfig.currency}</strong>
                  {' · '}Max squad: <strong style={{ color: c.text }}>{auctionConfig.maxSquadSize}</strong>
                  {' · '}Max overseas: <strong style={{ color: c.text }}>{auctionConfig.maxOverseasPlayers}</strong>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
