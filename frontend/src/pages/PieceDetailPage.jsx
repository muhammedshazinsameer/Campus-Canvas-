import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSubmissionById, getFullMediaUrl } from '../api/client';
import EditorsNote from '../components/EditorsNote';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Calendar, User, Tag, Share2, Download, FileText, Check, Flag, LifeBuoy } from 'lucide-react';
import { safeMediaUrl } from '../utils/sanitize';
import ReportSubmissionModal from '../components/ReportSubmissionModal';

export default function PieceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    async function loadPiece() {
      try {
        setLoading(true);
        setError(null);
        const data = await getSubmissionById(id);
        setSubmission(data.submission);
      } catch (err) {
        console.error('Failed to load piece:', err);
        setError(
          err.response?.status === 404
            ? 'This creative work was not found or is currently awaiting editorial review before publication.'
            : 'An unexpected error occurred while loading this piece.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadPiece();
    window.scrollTo(0, 0);
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingSpinner message="Fetching literary manuscript..." />;
  }

  if (error || !submission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="p-8 bg-[#fbf2ef] border border-[#e8c8bf] rounded-sm">
          <h2 className="font-editorial text-2xl font-bold text-[#8c3525] mb-2">
            Work Unavailable
          </h2>
          <p className="text-[#635d54] font-serif mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#9d4233] text-white text-xs font-semibold rounded hover:bg-[#853528] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Gallery</span>
          </Link>
        </div>
      </div>
    );
  }

  const rawMediaUrl = getFullMediaUrl(submission.fileUrl);
  const mediaUrl = safeMediaUrl(rawMediaUrl);
  const isPdf = submission.fileUrl && submission.fileUrl.toLowerCase().endsWith('.pdf');
  const isVisual = submission.fileUrl && ['Art', 'Photography', 'Poster'].includes(submission.type);
  const isPoetry = submission.type === 'Poetry';

  const formattedDate = new Date(submission.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Top back button & share link */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#e8e2d2]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-[#787163] hover:text-[#1a1917] font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[#787163] hover:text-[#853528] font-medium transition-colors"
            title="Report concern with this creative submission"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs text-[#787163] hover:text-[#9d4233] font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">Link copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share piece</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Header section */}
      <header className="mb-10 text-center">
        {/* Type and Category pills */}
        <div className="flex items-center justify-center gap-2 mb-4 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-[#f4ebd9] text-[#7d481b] border border-[#e4d7bc] font-semibold tracking-wide uppercase text-[10px]">
            {submission.type}
          </span>
          <span className="text-[#8c8477]">/</span>
          <span className="text-[#635d54] italic font-serif">{submission.category}</span>
        </div>

        {/* Title */}
        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1a1917] tracking-tight leading-tight mb-4">
          {submission.title}
        </h1>

        {/* Author Byline and Date */}
        <div className="flex items-center justify-center gap-4 text-xs text-[#787163] uppercase tracking-widest font-sans font-medium">
          <span className="flex items-center gap-1 text-[#1a1917]">
            <User className="w-3.5 h-3.5 text-[#9d4233]" />
            <span>By {submission.authorDisplayName}</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Published {formattedDate}</span>
          </span>
        </div>
      </header>

      {/* Main Single-Column Content Body */}
      <main className="mb-12">
        {/* Visual Artwork / Photo / Poster */}
        {submission.fileUrl && !isPdf && (
          <div className="mb-10 p-2 sm:p-4 bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm shadow-sm">
            <img
              src={mediaUrl}
              alt={submission.title}
              className="w-full h-auto max-h-[680px] object-contain mx-auto rounded-sm"
            />
          </div>
        )}

        {/* PDF Viewer */}
        {isPdf && (
          <div className="mb-10 p-4 bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ece6d8]">
              <div className="flex items-center gap-2 text-sm text-[#433e38]">
                <FileText className="w-4 h-4 text-[#9d4233]" />
                <span>PDF Document attached</span>
              </div>
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1 text-xs text-[#9d4233] hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open / Download PDF</span>
              </a>
            </div>
            <iframe
              src={mediaUrl}
              title={submission.title}
              className="w-full h-96 border border-[#e2dcce] rounded"
            />
          </div>
        )}

        {/* Written Literature (Poetry, Fiction, Essay) */}
        {submission.textContent && (
          <article className="prose prose-stone max-w-none text-[#1a1917]">
            {isPoetry ? (
              // Poetry styling: preserve whitespace, indented margins, verse cadence
              <div className="poem-content font-serif text-base sm:text-lg text-[#2c2925] mx-auto max-w-lg py-4 border-y border-[#ece6d8] my-6 whitespace-pre-wrap">
                {submission.textContent}
              </div>
            ) : (
              // Prose styling: drop-cap on first letter, paragraph breaks, generous line height
              <div className="drop-cap font-serif text-base sm:text-lg leading-[2.1] text-[#2c2925] space-y-6">
                {submission.textContent.split('\n\n').map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </article>
        )}
      </main>

      {/* Editor's Note (Polyphony Lit style highlighted box) */}
      <EditorsNote
        comment={submission.editorComment}
        reviewer={submission.reviewer}
        reviewedAt={submission.reviewedAt}
      />

      {/* Tags section */}
      {submission.tags && submission.tags.length > 0 && (
        <div className="pt-6 border-t border-[#e8e2d2] flex items-center gap-2 flex-wrap text-xs">
          <Tag className="w-3.5 h-3.5 text-[#8c8477]" />
          <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Tags:</span>
          {submission.tags.map((tag, idx) => (
            <Link
              key={idx}
              to={`/search?tag=${encodeURIComponent(tag)}`}
              className="px-2.5 py-1 bg-[#f4efe4] hover:bg-[#e8e2d2] text-[#433e38] rounded transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Editorial colophon card */}
      <div className="mt-12 p-6 bg-[#fcfbf9] border border-[#e8e2d2] text-center text-xs text-[#787163]">
        <p className="font-serif italic text-sm text-[#433e38] mb-1">
          Have your own voice heard in our next issue.
        </p>
        <p className="mb-3">
          We welcome original poetry, prose, and artwork from students everywhere.
        </p>
        <Link
          to="/submit"
          className="inline-block px-4 py-1.5 bg-[#9d4233] text-white rounded font-medium hover:bg-[#853528] transition-colors"
        >
          Submit Work
        </Link>
      </div>

      {/* Moderation reporting trigger in footer */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-[#a09889] hover:text-[#853528] transition-colors cursor-pointer"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Notice a concern with this creative work? Report to editorial board</span>
        </button>
      </div>

      {/* Floating Lifebuoy Report Button (Bottom-Right, matching user reference) */}
      <aside aria-label="Report this piece" className="fixed bottom-6 right-6 z-40 group">
        <button
          onClick={() => setReportOpen(true)}
          className="w-12 h-12 bg-[#fcfbf9] hover:bg-white text-[#853528] rounded-full shadow-lg hover:shadow-2xl border-2 border-[#d5ccba] hover:border-[#853528] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          title="Report this submission to editorial staff"
          aria-label="Report this creative submission"
        >
          <LifeBuoy className="w-6 h-6 text-[#853528] transition-transform duration-300 group-hover:rotate-45" />
        </button>

        {/* Floating Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-[#1a1917] text-[#fcfbf9] text-xs font-sans font-medium px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-[#383530]">
            <LifeBuoy className="w-3.5 h-3.5 text-[#e06c55]" />
            <span>Report submission</span>
          </div>
        </div>
      </aside>

      {/* Report Modal */}
      {reportOpen && (
        <ReportSubmissionModal
          submission={submission}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
