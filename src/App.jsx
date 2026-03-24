import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Auction from './pages/Auction';
import Results from './pages/Results';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/cricket-auction">
        {/* Animated background layers */}
        <div className="bg-orbs" aria-hidden="true" />
        <div className="stars"   aria-hidden="true" />

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
