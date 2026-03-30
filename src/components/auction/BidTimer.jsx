import { motion } from 'framer-motion';

const SIZE   = 80;
const STROKE = 6;
const R      = (SIZE - STROKE) / 2;
const CIRC   = 2 * Math.PI * R;

export default function BidTimer({ timer, timerMax, timerKey }) {
  const pct   = timer / timerMax;
  const dash  = pct * CIRC;
  const color = timer > timerMax * 0.53 ? '#22c55e'
              : timer > timerMax * 0.27 ? '#f59e0b'
              :                           '#ef4444';

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE}
        />

        {/* Flash ring — pulses white on timer reset (key changes) */}
        <motion.circle
          key={timerKey}
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={STROKE}
          strokeDasharray={CIRC}
          strokeDashoffset={0}
          initial={{ opacity: 0.75, strokeDashoffset: 0 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Progress arc */}
        <motion.circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke={color} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC - dash}
          animate={{ strokeDashoffset: CIRC - dash, stroke: color }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </svg>

      {/* Number */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: 800,
        color,
        letterSpacing: '-0.04em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {timer}
      </div>
    </div>
  );
}
