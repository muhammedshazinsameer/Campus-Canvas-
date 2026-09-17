import React, { useState } from 'react';
import { reportSubmission } from '../api/client';
import { Flag, X, ShieldAlert, CheckCircle2, AlertCircle, Loader2, LifeBuoy } from 'lucide-react';

const REASON_OPTIONS = [
  {
    id: 'Copyright / Plagiarism',
    label: 'Copyright / Plagiarism',
    desc: 'Unattributed copying, stolen creative work, or non-original material'
  },
  {
    id: 'Privacy / Personal Info',
    label: 'Privacy / Personal Info',
    desc: 'Exposes private personal details, phone numbers, or unconsented identities'
  },
  {
    id: 'Inappropriate Content',
    label: 'Inappropriate Content',
    desc: 'Explicit, sexually suggestive, or promotes harmful activities'
  },
  {
    id: 'Harassment',
    label: 'Harassment / Defamation',
    desc: 'Bullying, targeted hate speech, derogatory remarks, or slander'
  },
  {
    id: 'Other',
    label: 'Other Concern',
    desc: 'Other ethical, academic integrity, or editorial guideline issues'
  }
];

export default function ReportSubmissionModal({ submission, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!submission) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for reporting this submission.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await reportSubmission(submission.id, {
        reason,
        details: details.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(
        err.response?.data?.error ||
        'Failed to submit report. Please check your network and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        className="bg-[#fcfbf9] border border-[#d5ccba] rounded-sm shadow-2xl w-full max-w-lg overflow-hidden my-auto flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e2d2] flex items-center justify-between bg-[#faf7f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fbf2ef] border border-[#e8c8bf] flex items-center justify-center text-[#853528]">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="report-modal-title" className="font-editorial text-lg sm:text-xl font-bold text-[#1a1917]">
                Report Submission
              </h2>
              <p className="text-[11px] text-[#787163] line-clamp-1">
                "{submission.title}" · by {submission.authorDisplayName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#eee8db] rounded text-[#787163] hover:text-[#1a1917] transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 text-green-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-editorial text-xl font-bold text-[#1a1917] mb-1">
                Report Submitted to Editors
              </h3>
              <p className="text-xs text-[#524c42] font-serif max-w-sm mx-auto leading-relaxed">
                Thank you for upholding our campus creative community standards. The student editorial board will review this submission and take appropriate action.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#853528] text-white text-xs font-semibold rounded hover:bg-[#6e2c21] transition-colors shadow-sm"
            >
              Return to Showcase
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[78vh]">
            {error && (
              <div className="p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded-sm text-xs text-[#8c3525] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-[#524c42] font-serif leading-relaxed">
              Campus Canvas is committed to maintaining a safe, original, and respectful publishing showcase. Please identify your concern:
            </p>

            {/* Reasons List */}
            <div className="space-y-2">
              <label className="block text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38]">
                Reason for Report <span className="text-[#853528]">*</span>
              </label>
              <div className="space-y-1.5">
                {REASON_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                      reason === opt.id
                        ? 'bg-[#f8f3eb] border-[#853528] text-[#1a1917] shadow-xs'
                        : 'bg-[#fcfbf9] border-[#e8e2d2] text-[#433e38] hover:border-[#c5bbab]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.id}
                      checked={reason === opt.id}
                      onChange={() => setReason(opt.id)}
                      className="mt-0.5 accent-[#853528]"
                    />
                    <div className="text-xs">
                      <p className="font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-[#787163] font-serif leading-normal mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38]">
                  Additional Details (Optional)
                </label>
                <span className="text-[10px] text-[#8c8477]">
                  {details.length} / 1,000
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Describe why this piece violates guidelines or provide context..."
                className="w-full text-xs p-2.5 bg-white border border-[#d5ccba] rounded-sm focus:outline-hidden focus:border-[#853528] focus:ring-1 focus:ring-[#853528] text-[#1a1917] font-serif placeholder:font-sans placeholder:text-[#a09889]"
              />
            </div>

            {/* Optional Reporter Email */}
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38] mb-1.5">
                Your Contact Email (Optional)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                maxLength={100}
                placeholder="your.email@yenepoya.edu.in"
                className="w-full text-xs p-2.5 bg-white border border-[#d5ccba] rounded-sm focus:outline-hidden focus:border-[#853528] focus:ring-1 focus:ring-[#853528] text-[#1a1917]"
              />
              <p className="text-[10px] text-[#787163] mt-1 font-serif">
                Only shared with the editorial board if follow-up is needed.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#e8e2d2] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs text-[#635d54] hover:text-[#1a1917] hover:bg-[#eee8db] rounded-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#853528] hover:bg-[#6e2c21] disabled:opacity-50 text-white text-xs font-semibold rounded-sm transition-colors shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
