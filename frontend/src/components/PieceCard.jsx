import React from 'react';
import { Link } from 'react-router-dom';
import { getFullMediaUrl } from '../api/client';
import { BookOpen, Sparkles, Image as ImageIcon, MessageSquare, Feather } from 'lucide-react';
import { safeMediaUrl } from '../utils/sanitize';

const typeColorMap = {
  Poetry: 'bg-[#f4ebd9] text-[#7d481b] border-[#e4d7bc]',
  Fiction: 'bg-[#e9f0e8] text-[#2c542b] border-[#d2e2cf]',
  Essay: 'bg-[#f5e9e2] text-[#863725] border-[#e6d0c6]',
  Art: 'bg-[#edf0f7] text-[#2a4374] border-[#d0d9ea]',
  Photography: 'bg-[#f1edf5] text-[#553177] border-[#ddd3e6]',
  Poster: 'bg-[#fcf0e4] text-[#834b16] border-[#edd5be]',
};

export default function PieceCard({ piece, compact = false }) {
  const isVisual = piece.fileUrl && ['Art', 'Photography', 'Poster'].includes(piece.type);
  const mediaUrl = safeMediaUrl(getFullMediaUrl(piece.fileUrl));

  const badgeStyle = typeColorMap[piece.type] || 'bg-[#f4efe4] text-[#635d54] border-[#e2dcce]';

  return (
    <article className="group bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm hover:border-[#c5bbab] hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Visual media preview if present */}
      {piece.fileUrl && (
        <Link to={`/piece/${piece.id}`} className="block relative overflow-hidden bg-[#eeeae0] aspect-[4/3] sm:aspect-auto">
          <img
            src={mediaUrl}
            alt={piece.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 max-h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      )}

      {/* Content wrapper */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata bar */}
          <div className="flex items-center justify-between gap-2 mb-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeStyle}`}>
                {piece.type}
              </span>
              <span className="text-[#8c8477]">·</span>
              <span className="text-[#787163] italic">{piece.category}</span>
            </div>

            {/* Editor's Note indicator */}
            {piece.editorComment && (
              <span
                className="flex items-center gap-1 text-xs text-[#9d4233] bg-[#f9eee9] px-2 py-0.5 rounded border border-[#f0ded5]"
                title="Includes Editor's Note"
              >
                <Sparkles className="w-3 h-3" />
                <span>Editor's Note</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1a1917] leading-snug group-hover:text-[#9d4233] transition-colors mb-2">
            <Link to={`/piece/${piece.id}`}>
              {piece.title}
            </Link>
          </h3>

          {/* Author Pen Name */}
          <p className="text-xs uppercase tracking-widest text-[#787163] font-medium mb-3">
            By {piece.authorDisplayName}
          </p>

          {/* Written excerpt if applicable */}
          {piece.textContent && (
            <p className="text-sm text-[#433e38] font-serif line-clamp-4 leading-relaxed mb-4 italic">
              "{piece.textContent.slice(0, 180)}
              {piece.textContent.length > 180 ? '...' : ''}"
            </p>
          )}
        </div>

        {/* Footer info: tags & read prompt */}
        <div className="pt-3 border-t border-[#f2ede2] flex items-center justify-between text-xs text-[#8c8477] mt-2">
          <div className="flex flex-wrap gap-1">
            {piece.tags && piece.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="hover:text-[#1a1917]">
                #{tag}
              </span>
            ))}
          </div>

          <Link
            to={`/piece/${piece.id}`}
            className="text-[#9d4233] font-medium hover:underline flex items-center gap-1"
          >
            <span>Read Piece</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
