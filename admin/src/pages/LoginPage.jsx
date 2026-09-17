import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Feather, Shield, AlertCircle, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please check your editor credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-[#f4efe4] border border-[#d5ccba] flex items-center justify-center text-[#853528] mx-auto mb-3">
          <Feather className="w-6 h-6" />
        </div>
        <h2 className="font-editorial text-3xl font-bold tracking-tight text-[#1a1917]">
          Campus Canvas
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#853528] font-semibold">
          A Canvas for Every Creative Mind
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-[#8c8477]">
          Editorial Review Desk
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#fcfbf9] border border-[#e8e2d2] py-8 px-6 sm:px-10 rounded-sm shadow-md">
          {error && (
            <div className="mb-4 p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
                Editor Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8c8477] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#853528]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8c8477] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#853528]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8477] hover:text-[#1a1917] p-0.5 rounded transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#853528] hover:bg-[#6c281d] text-white font-serif font-bold text-sm rounded shadow transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Editor...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Enter Review Desk</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#ece6d8] text-center">
            <a
              href={import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}
              className="text-xs text-[#8c8477] hover:text-[#1a1917] transition-colors font-sans"
            >
              &larr; Return to Campus Canvas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
