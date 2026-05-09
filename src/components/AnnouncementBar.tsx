'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Red announcement bar at very top of every page.
 * Closeable per-session (state lives only in memory; resets on full reload).
 */
export function AnnouncementBar() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="relative bg-traford-red px-4 py-2 text-center text-[13px] font-semibold uppercase tracking-wide text-white">
      MTN MoMoPAY - 00000 &nbsp;|&nbsp; Airtel Pay - 0000000 &nbsp;|&nbsp; Stanbic Flexipay - 00000
      <button
        type="button"
        aria-label="Close announcement"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 transition hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
