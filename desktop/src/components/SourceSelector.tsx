interface Sources {
  reddit: boolean
  craigslist: boolean
}

interface SourceSelectorProps {
  sources: Sources
  onToggle: (source: keyof Sources) => void
  onOpenFacebook: () => void
  query: string
}

export default function SourceSelector({
  sources,
  onToggle,
  onOpenFacebook,
}: SourceSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 font-medium mr-1">Sources:</span>

      {/* Reddit toggle */}
      <button
        onClick={() => onToggle('reddit')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          sources.reddit
            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
            : 'bg-white text-purple-600 border-purple-300 hover:border-purple-500'
        }`}
      >
        {/* Reddit alien icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0C4.478 0 0 4.478 0 10s4.478 10 10 10 10-4.478 10-10S15.522 0 10 0zm5.93 10.004c.016.159.016.32 0 .48a4.33 4.33 0 01-4.33 4.33 4.33 4.33 0 01-4.33-4.33 2.05 2.05 0 01-.13-.48 1.29 1.29 0 01-.873-1.218 1.29 1.29 0 011.29-1.29c.334 0 .638.127.867.334a6.35 6.35 0 013.457-1.094l.587-2.764a.25.25 0 01.298-.193l1.948.41a.9.9 0 01.876-.586.9.9 0 01.9.9.9.9 0 01-.9.9.9.9 0 01-.886-.74l-1.726-.364-.52 2.45a6.35 6.35 0 013.41 1.09c.23-.207.533-.334.867-.334a1.29 1.29 0 011.29 1.29 1.29 1.29 0 01-.875 1.22z" />
          <circle cx="7.9" cy="11.2" r="0.9" />
          <circle cx="12.1" cy="11.2" r="0.9" />
          <path d="M12.3 13.5c-.43.43-1.13.64-2.3.64s-1.87-.21-2.3-.64a.3.3 0 01.42-.42c.33.33.9.5 1.88.5s1.55-.17 1.88-.5a.3.3 0 01.42.42z" />
        </svg>
        Reddit
      </button>

      {/* Craigslist toggle */}
      <button
        onClick={() => onToggle('craigslist')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          sources.craigslist
            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
            : 'bg-white text-orange-500 border-orange-300 hover:border-orange-400'
        }`}
      >
        {/* Craigslist "CL" text icon */}
        <span className="font-black text-[10px] leading-none">CL</span>
        Craigslist
      </button>

      {/* Divider */}
      <span className="w-px h-4 bg-gray-200 mx-1" />

      {/* Facebook Marketplace button */}
      <button
        onClick={onOpenFacebook}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all"
        title="Opens Facebook Marketplace in a separate window with your logged-in session"
      >
        {/* Facebook "f" icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook Marketplace
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </button>
    </div>
  )
}
