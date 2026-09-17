import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Feather, Compass, Search, PlusCircle, Shield, ShieldCheck, User, LogOut, CheckCircle2, Mail, X } from 'lucide-react';
import { useStudentAuth } from '../context/StudentAuthContext';
import yenepoyaLogo from '../assets/yenepoya-logo.png';

export default function Navbar() {
  const location = useLocation();
  const { studentUser, isAuthenticated, logout, openAuthModal } = useStudentAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Extract campus ID from user model (or fallback to email prefix)
  const campusId = studentUser?.campusId || (studentUser?.email?.includes('@')
    ? studentUser.email.split('@')[0]
    : (studentUser?.id?.slice(0, 8) || 'Student'));

  // Close profile details dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Handle clicking Campus Canvas logo/name: scroll to top if already on main page
  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="border-b border-[#e8e2d2] bg-[#faf7f0]/95 backdrop-blur-sm sticky top-0 z-40">
      {/* Top micro-bar */}
      <div className="border-b border-[#ece7d9] py-1 px-4 text-center text-xs tracking-widest text-[#787163] uppercase font-medium">
        <span>YENEPOYA SCHOOL OF ENGINEERING & TECHNOLOGY    | YENLIT</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Masthead */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="group text-center md:text-left flex items-center gap-3 sm:gap-4 cursor-pointer"
          title="Campus Canvas · Home"
        >
          {/* Yenepoya University Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img
              src={yenepoyaLogo}
              alt="Yenepoya (Deemed to be University)"
              className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {/* Elegant vertical separator */}
          <div className="h-9 w-[1px] bg-[#d5ccba]" />

          {/* Campus Canvas Icon & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full border border-[#d5ccba] bg-[#f4efe4] flex items-center justify-center text-[#9d4233] group-hover:scale-105 transition-transform flex-shrink-0">
              <Feather className="w-5 h-5" />
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1917] group-hover:text-[#9d4233] transition-colors">
              Campus Canvas
            </h1>
          </div>
        </Link>

        {/* Navigation Links & Student Account */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5 text-sm flex-wrap justify-center">
          {/* Submit Work (Primary CTA on left) */}
          <Link
            to="/submit"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#9d4233] text-[#9d4233] hover:bg-[#9d4233] hover:text-white transition-all duration-200 ${
              isActive('/submit') ? 'bg-[#9d4233] text-white' : ''
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="font-medium">Submit Work</span>
          </Link>

          {/* Subtle Divider */}
          <div className="h-5 w-[1px] bg-[#e2dcce] mx-0.5 sm:mx-1" />

          {/* Group moved towards the right: Explore & Search (as icon) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                isActive('/')
                  ? 'font-semibold text-[#9d4233] bg-[#f2ecdd]'
                  : 'text-[#433e38] hover:text-[#1a1917] hover:bg-[#f4efe4]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </Link>

            <Link
              to="/search"
              className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${
                isActive('/search')
                  ? 'font-semibold text-[#9d4233] bg-[#f2ecdd]'
                  : 'text-[#433e38] hover:text-[#1a1917] hover:bg-[#f4efe4]'
              }`}
              title="Search pieces, genres, and authors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Link>
          </div>

          {/* Thin Divider */}
          <div className="h-6 w-[1px] bg-[#d5ccba] mx-0.5 sm:mx-1" />

          {/* Top-Right Student Account Icon & Profile Popover */}
          <div className="relative" ref={profileRef}>
            {isAuthenticated ? (
              // SIGNED IN: Profile avatar toggles account details & portal dropdown
              <>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className={`w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#9d4233] to-[#712b20] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none relative ${
                    isProfileOpen ? 'ring-[#9d4233] ring-offset-2 ring-offset-[#faf7f0]' : 'ring-[#d5ccba] hover:ring-[#9d4233]'
                  }`}
                  title="Student Profile — Click to view details"
                  aria-label="Student Profile"
                  aria-expanded={isProfileOpen}
                >
                  {studentUser?.avatarUrl ? (
                    <img
                      src={studentUser.avatarUrl}
                      alt={studentUser.name || 'Student'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : studentUser?.name ? (
                    <span className="font-editorial text-sm font-semibold tracking-wide">
                      {studentUser.name.trim().charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  {/* Verified student emerald badge dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#faf7f0] rounded-full" />
                </button>

                {/* Profile Details Dropdown / Popover */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 bg-[#fcfbf9] border border-[#d5ccba] rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="bg-[#faf7f0] border-b border-[#e8e2d2] p-4 relative">
                      <button
                        type="button"
                        onClick={() => setIsProfileOpen(false)}
                        className="absolute top-3 right-3 p-1 text-[#8c8477] hover:text-[#1a1917] hover:bg-[#eee8db] rounded-full transition-colors"
                        title="Close profile details"
                        aria-label="Close profile details"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#9d4233] to-[#712b20] text-white flex items-center justify-center font-editorial font-bold text-xl shadow-inner flex-shrink-0">
                          {studentUser?.avatarUrl ? (
                            <img
                              src={studentUser.avatarUrl}
                              alt={studentUser.name || 'Student'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : studentUser?.name ? (
                            studentUser.name.trim().charAt(0).toUpperCase()
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0 pr-4">
                          <h4 className="text-sm font-bold text-[#1a1917] truncate font-editorial" title={studentUser?.name}>
                            {studentUser?.name || 'Student Author'}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {studentUser?.role === 'editor' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#853528] text-white">
                                Role: Editor
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#f4efe4] text-[#853528] border border-[#e2dcce]">
                                Campus ID: {campusId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Body */}
                    <div className="p-4 space-y-3 text-xs">
                      {/* Institutional details callout */}
                      <div className="space-y-2 bg-[#f6eee5]/70 border border-[#ecdccf] rounded-md p-2.5">
                        <div className="flex items-center gap-2 text-[#433e38]">
                          <Mail className="w-3.5 h-3.5 text-[#9d4233] flex-shrink-0" />
                          <span className="font-mono text-[11px] truncate text-[#1a1917]" title={studentUser?.email}>
                            {studentUser?.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {studentUser?.role === 'editor' ? (
                            <>
                              <Shield className="w-3.5 h-3.5 text-[#853528] flex-shrink-0" />
                              <span className="font-medium text-[11px] text-[#853528]">Verified Editorial Board Member</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2b6629] flex-shrink-0" />
                              <span className="font-medium text-[11px] text-[#245e22]">Verified Yenepoya Student</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quick Navigation Links */}
                      <div className="space-y-1 pt-1">
                        <Link
                          to="/submit"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded text-[#433e38] hover:bg-[#f4efe4] hover:text-[#9d4233] transition-colors font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <PlusCircle className="w-3.5 h-3.5 text-[#9d4233]" />
                            <span>Submit New Work</span>
                          </span>
                          <span className="text-[10px] text-[#8c8477]">Manuscript</span>
                        </Link>
                        <Link
                          to="/search"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded text-[#433e38] hover:bg-[#f4efe4] hover:text-[#9d4233] transition-colors font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-[#9d4233]" />
                            <span>Browse Issues & Archive</span>
                          </span>
                          <span className="text-[10px] text-[#8c8477]">Explore</span>
                        </Link>

                        {/* Editor Portal link conditionally rendered ONLY for role === 'editor' */}
                        {studentUser?.role === 'editor' && (
                          <a
                            href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded text-[#853528] bg-[#fbf2ec] hover:bg-[#f5e6dc] border border-[#ecdccf] transition-colors font-semibold"
                            title="Open Editor Review Dashboard"
                          >
                            <span className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-[#853528]" />
                              <span>Editor Dashboard</span>
                            </span>
                            <span className="text-[10px] text-[#853528] font-bold">Review &rarr;</span>
                          </a>
                        )}
                      </div>

                      {/* Sign out button */}
                      <div className="pt-2 border-t border-[#ece7d9]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#faf7f0] hover:bg-[#fbf2ef] text-[#853528] hover:text-[#712b20] border border-[#ecdccf] hover:border-[#e8c8bf] rounded font-semibold transition-colors shadow-2xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // SIGNED OUT: Profile/User Icon Button that toggles the access menu
              <>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className={`w-9 h-9 rounded-full border bg-[#f4efe4] hover:bg-[#eae2d1] text-[#787163] hover:text-[#9d4233] hover:border-[#9d4233] flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow transform hover:scale-105 active:scale-95 focus:outline-none ${
                    isProfileOpen ? 'border-[#9d4233] ring-2 ring-[#9d4233]/25' : 'border-[#d5ccba]'
                  }`}
                  title="Account & Portal Access"
                  aria-label="Account & Portal Access"
                  aria-expanded={isProfileOpen}
                >
                  <User className="w-4 h-4 text-[#9d4233]" />
                </button>

                {/* Signed Out Menu with Student Sign In and Discrete Editor Portal */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-64 bg-[#fcfbf9] border border-[#d5ccba] rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-[#faf7f0] border-b border-[#e8e2d2] p-3.5">
                      <h4 className="text-xs font-bold text-[#1a1917] font-editorial">
                        Campus Canvas Portal
                      </h4>
                      <p className="text-[11px] text-[#787163] mt-0.5">
                        Sign in for student features or authenticate as an editor.
                      </p>
                    </div>

                    <div className="p-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          openAuthModal();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#9d4233] hover:bg-[#853528] text-white rounded font-medium text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Student Sign In</span>
                      </button>

                      <div className="pt-2 border-t border-[#ece7d9]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            openAuthModal();
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-[#635d54] hover:text-[#853528] hover:bg-[#f4efe4] transition-colors cursor-pointer"
                          title="Open Editor Login"
                        >
                          <span className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#853528]" />
                            <span className="font-medium">Editor Sign In</span>
                          </span>
                          <span className="text-[10px] text-[#8c8477]">Login &rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
