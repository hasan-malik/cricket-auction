import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import auctionConfig from '../data/auctionConfig.json';
import { GiCricketBat, GiTennisBall, GiBaseballGlove } from 'react-icons/gi';
import { FaStar } from 'react-icons/fa6';

const ROLE_ICONS = {
  'batsman':       <GiCricketBat />,
  'wicket-keeper': <GiBaseballGlove />,
  'all-rounder':   <FaStar />,
  'bowler':        <GiTennisBall />,
};

const ROLE_ORDER = ['wicket-keeper', 'batsman', 'all-rounder', 'bowler'];

const c = {
  text:   '#fff',
  muted:  'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.08)',
};

function sortSquad(squad) {
  return [...squad].sort((a, b) => {
    const ri = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return ri !== 0 ? ri : b.soldPrice - a.soldPrice;
  });
}

/** Single stat chip used in the squad card header. */
function StatChip({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 16px',
      background: accent ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px',
      minWidth: '90px',
    }}>
      <span style={{ fontSize: '20px', fontWeight: 800, color: accent ? '#60a5fa' : '#fff', letterSpacing: '-0.03em' }}>
        {value}
      </span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
        {label}
      </span>
    </div>
  );
}

/** Collapsible squad card. Collapsed shows summary; expanded shows full player list. */
function SquadCard({ team, isUser, isOpen, onToggle }) {
  const sorted      = sortSquad(team.squad);
  const spent       = Math.round((auctionConfig.franchiseBudget - team.budget) * 1000) / 1000;
  const rating      = team.squad.reduce((sum, p) => sum + (p.rating ?? 0), 0);
  const accentColor = isUser ? '#3b82f6' : (team.franchise?.primaryColor ?? '#f59e0b');

  const roleCounts = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = sorted.filter(p => p.role === role).length;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: isUser ? 0.1 : 0.2 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${isOpen ? accentColor + '44' : c.border}`,
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Clickable header */}
      <div
        onClick={onToggle}
        style={{
          padding: '24px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor, marginBottom: '4px' }}>
              {isUser ? 'Your Squad' : `AI · ${team.franchise?.shortName ?? 'AI'}`}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>
              {team.name}
            </div>
          </div>
          <div style={{
            fontSize: '11px',
            color: c.muted,
            marginTop: '4px',
            transition: 'transform 0.25s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ▾
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
          <StatChip label="Players" value={sorted.length} accent />
          <StatChip label="Rating"  value={`★ ${rating}`} accent />
          <StatChip label="Spent"   value={`${spent}CR`} />
          <StatChip label="Left"    value={`${team.budget.toFixed(2)}CR`} />
        </div>
      </div>

      {/* Collapsible player list */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="squad-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 24px 24px' }}>
              {/* Role breakdown chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {ROLE_ORDER.map(role => (
                  roleCounts[role] > 0 && (
                    <span key={role} style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)',
                    }}>
                      {ROLE_ICONS[role]} {roleCounts[role]} {role.replace('-', ' ')}
                    </span>
                  )
                ))}
              </div>

              {/* Player rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sorted.length === 0 ? (
                  <div style={{ fontSize: '13px', color: c.muted, textAlign: 'center', padding: '24px 0' }}>
                    No players acquired
                  </div>
                ) : (
                  sorted.map((player, i) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                      }}
                    >
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{ROLE_ICONS[player.role]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {player.name}
                        </div>
                        <div style={{ fontSize: '11px', color: c.muted, textTransform: 'capitalize' }}>
                          {player.role.replace('-', ' ')} · {player.nationality}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em' }}>
                          {player.soldPrice?.toFixed(2)} CR
                        </div>
                        <div style={{ fontSize: '10px', color: c.muted }}>
                          ★ {player.rating ?? '—'} · base {player.basePrice?.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Results() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();

  if (!routeState?.user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No auction data found.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Start an Auction</button>
      </div>
    );
  }

  const { user, aiTeams } = routeState;
  const aiTeamList  = Object.values(aiTeams ?? {});
  const totalRating = (team) => team.squad.reduce((sum, p) => sum + (p.rating ?? 0), 0);
  const bestAI      = aiTeamList.reduce((best, t) => (!best || totalRating(t) > totalRating(best) ? t : best), null);
  const userWon     = !bestAI || totalRating(user) >= totalRating(bestAI);

  // All cards open by default so the user sees everything immediately;
  // individual cards can be collapsed by clicking their header.
  const allTeams = [user, ...aiTeamList];
  const [openIds, setOpenIds] = useState(() => new Set(allTeams.map(t => t.id)));

  function toggleTeam(id) {
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="container">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <p className="overline" style={{ marginBottom: '16px' }}>Auction Complete</p>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: c.text,
            margin: '0 0 16px',
          }}>
            {userWon ? (
              <>You <span className="gradient-text-blue">dominated</span> the auction.</>
            ) : (
              <>The AI <span style={{ color: '#f59e0b' }}>outbid</span> you.</>
            )}
          </h1>
          <p style={{ fontSize: '17px', color: c.muted, maxWidth: '520px', margin: '0 auto 32px' }}>
            You spent <strong style={{ color: '#60a5fa' }}>{Math.round((auctionConfig.franchiseBudget - user.budget) * 1000) / 1000} CR</strong> on{' '}
            <strong style={{ color: c.text }}>{user.squad.length} players</strong>.{' '}
            {bestAI && <>Best AI ({bestAI.name}) got <strong style={{ color: c.text }}>{bestAI.squad.length} players</strong> with rating <strong style={{ color: '#f59e0b' }}>★ {totalRating(bestAI)}</strong>.</>}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Play Again
            </button>
            <button className="btn-ghost" onClick={() => navigate('/auction', { state: { franchiseId: user.franchise?.id, teamName: user.name } })}>
              Rematch
            </button>
          </div>
        </motion.div>

        {/* Squad list — click any card header to expand / collapse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SquadCard
            team={user}
            isUser
            isOpen={openIds.has(user.id)}
            onToggle={() => toggleTeam(user.id)}
          />
          {aiTeamList.map(team => (
            <SquadCard
              key={team.id}
              team={team}
              isUser={false}
              isOpen={openIds.has(team.id)}
              onToggle={() => toggleTeam(team.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
