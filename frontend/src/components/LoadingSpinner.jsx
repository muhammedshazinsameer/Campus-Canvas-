import React from 'react';
import { Feather } from 'lucide-react';

export default function LoadingSpinner({ message = 'Gathering literary works...' }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full border-2 border-[#e8e2d2] border-t-[#9d4233] animate-spin flex items-center justify-center mb-4">
        <Feather className="w-5 h-5 text-[#9d4233]" />
      </div>
      <p className="font-serif italic text-sm text-[#787163]">{message}</p>
    </div>
  );
}
