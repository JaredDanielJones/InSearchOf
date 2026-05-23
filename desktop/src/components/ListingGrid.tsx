import type { Listing } from '../types/listing'
import ListingCard from './ListingCard'

interface ListingGridProps {
  listings: Listing[]
  isLoading: boolean
  bookmarkedIds: Set<string>
  error?: string
  onBookmarkChange?: () => void
  hasSearched: boolean
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 min-h-[180px] animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-5 w-28 bg-gray-200 rounded-full" />
        <div className="h-5 w-12 bg-gray-100 rounded-full ml-auto" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>
      <div className="flex justify-between pt-1 border-t border-gray-100">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-6 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

export default function ListingGrid({
  listings,
  isLoading,
  bookmarkedIds,
  error,
  onBookmarkChange,
  hasSearched,
}: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="font-semibold text-gray-800 mb-1">Something went wrong</h3>
        <p className="text-sm text-gray-500 max-w-md">{error}</p>
      </div>
    )
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-5">🔍</span>
        <h3 className="font-semibold text-gray-800 mb-2 text-lg">Find buyers instantly</h3>
        <p className="text-sm text-gray-500 max-w-md leading-relaxed">
          Search for any item to find Reddit ISO/WTB posts and Craigslist "wanted" listings —
          people actively looking to buy that thing right now.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Try: "vintage camera" · "MacBook Pro" · "LEGO set" · "vinyl records"
        </p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">📭</span>
        <h3 className="font-semibold text-gray-800 mb-1">No results found</h3>
        <p className="text-sm text-gray-500 max-w-md">
          No active wanted posts for that search. Try different keywords or check Facebook
          Marketplace.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Partial results — {error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isBookmarked={bookmarkedIds.has(listing.id)}
            onBookmarkChange={onBookmarkChange}
          />
        ))}
      </div>
    </div>
  )
}
