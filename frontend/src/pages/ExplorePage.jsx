import React, { useEffect, useState } from 'react';
import { getSubmissions } from '../api/client';
import PieceCard from '../components/PieceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Compass, Sparkles, BookOpen, Feather, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteFeedbackModal from '../components/SiteFeedbackModal';

export default function ExplorePage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        // Explore is an unstructured wandering feed: no filters, all approved work
        const data = await getSubmissions({ limit: 50, sort: 'newest' });
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error('Failed to load explore feed:', err);
        setError('Could not load literary feed. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header Banner */}
      <section className="mb-12 border-b border-[#e8e2d2] pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f2ece0] text-[#8c4335] text-xs font-semibold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>A Canvas for Every Creative Mind</span>
        </div>

        <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#1a1917] max-w-3xl mx-auto leading-tight">
          Where Words, Brushstrokes, and Perspectives Converge.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-[#635d54] max-w-2xl mx-auto font-serif italic">
          An open gallery of student-crafted poems, essays, short fiction, photography, and fine art.
          Wander freely through every medium without constraints.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-sans">
          <span className="text-[#8c8477]">Featuring:</span>
          {['Poetry', 'Fiction', 'Essays', 'Fine Art', 'Photography', 'Typography'].map((genre) => (
            <span
              key={genre}
              className="px-2.5 py-1 bg-[#fbf9f4] border border-[#e8e2d2] rounded text-[#433e38]"
            >
              {genre}
            </span>
          ))}
        </div>
      </section>

      {/* Loading state */}
      {loading && <LoadingSpinner message="Curating the latest approved submissions..." />}

      {/* Error state */}
      {error && (
        <div className="p-6 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-center text-[#8c3525] my-12">
          <p className="font-serif">{error}</p>
        </div>
      )}

      {/* Wandering Masonry Feed */}
      {!loading && !error && submissions.length === 0 && (
        <div className="text-center py-20 bg-[#f9f6ef] border border-[#ece6d8] rounded p-8">
          <Feather className="w-8 h-8 text-[#9d4233] mx-auto mb-3" />
          <h3 className="font-editorial text-2xl font-bold text-[#1a1917] mb-2">
            The Gallery Awaits Its First Exhibit
          </h3>
          <p className="text-sm text-[#787163] max-w-md mx-auto mb-6">
            No approved works are live yet. Be the first student author or artist to submit!
          </p>
          <Link
            to="/submit"
            className="inline-block px-5 py-2.5 bg-[#9d4233] text-white text-sm font-medium rounded hover:bg-[#853528] transition-colors"
          >
            Submit Creative Work
          </Link>
        </div>
      )}

      {!loading && !error && submissions.length > 0 && (
        <div>
          {/* Section heading */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#ece6d8]">
            <div className="flex items-center gap-2 text-[#787163] text-xs uppercase tracking-wider font-sans font-medium">
              <Compass className="w-4 h-4 text-[#9d4233]" />
              <span>Browsing {submissions.length} curated works</span>
            </div>
            <Link
              to="/search"
              className="text-xs text-[#9d4233] hover:underline font-sans font-medium"
            >
              Need filters? Switch to structured search &rarr;
            </Link>
          </div>

          {/* Masonry layout */}
          <div className="masonry-grid">
            {submissions.map((piece) => (
              <div key={piece.id} className="masonry-item">
                <PieceCard piece={piece} />
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Floating Lifebuoy Report/Feedback Button (Bottom-Right, subtle compact design) */}
      <aside aria-label="Website support and suggestions" className="fixed bottom-5 right-5 z-40 group">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-9 h-9 bg-[#fcfbf9]/85 hover:bg-white text-[#7d7465] hover:text-[#853528] rounded-full shadow-xs hover:shadow-md border border-[#dcd6c5] hover:border-[#853528] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer opacity-75 hover:opacity-100"
          title="Report issue or share suggestion"
          aria-label="Report issue or share suggestion"
        >
          <LifeBuoy className="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-45" />
        </button>

        {/* Floating Tooltip */}
        <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="bg-[#1a1917]/95 text-[#fcfbf9] text-[11px] font-sans font-medium px-2 py-1 rounded shadow-md whitespace-nowrap flex items-center gap-1.5 border border-[#383530]">
            <LifeBuoy className="w-3 h-3 text-[#e06c55]" />
            <span>Report issue / suggestions</span>
          </div>
        </div>
      </aside>

      {/* Feedback Modal */}
      {feedbackOpen && <SiteFeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
