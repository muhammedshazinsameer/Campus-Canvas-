import React, { useEffect, useState } from 'react';
import { getSubmissionsByStatus, reviewSubmission, deleteSubmission } from '../api/client';
import ReviewModal from '../components/ReviewModal';
import { CheckCircle, XCircle, Search, Trash2, Edit3, Tag, Calendar, User } from 'lucide-react';

export default function ArchivePage() {
  const [filter, setFilter] = useState('approved');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPiece, setEditingPiece] = useState(null);
  const [search, setSearch] = useState('');

  const loadArchive = async () => {
    try {
      setLoading(true);
      const data = await getSubmissionsByStatus(filter, { limit: 100 });
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to load archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, [filter]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      await deleteSubmission(id);
      loadArchive();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleReviewUpdate = async (id, status, comment) => {
    await reviewSubmission(id, status, comment);
    loadArchive();
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.authorDisplayName.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="border-b border-[#e8e2d2] pb-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1a1917]">
            Editorial Review Archive
          </h2>
          <p className="text-xs text-[#787163] font-serif italic">
            Historical catalog of previously reviewed submissions, editorial notes, and decisions.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 bg-[#f4efe4] p-1 rounded border border-[#d5ccba] text-xs">
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded transition-all font-semibold ${
              filter === 'approved'
                ? 'bg-[#853528] text-white shadow-xs'
                : 'text-[#433e38] hover:text-[#1a1917]'
            }`}
          >
            Approved ({filter === 'approved' ? submissions.length : '...'})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded transition-all font-semibold ${
              filter === 'rejected'
                ? 'bg-[#853528] text-white shadow-xs'
                : 'text-[#433e38] hover:text-[#1a1917]'
            }`}
          >
            Rejected ({filter === 'rejected' ? submissions.length : '...'})
          </button>
        </div>
      </div>

      {/* Search within archive */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8c8477] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive by title or author..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#faf7f0] border border-[#d5ccba] rounded text-xs text-[#1a1917] focus:outline-none focus:border-[#853528]"
          />
        </div>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="py-20 text-center text-sm font-serif italic text-[#787163]">
          Loading archived manuscripts...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm text-center text-xs text-[#787163]">
          No {filter} pieces found.
        </div>
      ) : (
        <div className="bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e8e2d2] bg-[#f4efe4] text-[#8c8477] uppercase tracking-wider font-semibold">
                <th className="p-3.5">Piece</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5">Reviewed Date</th>
                <th className="p-3.5">Editor's Note</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece6d8]">
              {filteredSubmissions.map((piece) => (
                <tr key={piece.id} className="hover:bg-[#faf7f0] transition-colors">
                  <td className="p-3.5 font-editorial font-bold text-sm text-[#1a1917]">
                    {piece.title}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#f4ebd9] text-[#7d481b]">
                      {piece.type}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#433e38]">{piece.authorDisplayName}</td>
                  <td className="p-3.5 text-[#787163]">
                    {piece.reviewedAt ? new Date(piece.reviewedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3.5 text-[#635d54] italic font-serif max-w-xs truncate">
                    {piece.editorComment ? `"${piece.editorComment}"` : <span className="text-[#a8a195]">None</span>}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setEditingPiece(piece)}
                      className="p-1 text-[#853528] hover:bg-[#f2ece0] rounded transition-colors"
                      title="Inspect or modify review"
                    >
                      <Edit3 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(piece.id, piece.title)}
                      className="p-1 text-[#8c3525] hover:bg-[#fbf2ef] rounded transition-colors"
                      title="Permanently remove"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingPiece && (
        <ReviewModal
          submission={editingPiece}
          onClose={() => setEditingPiece(null)}
          onReviewComplete={handleReviewUpdate}
        />
      )}
    </div>
  );
}
