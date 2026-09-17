import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { X, AlertCircle, School, ArrowRight, ShieldCheck, Shield } from 'lucide-react';
import yenepoyaLogo from '../assets/yenepoya-logo.png';

// Official Google 4-color logo
function GoogleLogo({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function StudentAuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithSupabaseGoogle,
    oauthError
  } = useStudentAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync external OAuth errors (e.g. non-yenepoya email rejected)
  useEffect(() => {
    if (oauthError) {
      setError(oauthError);
    }
  }, [oauthError]);

  // Reset errors when modal opens/closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isAuthModalOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithSupabaseGoogle();
      // Browser will redirect to Google account chooser
    } catch (err) {
      console.error('Supabase Google OAuth initiation error:', err);
      setError(
        err.message ||
        'Failed to initiate Google Sign-In. Please check your network connection.'
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="bg-[#fcfbf9] border border-[#d5ccba] rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#faf7f0] border-b border-[#e8e2d2] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={yenepoyaLogo}
              alt="Yenepoya (Deemed to be University)"
              className="h-11 w-auto object-contain"
            />
            <div>
              <h3 className="font-editorial font-bold text-lg text-[#1a1917]">
                Student Sign In
              </h3>
              <p className="text-[11px] uppercase tracking-wider text-[#8c8477]">
                Campus Canvas Creative Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 hover:bg-[#eee8db] rounded-full text-[#787163] hover:text-[#1a1917] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Institutional Requirement Callout Box */}
          <div className="p-4 bg-[#fbf2ef] border-l-4 border-[#853528] rounded-r-sm text-xs text-[#635d54] leading-relaxed shadow-2xs">
            <p className="font-semibold text-[#853528] text-sm mb-1.5 flex items-center gap-1.5">
              <School className="w-4 h-4 flex-shrink-0 text-[#853528]" />
              <span>Yenepoya Email Required</span>
            </p>
            <p className="text-[#635d54] leading-relaxed">
              Please sign in using your official university email address ending in{' '}
              <strong className="font-mono text-[#853528] font-bold">@yenepoya.edu.in</strong>.
            </p>
            <p className="mt-1.5 text-[11px] text-[#8c3525]">
              Only Yenepoya student emails are acceptable. Personal Gmail or external accounts cannot access student features.
            </p>
          </div>

          {/* Error Message if non-yenepoya account was attempted */}
          {error && (
            <div className="p-3.5 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525] flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Google Sign-In Action Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white hover:bg-[#faf7f0] active:bg-[#f4efe4] text-[#1a1917] border-2 border-[#d5ccba] hover:border-[#9d4233] text-sm font-semibold rounded-sm shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer group"
            >
              <GoogleLogo className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span>{loading ? 'Connecting to Google...' : 'Sign in with Yenepoya Google'}</span>
              <ArrowRight className="w-4 h-4 text-[#8c8477] group-hover:text-[#9d4233] group-hover:translate-x-0.5 transition-all ml-1" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8c8477]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured via Supabase Authentication & Google Workspace</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#faf7f0] border-t border-[#ece7d9] px-6 py-3 flex items-center justify-between text-[11px] text-[#787163]">
          <span>Verified Student Submissions</span>
          <a
            href={import.meta.env.VITE_ADMIN_URL || 'https://campus-canvas-admin.vercel.app'}
            target="_blank"
            rel="noreferrer"
            className="text-[#853528] hover:underline flex items-center gap-1 font-semibold"
          >
            <Shield className="w-3 h-3" />
            <span>Editor Portal &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
