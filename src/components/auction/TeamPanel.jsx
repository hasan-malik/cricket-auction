import { motion, AnimatePresence } from 'framer-motion';
import { SLOT_ICON, SLOT_LABEL } from '../../data/modeConfig.js';
import { countFilledSlots } from '../../utils/aiUtils';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

const c = {
  text:    '#fff',
  muted:   'rgba(255,255,255,0.45)',
  surface: 'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
};

// Gold palette for #1 team — mirrors AIPanel
const GOLD = {
  border: 'rgba(251,191,36,0.55)',
  bg:     'rgba(251,191,36,0.07)',
  glow:   '0 0 18px rgba(251,191,36,0.18)',
  text:   '#fbbf24',
};

export default function TeamPanel({ team, isUser, rank, score, ratingTotal, isBlitz, totalBudget, requiredSlots, wkCountsAsBatsman, onViewSquad }) {
  const pctLeft   = (team.budget / totalBudget) * 100;
  const isFirst   = rank === 1;
  const accentColor = isFirst ? GOLD.text : isUser ? '#3b82f6' : '#f59e0b';

  return (
    <div
      onClick={onViewSquad}
      style={{
        background: isFirst ? GOLD.bg : c.surface,
        border: `1px solid ${isFirst ? GOLD.border : c.border}`,
        boxShadow: isFirst ? GOLD.glow : undefined,
        borderRadius: '16px',
        padding: '16px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0,
        maxHeight: '560px',
        cursor: onViewSquad ? 'pointer' : 'default',
        transition: 'background 0.4s, border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: accentColor,
              }}>
                {isUser ? 'Your Squad' : 'AI Squad'}
              </span>
              {rank != null && (
                <motion.span
                  key={rank}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: isFirst ? GOLD.text : c.muted,
                    background: isFirst ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isFirst ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '9999px',
                    padding: '1px 6px',
                  }}
                >
                  #{rank}
                </motion.span>
              )}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: c.text,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '140px',
            }}>
              {team.name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: accentColor, letterSpacing: '-0.03em' }}>
              {team.budget.toFixed(2)}
              <span style={{ fontSize: '10px', fontWeight: 600, color: c.muted, marginLeft: '2px' }}>CR</span>
            </div>
            <div style={{ fontSize: '10px', color: c.muted }}>{team.squad.length} players</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: accentColor, marginTop: '2px' }}>
              {isBlitz ? (
                <>
                  ★ {ratingTotal ?? team.squad.reduce((sum, p) => sum + (p.rating ?? 0), 0)}
                  {' '}·{' '}
                  ⚡{' '}
                  <motion.span
                    key={score}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {score ?? 0}
                  </motion.span>
                  {' '}pts
                </>
              ) : (
                <>
                  ★{' '}
                  <motion.span
                    key={score}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {score ?? team.squad.reduce((sum, p) => sum + (p.rating ?? 0), 0)}
                  </motion.span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Budget bar */}
        <div style={{
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '9999px',
          marginTop: '10px',
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${pctLeft}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: pctLeft > 50 ? accentColor : pctLeft > 25 ? '#f59e0b' : '#ef4444',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>

      {/* Required slot template — blitz modes only */}
      {requiredSlots && (() => {
        const filled = countFilledSlots(team.squad, wkCountsAsBatsman ?? false);
        return (
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
          }}>
            {Object.entries(requiredSlots).map(([slot, count]) => {
              const filledCount = filled[slot] ?? 0;
              return Array.from({ length: count }, (_, i) => {
                const done = i < filledCount;
                return (
                  <div
                    key={`${slot}-${i}`}
                    title={`${SLOT_LABEL[slot]}${done ? ' (filled)' : ' (needed)'}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: done ? '#4ade80' : c.muted,
                      transition: 'all 0.3s',
                    }}
                  >
                    <span>{SLOT_ICON[slot]}</span>
                    <span>{done ? '✓' : '□'}</span>
                  </div>
                );
              });
            })}
          </div>
        );
      })()}

      {/* Squad list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingRight: '2px',
      }}>
        <AnimatePresence initial={false}>
          {team.squad.length === 0 ? (
            <div style={{ fontSize: '12px', color: c.muted, textAlign: 'center', padding: '16px 0' }}>
              No players yet
            </div>
          ) : (
            [...team.squad].reverse().map(player => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: isUser ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{ROLE_ICONS[player.role]}</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: c.text,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {player.name}
                </span>
                <span style={{ fontSize: '11px', color: accentColor, fontWeight: 700, flexShrink: 0 }}>
                  {player.soldPrice?.toFixed(2)}CR
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
