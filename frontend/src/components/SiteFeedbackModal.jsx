import React, { useState } from 'react';
import { submitGeneralFeedback } from '../api/client';
import { useStudentAuth } from '../context/StudentAuthContext';
import { LifeBuoy, X, CheckCircle2, AlertCircle, Loader2, Sparkles, Bug, MessageSquare, HelpCircle } from 'lucide-react';

const FEEDBACK_CATEGORIES = [
  {
    id: 'Bug / Functional Issue',
    label: 'Bug / Functional Issue',
    desc: 'Glitch, broken button, upload failure, or unexpected behavior',
    icon: Bug
  },
  {
    id: 'Feature Suggestion',
    label: 'Feature Suggestion',
    desc: 'Ideas for new categories, reading modes, or showcase improvements',
    icon: Sparkles
  },
  {
    id: 'General Feedback',
    label: 'General Feedback',
    desc: 'Thoughts on the design, reading experience, or overall usability',
    icon: MessageSquare
  },
  {
    id: 'Content / Editorial Query',
    label: 'Content / Editorial Query',
    desc: 'Questions regarding publishing guidelines, ethics, or review process',
    icon: HelpCircle
  },
  {
    id: 'Other',
    label: 'Other Concern',
    desc: 'Any other question, suggestion, or feedback for the team',
    icon: LifeBuoy
  }
];

export default function SiteFeedbackModal({ onClose }) {
  const { student } = useStudentAuth();
  const [reason, setReason] = useState('Bug / Functional Issue');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState(student?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a category for your report or suggestion.');
      return;
    }
    if (!details.trim() || details.trim().length < 5) {
      setError('Please provide at least 5 characters describing the issue or suggestion.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await submitGeneralFeedback({
        reason,
        subject: subject.trim() || undefined,
        details: details.trim(),
        reporterEmail: reporterEmail.trim() || undefined
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit website feedback:', err);
      setError(
        err.response?.data?.error ||
        'Failed to submit your feedback. Please check your connection and try again.'
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
        aria-labelledby="feedback-modal-title"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e2d2] flex items-center justify-between bg-[#faf7f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fbf2ef] border border-[#e8c8bf] flex items-center justify-center text-[#853528]">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="font-editorial text-lg sm:text-xl font-bold text-[#1a1917]">
                Help, Suggestions & Feedback
              </h2>
              <p className="text-[11px] text-[#787163] font-serif">
                Campus Canvas · Help Us Improve the Platform
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
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-[#524c42] font-serif max-w-sm mx-auto leading-relaxed">
                Your feedback has been logged and routed to our editorial and development teams. We appreciate you taking the time to help make Campus Canvas better for everyone.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#853528] text-white text-xs font-semibold rounded hover:bg-[#6e2c21] transition-colors shadow-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[78vh]">
            {error && (
              <div className="p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded-sm text-xs text-[#8c3525] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-[#524c42] font-serif leading-relaxed">
              Encountered a functional issue with the website, or have an idea to improve student creative publishing? Share your notes below:
            </p>

            {/* Categories */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38]">
                Category <span className="text-[#853528]">*</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const IconComp = cat.icon;
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-sm border cursor-pointer transition-all ${
                        reason === cat.id
                          ? 'bg-[#f8f3eb] border-[#853528] text-[#1a1917] shadow-xs'
                          : 'bg-[#fcfbf9] border-[#e8e2d2] text-[#433e38] hover:border-[#c5bbab]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedbackCategory"
                        value={cat.id}
                        checked={reason === cat.id}
                        onChange={() => setReason(cat.id)}
                        className="mt-0.5 accent-[#853528]"
                      />
                      <div className="text-xs">
                        <p className="font-semibold flex items-center gap-1.5">
                          <IconComp className="w-3.5 h-3.5 text-[#853528]" />
                          <span>{cat.label}</span>
                        </p>
                        <p className="text-[11px] text-[#787163] font-serif leading-normal mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38] mb-1">
                Summary / Subject (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                placeholder="e.g. Search filter behavior on mobile screen"
                className="w-full text-xs p-2.5 bg-white border border-[#d5ccba] rounded-sm focus:outline-hidden focus:border-[#853528] focus:ring-1 focus:ring-[#853528] text-[#1a1917]"
              />
            </div>

            {/* Description Details */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38]">
                  Description / Explanation <span className="text-[#853528]">*</span>
                </label>
                <span className="text-[10px] text-[#8c8477]">
                  {details.length} / 2,000
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={4}
                required
                placeholder="Please describe what happened, steps to reproduce, or details of your suggested improvement..."
                className="w-full text-xs p-2.5 bg-white border border-[#d5ccba] rounded-sm focus:outline-hidden focus:border-[#853528] focus:ring-1 focus:ring-[#853528] text-[#1a1917] font-serif placeholder:font-sans placeholder:text-[#a09889]"
              />
            </div>

            {/* Optional Reporter Email */}
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider font-semibold text-[#433e38] mb-1">
                Your Email (Optional)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                maxLength={100}
                placeholder="student@yenepoya.edu.in"
                className="w-full text-xs p-2.5 bg-white border border-[#d5ccba] rounded-sm focus:outline-hidden focus:border-[#853528] focus:ring-1 focus:ring-[#853528] text-[#1a1917]"
              />
              <p className="text-[10px] text-[#787163] mt-0.5 font-serif">
                Enter your email if you would like our team to follow up on this issue or idea.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#e8e2d2] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs text-[#635d54] hover:text-[#1a1917] hover:bg-[#eee8db] rounded-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !details.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#853528] hover:bg-[#6e2c21] disabled:opacity-50 text-white text-xs font-semibold rounded-sm transition-colors shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>Submit Feedback</span>
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
