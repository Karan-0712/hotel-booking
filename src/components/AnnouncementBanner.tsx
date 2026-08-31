import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface AnnouncementBannerProps {
  bannerText?: string | null;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ bannerText }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!bannerText || dismissed) return null;

  return (
    <div className="bg-amber-900 text-amber-50 border-b border-amber-800 py-2.5 px-4 text-xs sm:text-sm font-medium tracking-wide shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 mx-auto text-center">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-serif tracking-wide">{bannerText}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-200/80 hover:text-white p-1 rounded transition-colors"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
