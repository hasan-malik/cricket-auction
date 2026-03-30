import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10,10,15,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#fff',
        }}>
          PSL<span style={{ color: '#3b82f6' }}>.</span>
        </span>
      </Link>

      {/* Right: nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {(pathname === '/' || pathname === '/players') && (
          <Link
            to="/players"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: pathname === '/players' ? '#fff' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: pathname === '/players' ? 'rgba(255,255,255,0.08)' : 'transparent',
              transition: 'color 0.2s, background 0.2s',
            }}
          >
            Scout
          </Link>
        )}

        {pathname === '/auction' && (
          <Link to="/" style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: '9999px',
            transition: 'color 0.2s',
          }}>
            ← Home
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
