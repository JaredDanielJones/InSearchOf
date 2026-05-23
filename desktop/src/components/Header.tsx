interface HeaderProps {
  isLoading: boolean
  totalCount: number
  onRefresh: () => void
}

export default function Header({ isLoading, totalCount, onRefresh }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <h1 className="text-xl font-bold text-gray-900">InSearchOf</h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Find buyers · Source it · Sell it
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-wrap">
            {totalCount > 0 && !isLoading && (
              <span className="text-xs text-gray-400 hidden sm:block">
                <span className="font-semibold text-gray-600">{totalCount}</span> results
              </span>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
