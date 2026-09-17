import React, { useState } from 'react';
import { getFullMediaUrl } from '../api/client';
import { X, Check, AlertTriangle, FileText, Sparkles, User, Calendar, Tag, Flag } from 'lucide-react';
import { safeMediaUrl } from '../utils/sanitize';

export default function ReviewModal({ submission, onClose, onReviewComplete }) {
  const [editorComment, setEditorComment] = useState(submission.editorComment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!submission) return null;

  const rawMediaUrl = getFullMediaUrl(submission.fileUrl);
  const mediaUrl = safeMediaUrl(rawMediaUrl);
  const isPdf = submission.fileUrl && submission.fileUrl.toLowerCase().endsWith('.pdf');
  const isPoetry = submission.type === 'Poetry';

  const handleAction = async (status) => {
    try {
      setLoading(true);
      setError(null);
      await onReviewComplete(submission.id, status, editorComment);
      onClose();
    } catch (err) {
      console.error(`Failed to set status to ${status}:`, err);
      setError(err.response?.data?.error || `Failed to update submission to ${status}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#fcfbf9] border border-[#d5ccba] rounded-sm shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e8e2d2] flex items-center justify-between bg-[#faf7f0]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#f4ebd9] text-[#7d481b] border border-[#e4d7bc] uppercase tracking-wider">
              {submission.type}
            </span>
            <span className="text-xs text-[#787163] italic font-serif">{submission.category}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#eee8db] rounded text-[#787163] hover:text-[#1a1917] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525]">
              {error}
            </div>
          )}

          {/* Active Moderation Reports Banner */}
          {submission.reports && submission.reports.length > 0 && (
            <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-sm text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#991b1b] font-semibold uppercase tracking-wider text-[11px]">
                <Flag className="w-3.5 h-3.5" />
                <span>Active Moderation Reports ({submission.reports.length})</span>
              </div>
              <div className="space-y-1.5">
                {submission.reports.map((rep, idx) => (
                  <div key={idx} className="p-2.5 bg-white/90 rounded border border-[#fee2e2] text-[#450a0a]">
                    <span className="font-semibold text-xs">{rep.reason}</span>
                    {rep.details && (
                      <p className="font-serif italic text-xs mt-0.5 text-[#524c42]">
                        "{rep.details}"
                      </p>
                    )}
                    {rep.reporterEmail && (
                      <p className="text-[10px] text-[#787163] font-sans mt-0.5">
                        Reported by: {rep.reporterEmail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Piece Title & Author */}
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1a1917] mb-2">
              {submission.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#787163] font-sans">
              <span className="flex items-center gap-1 font-medium text-[#1a1917]">
                <User className="w-3.5 h-3.5 text-[#853528]" />
                <span>Author: {submission.authorDisplayName}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
              </span>
              <span>·</span>
              <span className="font-semibold uppercase text-[#853528]">
                Current Status: {submission.status}
              </span>
            </div>
          </div>

          {/* Media preview */}
          {submission.fileUrl && !isPdf && (
            <div className="p-3 bg-[#f4efe4] border border-[#e2dcce] rounded text-center">
              <img
                src={mediaUrl}
                alt={submission.title}
                className="max-h-96 mx-auto rounded shadow-sm object-contain"
              />
            </div>
          )}

          {/* PDF preview */}
          {isPdf && (
            <div className="p-4 bg-[#f4efe4] border border-[#e2dcce] rounded">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-[#1a1917]">
                  <FileText className="w-4 h-4 text-[#853528]" />
                  <span>PDF Document Preview</span>
                </span>
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#853528] hover:underline"
                >
                  Open in New Tab &rarr;
                </a>
              </div>
              <iframe src={mediaUrl} title="PDF Preview" className="w-full h-80 rounded border border-[#d5ccba]" />
            </div>
          )}

          {/* Written manuscript */}
          {submission.textContent && (
            <div className="p-5 bg-[#faf7f0] border border-[#e8e2d2] rounded">
              <div className="text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-3">
                Manuscript Content:
              </div>
              {isPoetry ? (
                <pre className="font-serif text-base sm:text-lg text-[#2c2925] whitespace-pre-wrap leading-relaxed">
                  {submission.textContent}
                </pre>
              ) : (
                <div className="font-serif text-base text-[#2c2925] leading-relaxed space-y-4">
                  {submission.textContent.split('\n\n').map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {submission.tags && submission.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <Tag className="w-3.5 h-3.5 text-[#8c8477]" />
              {submission.tags.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-[#f4efe4] text-[#635d54] rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Editor Commentary & Note section */}
          <div className="pt-4 border-t border-[#e8e2d2] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-[#853528] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Editor's Note / Review Feedback (Optional)</span>
              </label>
              <span className="text-[11px] text-[#8c8477]">Polyphony Lit Style</span>
            </div>
            <p className="text-xs text-[#635d54]">
              If you approve this piece, this comment will appear in a highlighted "Editor's Note" box on the public page.
              If rejected, it will be preserved in the archive for constructive feedback.
            </p>
            <textarea
              rows={4}
              maxLength={2000}
              value={editorComment}
              onChange={(e) => setEditorComment(e.target.value)}
              placeholder="e.g., Brooks demonstrates stunning lyrical control in the second stanza. The imagery of frosted birch bark lingers long after reading..."
              className="w-full p-3 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] font-serif focus:outline-none focus:border-[#853528] focus:ring-1 focus:ring-[#853528]"
            />
            <div className="flex justify-end text-[11px] text-[#8c8477]">
              <span>{editorComment.length} / 2,000 characters</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#e8e2d2] bg-[#faf7f0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 border border-[#d5ccba] text-[#433e38] text-xs font-semibold rounded hover:bg-[#f4efe4] transition-colors"
          >
            Cancel / Close
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('rejected')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#fdf2f0] border border-[#e8c8bf] text-[#8c3525] hover:bg-[#f8ded9] text-xs font-bold rounded transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Reject Submission</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('approved')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 bg-[#853528] hover:bg-[#6c281d] text-white text-xs font-bold rounded shadow transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve for Publication</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
