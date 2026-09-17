import React from 'react';
import { Award, Feather, Sparkles } from 'lucide-react';

export default function EditorsNote({ comment, reviewer, reviewedAt }) {
  if (!comment) return null;

  const formattedDate = reviewedAt
    ? new Date(reviewedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <section className="relative my-12 p-6 sm:p-8 bg-[#f6eee5] border-2 border-[#d9c5b2] rounded-sm shadow-sm overflow-hidden">
      {/* Editorial seal watermark in top-right */}
      <div className="absolute -top-4 -right-4 w-28 h-28 border border-[#e4d3c3] rounded-full flex items-center justify-center opacity-30 pointer-events-none rotate-12">
        <span className="text-[10px] uppercase tracking-widest text-[#9d4233] font-semibold text-center leading-tight">
          Campus Canvas · Editorial Seal
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 text-[#9d4233] mb-4">
        <div className="p-1.5 bg-[#ecdcd0] rounded border border-[#dfc8b7]">
          <Feather className="w-4 h-4" />
        </div>
        <h4 className="font-editorial text-lg font-bold tracking-wide uppercase text-[#853528]">
          Editor's Note
        </h4>
        <span className="text-xs text-[#a39789]">|</span>
        <span className="text-xs font-sans text-[#786b5d] uppercase tracking-wider">
          Polyphony Review Standard
        </span>
      </div>

      {/* Comment Body */}
      <blockquote className="font-serif text-[#2c2925] text-base sm:text-lg leading-relaxed italic border-l-2 border-[#9d4233]/40 pl-4 py-1 mb-4">
        "{comment}"
      </blockquote>

      {/* Attribution footer */}
      <div className="flex items-center justify-between text-xs text-[#786b5d] pt-3 border-t border-[#ebd8c8]">
        <span className="font-medium">
          {reviewer?.name ? `Reviewed by ${reviewer.name}` : 'Student Editorial Board'}
        </span>
        {formattedDate && <span>Reviewed on {formattedDate}</span>}
      </div>
    </section>
  );
}
