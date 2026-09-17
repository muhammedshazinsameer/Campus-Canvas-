import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../context/StudentAuthContext';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Lock,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';

export default function SecuritySettingsModal() {
  const {
    studentUser,
    isSecurityModalOpen,
    closeSecurityModal,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor
  } = useStudentAuth();

  const [setupStep, setSetupStep] = useState('overview'); // 'overview' | 'setup' | 'disable_confirm'
  const [qrCodeData, setQrCodeData] = useState(null);
  const [setupSecret, setSetupSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset modal state when closed or opened
  useEffect(() => {
    if (!isSecurityModalOpen) {
      setSetupStep('overview');
      setQrCodeData(null);
      setSetupSecret('');
      setVerificationCode('');
      setDisablePassword('');
      setDisableCode('');
      setError(null);
      setSuccessMessage(null);
      setCopied(false);
    }
  }, [isSecurityModalOpen]);

  if (!isSecurityModalOpen) return null;

  const is2FAActive = Boolean(studentUser?.twoFactorEnabled);

  // Handle initiating 2FA setup (fetch secret & QR code)
  const handleStartSetup = async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      setLoading(true);
      const data = await setupTwoFactor();
      setQrCodeData(data.qrCode);
      setSetupSecret(data.secret);
      setSetupStep('setup');
    } catch (err) {
      console.error('Setup 2FA failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to start 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying the first TOTP code to commit 2FA activation
  const handleVerifyAndEnable = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanCode = verificationCode.replace(/\s+/g, '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit code from Google Authenticator.');
      return;
    }

    try {
      setLoading(true);
      const res = await enableTwoFactor(cleanCode);
      setSuccessMessage(res.message || 'Two-Factor Authentication is now enabled!');
      setSetupStep('overview');
    } catch (err) {
      console.error('Enable 2FA verification failed:', err);
      setError(err.response?.data?.error || err.message || 'Invalid verification code. Please check your authenticator app.');
    } finally {
      setLoading(false);
    }
  };

  // Handle disabling 2FA with password authentication
  const handleDisableConfirm = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      const res = await disableTwoFactor({
        password: disablePassword,
        code: disableCode
      });
      setSuccessMessage(res.message || 'Two-Factor Authentication has been disabled.');
      setSetupStep('overview');
      setDisablePassword('');
      setDisableCode('');
    } catch (err) {
      console.error('Disable 2FA failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to disable 2FA. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Copy secret key helper
  const handleCopySecret = () => {
    if (!setupSecret) return;
    navigator.clipboard.writeText(setupSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#fcfbf9] border border-[#d5ccba] rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#faf7f0] border-b border-[#e8e2d2] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f2ecdd] border border-[#d5ccba] flex items-center justify-center text-[#9d4233] flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial font-bold text-lg text-[#1a1917]">
                Account Security
              </h3>
              <p className="text-[11px] uppercase tracking-wider text-[#8c8477]">
                Two-Factor Authentication (TOTP)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSecurityModal}
            className="p-1 hover:bg-[#eee8db] rounded text-[#787163] hover:text-[#1a1917] transition-colors cursor-pointer"
            title="Close security settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#edf6ed] border border-[#b8deb7] rounded text-xs text-[#245e22] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* VIEW 1: OVERVIEW */}
          {setupStep === 'overview' && (
            <div className="space-y-4">
              {/* Status Card */}
              <div className={`p-4 rounded border transition-colors ${
                is2FAActive
                  ? 'bg-[#edf6ed]/60 border-[#b8deb7]'
                  : 'bg-[#faf7f0] border-[#d5ccba]'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-editorial font-bold text-sm text-[#1a1917]">
                        Google Authenticator (2FA)
                      </span>
                      {is2FAActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2e7d32] text-white flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8c8477] text-white">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#635d54] mt-1 leading-relaxed">
                      {is2FAActive
                        ? 'Your account is fortified with time-based verification codes. Every sign-in requires your password plus a 6-digit code from Google Authenticator.'
                        : 'Protect your student account from unauthorized access. When enabled, signing in will require a 6-digit verification code from Google Authenticator.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!is2FAActive ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleStartSetup}
                  className="w-full py-2.5 px-4 bg-[#9d4233] hover:bg-[#853528] text-white text-xs font-bold font-serif rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Initializing Setup...</span>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Enable Two-Factor Authentication</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setSetupStep('disable_confirm'); setError(null); }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#fbf2ef] text-[#8c3525] border border-[#e8c8bf] hover:border-[#8c3525] text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Disable Two-Factor Authentication</span>
                </button>
              )}
            </div>
          )}

          {/* VIEW 2: SETUP FLOW */}
          {setupStep === 'setup' && (
            <form onSubmit={handleVerifyAndEnable} className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9d4233] bg-[#f4efe4] px-2 py-0.5 rounded">
                  Step 1 of 2 · Scan QR Code
                </span>
                <p className="text-xs text-[#635d54] pt-1">
                  Open <strong>Google Authenticator</strong> on your phone and scan the code below:
                </p>
              </div>

              {/* QR Code Display */}
              {qrCodeData && (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="p-3 bg-white rounded border border-[#d5ccba] shadow-sm inline-block">
                    <img
                      src={qrCodeData}
                      alt="Google Authenticator QR Code"
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  {/* Manual entry secret */}
                  <div className="mt-3 text-center">
                    <p className="text-[11px] text-[#8c8477]">
                      Cannot scan? Enter setup key manually:
                    </p>
                    <div className="inline-flex items-center gap-1.5 mt-1 bg-[#faf7f0] border border-[#d5ccba] px-3 py-1 rounded">
                      <span className="font-mono text-xs font-bold text-[#853528] tracking-widest select-all">
                        {setupSecret}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-0.5 text-[#787163] hover:text-[#1a1917] cursor-pointer"
                        title="Copy key"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Verification */}
              <div className="pt-2 border-t border-[#e8e2d2] space-y-2">
                <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold text-center">
                  Step 2 · Enter 6-Digit Code from Authenticator
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full py-2.5 px-4 bg-[#faf7f0] border-2 border-[#d5ccba] focus:border-[#9d4233] rounded text-center text-2xl font-mono tracking-[0.35em] text-[#1a1917] focus:outline-none shadow-inner"
                />
                <p className="text-[11px] text-[#787163] text-center">
                  Enter the 6 digits generated by Google Authenticator to confirm setup.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setSetupStep('overview'); setError(null); }}
                  className="w-1/3 py-2.5 bg-white hover:bg-[#faf7f0] text-[#787163] border border-[#d5ccba] text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-2/3 py-2.5 bg-[#9d4233] hover:bg-[#853528] text-white text-xs font-bold font-serif rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Activate 2FA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: DISABLE 2FA CONFIRMATION */}
          {setupStep === 'disable_confirm' && (
            <form onSubmit={handleDisableConfirm} className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525] leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>Disable Two-Factor Authentication</span>
                </p>
                <p>
                  Disabling 2FA will reduce your account security. Please verify your credentials to confirm.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8c8477] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-9 pr-3 py-2 bg-[#faf7f0] border border-[#d5ccba] focus:border-[#9d4233] rounded text-xs text-[#1a1917] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setSetupStep('overview'); setError(null); }}
                  className="w-1/2 py-2.5 bg-white hover:bg-[#faf7f0] text-[#787163] border border-[#d5ccba] text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !disablePassword}
                  className="w-1/2 py-2.5 bg-[#8c3525] hover:bg-[#712b20] text-white text-xs font-bold rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <span>Disabling...</span>
                  ) : (
                    <span>Confirm & Disable 2FA</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
