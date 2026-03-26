import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import auctionConfig from '../../data/auctionConfig.json';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

export default function AIPanel({ aiTeams, bidder, isLight, aiScores, aiRatings, isBlitz }) {
  const [openTeamId, setOpenTeamId] = useState(null);

  const c = {
    text:    isLight ? '#111' : '#fff',
    muted:   isLight ? '#6b7280' : 'rgba(255,255,255,0.45)',
    surface: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    border:  isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    dropBg:  isLight ? '#fff' : '#1a1a2e',
    dropBorder: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
  };

  const teams = Object.values(aiTeams);

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      padding: '14px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: c.muted,
        marginBottom: '2px',
      }}>
        AI Franchises
      </div>

      {teams.map(team => {
        const isBidding = bidder === team.id;
        const isOpen = openTeamId === team.id;
        const pctLeft = (team.budget / auctionConfig.franchiseBudget) * 100;
        const color = team.franchise?.primaryColor ?? '#f59e0b';

        return (
          <div key={team.id} style={{ position: 'relative' }}>
            <motion.div
              animate={isBidding ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenTeamId(isOpen ? null : team.id)}
              style={{
                padding: '9px 11px',
                borderRadius: isOpen ? '10px 10px 0 0' : '10px',
                background: isBidding ? `${color}18` : isOpen ? (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)') : 'rgba(255,255,255,0.025)',
                border: isBidding ? `1px solid ${color}55` : isOpen ? `1px solid ${c.dropBorder}` : '1px solid rgba(255,255,255,0.05)',
                borderBottom: isOpen ? 'none' : undefined,
                transition: 'background 0.2s, border-color 0.2s',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isBidding ? color : c.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px',
                  transition: 'color 0.2s',
                }}>
                  {isBidding && <span style={{ marginRight: '4px' }}>🔨</span>}
                  {team.franchise?.shortName ?? team.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: isBidding ? color : c.muted }}>
                    {team.budget.toFixed(1)}CR
                  </div>
                  <div style={{ fontSize: '9px', color: c.muted, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▾
                  </div>
                </div>
              </div>

              {/* Budget bar */}
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '9999px', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${pctLeft}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: pctLeft > 50 ? color : pctLeft > 25 ? '#f59e0b' : '#ef4444',
                    borderRadius: '9999px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontSize: '10px', color: c.muted }}>
                  {team.squad.length} players
                </div>
                {aiScores && (
                  <div style={{ fontSize: '10px', fontWeight: 700, color: isBidding ? color : c.muted }}>
                    {isBlitz
                      ? <>★ {aiRatings?.[team.id] ?? 0} · ⚡ {aiScores[team.id] ?? 0} pts</>
                      : `★ ${aiScores[team.id] ?? 0}`
                    }
                  </div>
                )}
              </div>
            </motion.div>

            {/* Inline squad dropdown */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    background: c.dropBg,
                    border: `1px solid ${c.dropBorder}`,
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}>
                    {team.squad.length === 0 ? (
                      <div style={{ fontSize: '11px', color: c.muted, textAlign: 'center', padding: '10px 0' }}>
                        No players yet
                      </div>
                    ) : (
                      [...team.squad].reverse().map(p => (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '5px 8px',
                          background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${c.dropBorder}`,
                          borderRadius: '7px',
                        }}>
                          <span style={{ fontSize: '13px', flexShrink: 0 }}>{ROLE_ICONS[p.role]}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '10px', color: c.muted }}>
                              {p.role} · ★ {p.rating ?? '—'}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color, flexShrink: 0 }}>
                            {p.soldPrice?.toFixed(2)} CR
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
