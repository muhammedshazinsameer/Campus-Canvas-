import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Feather, Heart, LifeBuoy } from 'lucide-react';
import SiteFeedbackModal from './SiteFeedbackModal';

export default function Footer() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer className="border-t border-[#e8e2d2] bg-[#f4efe4] mt-24 text-[#635d54] text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="min-h-7 flex items-center gap-2 mb-3">
              <Feather className="w-5 h-5 text-[#9d4233] flex-shrink-0" />
              <span className="font-editorial text-lg font-bold text-[#1a1917]">
                Campus Canvas
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider text-[#9d4233] font-semibold mb-2">
              A Canvas for Every Creative Mind
            </p>
            <p className="text-[#635d54] leading-relaxed max-w-md text-sm">
              An independent literary and arts journal committed to elevating student voices,
              amplifying raw imagination, and providing thoughtful peer-editorial feedback
              to emerging writers, artists, and photographers.
            </p>
          </div>

          <div>
            <div className="min-h-7 flex items-center mb-3">
              <h4 className="font-editorial text-lg font-bold text-[#1a1917]">
                Explore
              </h4>
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-[#9d4233] transition-colors">
                  Wandering Feed
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-[#9d4233] transition-colors">
                  Browse by Genre & Category
                </Link>
              </li>
              <li>
                <Link to="/submit" className="hover:text-[#9d4233] transition-colors">
                  Submit Your Work
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="min-h-7 flex items-center mb-3">
              <h4 className="font-editorial text-lg font-bold text-[#1a1917]">
                Editorial Board & Support
              </h4>
            </div>
            <p className="text-xs text-[#787163] leading-relaxed mb-3">
              Every submission is peer-reviewed by student editors before being approved for the public issue.
            </p>
            <div className="space-y-2">
              <a
                href={import.meta.env.VITE_ADMIN_URL || 'https://campus-canvas-admin.vercel.app'}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-semibold text-[#9d4233] hover:underline"
              >
                Editor Dashboard Login &rarr;
              </a>
              <div>
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#853528] hover:text-[#6c281d] hover:underline cursor-pointer"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Report Website Issue or Suggestion</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {feedbackOpen && <SiteFeedbackModal onClose={() => setFeedbackOpen(false)} />}

        <div className="border-t border-[#e2dcce] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8c8477] gap-2">
          <p>© {new Date().getFullYear()} Campus Canvas · A Canvas for Every Creative Mind.</p>
          <p className="flex items-center gap-1">
            Modeled in the tradition of independent literary revues.
          </p>
        </div>
      </div>
    </footer>
  );
}
