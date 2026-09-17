import React, { useEffect, useState } from 'react';
import { getSubmissionsByStatus, reviewSubmission, getStats, getFullMediaUrl } from '../api/client';
import ReviewModal from '../components/ReviewModal';
import { Clock, CheckCircle, XCircle, FileText, Sparkles, ExternalLink, Eye, AlertCircle, RefreshCw } from 'lucide-react';

export default function PendingQueuePage({ onPendingCountChange }) {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [inspectingPiece, setInspectingPiece] = useState(null);
  const [inlineComments, setInlineComments] = useState({});
  const [actionInProgress, setActionInProgress] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const [queueData, statsData] = await Promise.all([
        getSubmissionsByStatus('pending', { limit: 50 }),
        getStats()
      ]);
      setSubmissions(queueData.submissions || []);
      setStats(statsData);
      if (onPendingCountChange) {
        onPendingCountChange(statsData.pending || 0);
      }
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReviewAction = async (id, status, comment) => {
    try {
      setActionInProgress((prev) => ({ ...prev, [id]: true }));
      await reviewSubmission(id, status, comment);
      showToast(`Piece marked as ${status.toUpperCase()}!`);
      // Refresh list & stats
      await loadQueue();
    } catch (err) {
      console.error('Review failed:', err);
      alert(err.response?.data?.error || 'Failed to update review status.');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1917] text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 text-xs font-sans border border-[#853528]">
          <Sparkles className="w-4 h-4 text-[#d97757]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#fcfbf9] border-l-4 border-[#853528] p-4 rounded-r-sm border-t border-b border-r border-[#e8e2d2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#8c8477] font-semibold">
              Pending Editorial Review
            </span>
            <Clock className="w-4 h-4 text-[#853528]" />
          </div>
          <p className="font-editorial text-3xl font-bold text-[#1a1917] mt-1">
            {stats.pending}
          </p>
          <p className="text-[11px] text-[#787163] mt-0.5">Awaiting editorial decision</p>
        </div>

        <div className="bg-[#fcfbf9] border-l-4 border-[#2c6828] p-4 rounded-r-sm border-t border-b border-r border-[#e8e2d2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#8c8477] font-semibold">
              Published & Approved
            </span>
            <CheckCircle className="w-4 h-4 text-[#2c6828]" />
          </div>
          <p className="font-editorial text-3xl font-bold text-[#1a1917] mt-1">
            {stats.approved}
          </p>
          <p className="text-[11px] text-[#787163] mt-0.5">Live on public showcase</p>
        </div>

        <div className="bg-[#fcfbf9] border-l-4 border-[#8c3525] p-4 rounded-r-sm border-t border-b border-r border-[#e8e2d2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#8c8477] font-semibold">
              Rejected / Archived
            </span>
            <XCircle className="w-4 h-4 text-[#8c3525]" />
          </div>
          <p className="font-editorial text-3xl font-bold text-[#1a1917] mt-1">
            {stats.rejected}
          </p>
          <p className="text-[11px] text-[#787163] mt-0.5">Feedback retained in archive</p>
        </div>
      </div>

      {/* Queue Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#e8e2d2]">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1a1917]">
            Pending Review Desk
          </h2>
          <p className="text-xs text-[#787163] font-serif italic">
            Review student submissions, provide constructive Editor's Notes, and publish or reject.
          </p>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4efe4] hover:bg-[#e8e2d2] text-xs font-semibold text-[#433e38] rounded border border-[#d5ccba] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && submissions.length === 0 && (
        <div className="py-20 text-center text-sm font-serif italic text-[#787163]">
          Loading submitted manuscripts...
        </div>
      )}

      {/* Empty queue state */}
      {!loading && submissions.length === 0 && (
        <div className="p-12 bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm text-center">
          <CheckCircle className="w-10 h-10 text-[#2c6828] mx-auto mb-3" />
          <h3 className="font-editorial text-2xl font-bold text-[#1a1917] mb-1">
            Editorial Queue Clear
          </h3>
          <p className="text-xs text-[#787163] max-w-sm mx-auto mb-4 font-serif">
            All submitted student pieces have been reviewed and decided. New submissions will appear here instantly.
          </p>
        </div>
      )}

      {/* Submissions Queue */}
      <div className="space-y-6">
        {submissions.map((piece) => {
          const isBusy = actionInProgress[piece.id];
          const mediaUrl = getFullMediaUrl(piece.fileUrl);
          const currentComment = inlineComments[piece.id] || '';

          return (
            <div
              key={piece.id}
              className="bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm p-6 shadow-xs hover:border-[#c5bbab] transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Details & Content Preview */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Type badge & Category */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded font-semibold bg-[#f4ebd9] text-[#7d481b] border border-[#e4d7bc] uppercase text-[10px]">
                      {piece.type}
                    </span>
                    <span className="text-[#8c8477]">·</span>
                    <span className="text-[#635d54] italic font-serif">{piece.category}</span>
                    <span className="text-[#8c8477]">·</span>
                    <span className="text-[#8c8477] text-[11px]">
                      Submitted {new Date(piece.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#1a1917]">
                    {piece.title}
                  </h3>

                  {/* Author pseudonym */}
                  <p className="text-xs uppercase tracking-wider text-[#787163] font-semibold">
                    Author: {piece.authorDisplayName}
                  </p>

                  {/* Media thumbnail if present */}
                  {piece.fileUrl && (
                    <div className="p-2 bg-[#f4efe4] border border-[#e2dcce] rounded inline-block max-w-xs">
                      {piece.fileUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="flex items-center gap-2 text-xs text-[#853528]">
                          <FileText className="w-4 h-4" />
                          <span>PDF Document attached</span>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={piece.title}
                          className="h-36 object-cover rounded"
                        />
                      )}
                    </div>
                  )}

                  {/* Written manuscript snippet */}
                  {piece.textContent && (
                    <div className="p-3 bg-[#faf7f0] border border-[#ece6d8] rounded text-xs font-serif text-[#2c2925] italic line-clamp-3 leading-relaxed">
                      "{piece.textContent}"
                    </div>
                  )}

                  {/* Tags */}
                  {piece.tags && piece.tags.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-[#8c8477]">
                      <span>Tags:</span>
                      {piece.tags.map((t, idx) => (
                        <span key={idx} className="bg-[#f4efe4] px-1.5 py-0.2 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div>
                    <button
                      onClick={() => setInspectingPiece(piece)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#853528] font-semibold hover:underline mt-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Manuscript Inspection & Reading View &rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Review Comment & Quick Actions */}
                <div className="lg:col-span-5 bg-[#faf7f0] border border-[#e8e2d2] p-4 rounded flex flex-col justify-between space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#853528] font-bold mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Editor's Note (Appears on approved piece)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={currentComment}
                      onChange={(e) =>
                        setInlineComments((prev) => ({
                          ...prev,
                          [piece.id]: e.target.value
                        }))
                      }
                      placeholder="Write editorial commentary celebrating craft or specific feedback..."
                      className="w-full p-2.5 bg-[#fcfbf9] border border-[#d5ccba] rounded text-xs text-[#1a1917] font-serif focus:outline-none focus:border-[#853528]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#ece6d8]">
                    <button
                      disabled={isBusy}
                      onClick={() => handleReviewAction(piece.id, 'rejected', currentComment)}
                      className="flex-1 py-2 px-3 bg-[#fdf2f0] border border-[#e8c8bf] text-[#8c3525] hover:bg-[#f8ded9] text-xs font-bold rounded transition-colors disabled:opacity-50"
                    >
                      Reject Piece
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={() => handleReviewAction(piece.id, 'approved', currentComment)}
                      className="flex-1 py-2 px-3 bg-[#853528] hover:bg-[#6c281d] text-white text-xs font-bold rounded shadow transition-colors disabled:opacity-50"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Inspection Modal */}
      {inspectingPiece && (
        <ReviewModal
          submission={inspectingPiece}
          onClose={() => setInspectingPiece(null)}
          onReviewComplete={handleReviewAction}
        />
      )}
    </div>
  );
}
