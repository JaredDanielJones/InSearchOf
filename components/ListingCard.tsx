"use client";

import { useState } from "react";
import type { Listing } from "@/types/listing";
import { CITIES_MAP, REGION_COLORS } from "@/lib/cities";
import { relativeTime, isNew, isOld } from "@/lib/utils";
import { addBookmark, removeBookmark } from "@/lib/firestore";

interface ListingCardProps {
  listing: Listing;
  isBookmarked: boolean;
  onBookmarkChange?: () => void;
}

export default function ListingCard({
  listing,
  isBookmarked,
  onBookmarkChange,
}: ListingCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const city = CITIES_MAP[listing.city];
  const regionColor = city ? REGION_COLORS[city.region] : "bg-gray-100 text-gray-700";
  const postIsNew = isNew(listing.pubDate);
  const postIsOld = isOld(listing.pubDate);

  const handleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await removeBookmark(listing.id);
        setBookmarked(false);
      } else {
        await addBookmark(listing);
        setBookmarked(true);
      }
      onBookmarkChange?.();
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex flex-col gap-3 min-h-[180px] ${
        postIsOld ? "opacity-60" : ""
      }`}
    >
      {/* Top row: badges + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Region badge */}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${regionColor}`}
          >
            {city?.region.charAt(0).toUpperCase() + (city?.region.slice(1) ?? "")} •{" "}
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
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          View on Craigslist
        </a>

        <button
          onClick={handleBookmark}
          disabled={bookmarkLoading}
          className={`p-1.5 rounded-lg transition-all ${
            bookmarked
              ? "text-rose-500 hover:text-rose-600 bg-rose-50"
              : "text-gray-400 hover:text-rose-400 hover:bg-rose-50"
          } disabled:opacity-50`}
          title={bookmarked ? "Remove bookmark" : "Save listing"}
        >
          <svg
            className="w-5 h-5"
            fill={bookmarked ? "currentColor" : "none"}
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
  );
}
