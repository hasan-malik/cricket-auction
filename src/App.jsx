import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Auction from './pages/Auction';
import Results from './pages/Results';
import './App.css';

// Fixed positions + animation params for ambient cricket icons
const PARTICLES = [
  { icon: '🏏', x:  7, y: 18, dur: 14, del:  0   },
  { icon: '🎳', x: 88, y: 12, dur: 18, del:  2.5  },
  { icon: '🏆', x: 14, y: 74, dur: 16, del:  5    },
  { icon: '🏏', x: 82, y: 68, dur: 20, del:  1.5  },
  { icon: '⭐', x: 50, y:  7, dur: 12, del:  3    },
  { icon: '🎳', x: 34, y: 87, dur: 22, del:  7    },
  { icon: '🏏', x: 68, y: 42, dur: 15, del:  4    },
  { icon: '🏆', x: 93, y: 83, dur: 19, del:  6    },
  { icon: '⭐', x: 23, y: 50, dur: 17, del:  9    },
  { icon: '🎳', x: 75, y: 25, dur: 13, del:  8    },
];

function CricketParticles() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="cricket-float"
          style={{
            left: `${p.x}%`,
            top:  `${p.y}%`,
            '--dur': `${p.dur}s`,
            '--del': `${p.del}s`,
          }}
        >
          {p.icon}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/cricket-auction">
        {/* Animated background layers */}
        <div className="bg-orbs"  aria-hidden="true" />
        <div className="stars"    aria-hidden="true" />
        <CricketParticles />

        <Navbar />

        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/auction" element={<Auction />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
