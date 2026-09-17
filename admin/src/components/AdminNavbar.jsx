import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Archive, LogOut, ExternalLink, Feather, Flag } from 'lucide-react';
import yenepoyaLogo from '../assets/yenepoya-logo.png';

export default function AdminNavbar({ pendingCount = 0, pendingReportsCount = 0 }) {
  const { user, logoutUser } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-[#fcfbf9] border-b border-[#e8e2d2] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 sm:gap-3.5 group cursor-pointer"
          title="Campus Canvas · Editorial Home"
        >
          {/* Yenepoya University Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img
              src={yenepoyaLogo}
              alt="Yenepoya (Deemed to be University)"
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {/* Vertical divider */}
          <div className="h-7 w-[1px] bg-[#d5ccba]" />

          {/* Campus Canvas Icon & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#f4efe4] border border-[#d5ccba] flex items-center justify-center text-[#853528] group-hover:scale-105 transition-transform flex-shrink-0">
              <Feather className="w-4 h-4" />
            </div>
            <h1 className="font-editorial text-xl font-bold tracking-tight text-[#1a1917] group-hover:text-[#853528] transition-colors">
              Campus Canvas
            </h1>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 text-xs font-sans flex-wrap justify-center">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
              isActive('/')
                ? 'bg-[#853528] text-white font-semibold shadow-sm'
                : 'text-[#433e38] hover:bg-[#f4efe4]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Queue</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive('/') ? 'bg-white text-[#853528]' : 'bg-[#853528] text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            to="/archive"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              isActive('/archive')
                ? 'bg-[#853528] text-white font-semibold shadow-sm'
                : 'text-[#433e38] hover:bg-[#f4efe4]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Review Archive</span>
          </Link>

          <Link
            to="/reports"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              isActive('/reports')
                ? 'bg-[#853528] text-white font-semibold shadow-sm'
                : 'text-[#433e38] hover:bg-[#f4efe4]'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Reports</span>
            {pendingReportsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive('/reports') ? 'bg-white text-[#853528]' : 'bg-[#9d4233] text-white'
              }`}>
                {pendingReportsCount}
              </span>
            )}
          </Link>

          <a
            href={import.meta.env.VITE_FRONTEND_URL || 'https://campus-canvas-chi.vercel.app'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-[#787163] hover:text-[#1a1917] hover:bg-[#f4efe4] rounded transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 text-xs border-t md:border-t-0 pt-2 md:pt-0 border-[#f0eadc]">
          <div className="text-right">
            <p className="font-semibold text-[#1a1917]">{user?.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#853528] font-medium">Editor in Chief</p>
          </div>
          <button
            onClick={logoutUser}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-[#d5ccba] text-[#635d54] hover:text-[#853528] hover:border-[#853528] rounded transition-colors"
            title="Sign out of editorial account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
