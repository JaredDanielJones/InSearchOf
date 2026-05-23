import { useState } from 'react'
import type { Listing } from '../types/listing'
import { relativeTime, isNew, isOld } from '../lib/utils'
import { addBookmark, removeBookmark } from '../lib/storage'

interface ListingCardProps {
  listing: Listing
  isBookmarked: boolean
  onBookmarkChange?: () => void
}

function RedditIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 0C4.478 0 0 4.478 0 10s4.478 10 10 10 10-4.478 10-10S15.522 0 10 0zm5.93 10.004c.016.159.016.32 0 .48a4.33 4.33 0 01-4.33 4.33 4.33 4.33 0 01-4.33-4.33 2.05 2.05 0 01-.13-.48 1.29 1.29 0 01-.873-1.218 1.29 1.29 0 011.29-1.29c.334 0 .638.127.867.334a6.35 6.35 0 013.457-1.094l.587-2.764a.25.25 0 01.298-.193l1.948.41a.9.9 0 01.876-.586.9.9 0 01.9.9.9.9 0 01-.9.9.9.9 0 01-.886-.74l-1.726-.364-.52 2.45a6.35 6.35 0 013.41 1.09c.23-.207.533-.334.867-.334a1.29 1.29 0 011.29 1.29 1.29 1.29 0 01-.875 1.22z" />
      <circle cx="7.9" cy="11.2" r="0.9" />
      <circle cx="12.1" cy="11.2" r="0.9" />
      <path d="M12.3 13.5c-.43.43-1.13.64-2.3.64s-1.87-.21-2.3-.64a.3.3 0 01.42-.42c.33.33.9.5 1.88.5s1.55-.17 1.88-.5a.3.3 0 01.42.42z" />
    </svg>
  )
}

export default function ListingCard({
  listing,
  isBookmarked,
  onBookmarkChange,
}: ListingCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked)

  const postIsNew = isNew(listing.pubDate)
  const postIsOld = isOld(listing.pubDate)

  const sourceBadgeClass =
    listing.source === 'reddit'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-orange-100 text-orange-700'

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(listing.id)
      setBookmarked(false)
    } else {
      addBookmark(listing)
      setBookmarked(true)
    }
    onBookmarkChange?.()
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // In Electron, target="_blank" links are handled by the shell via default browser
    // We can also call openExternal explicitly for consistency
    e.preventDefault()
    window.electron.openExternal(listing.link).catch(console.error)
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex flex-col gap-3 min-h-[180px] ${
        postIsOld ? 'opacity-60' : ''
      }`}
    >
      {/* Top row: source badge + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source + subreddit/city badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sourceBadgeClass}`}
          >
            {listing.source === 'reddit' ? (
              <RedditIcon />
            ) : (
              <span className="font-black text-[9px] leading-none">CL</span>
            )}
            {listing.cityLabel}
          </span>

          {/* NEW badge */}
          {postIsNew && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
              NEW
            </span>
          )}
        </div>

        {/* Relative date */}
        <span className="text-xs text-gray-400 shrink-0">
          {relativeTime(listing.pubDate)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
        {listing.title}
      </h3>

      {/* Description */}
      {listing.description && (
        <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
          {listing.description}
        </p>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-auto">
        <a
          href={listing.link}
          onClick={handleLinkClick}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          View post
        </a>

        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg transition-all ${
            bookmarked
              ? 'text-rose-500 hover:text-rose-600 bg-rose-50'
              : 'text-gray-400 hover:text-rose-400 hover:bg-rose-50'
          }`}
          title={bookmarked ? 'Remove bookmark' : 'Save listing'}
        >
          <svg
            className="w-5 h-5"
            fill={bookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
