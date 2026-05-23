"use client";

import type { Listing } from "@/types/listing";
import ListingCard from "./ListingCard";

interface ListingGridProps {
  listings: Listing[];
  isLoading: boolean;
  bookmarkedIds: Set<string>;
  error?: string | null;
  onBookmarkChange?: () => void;
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
  );
}

export default function ListingGrid({
  listings,
  isLoading,
  bookmarkedIds,
  error,
  onBookmarkChange,
}: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    const isKeyError = error.includes("SCRAPER_API_KEY");
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="font-semibold text-gray-800 mb-2">
          {isKeyError ? "ScraperAPI key needed" : "Something went wrong"}
        </h3>
        {isKeyError ? (
          <div className="text-sm text-gray-500 max-w-md space-y-3">
            <p>
              Craigslist blocks cloud server IPs. You need a free{" "}
              <a
                href="https://www.scraperapi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                ScraperAPI
              </a>{" "}
              key (1,000 free calls/month) to route around this.
            </p>
            <div className="bg-gray-100 rounded-lg p-3 text-left font-mono text-xs text-gray-700">
              firebase apphosting:secrets:set SCRAPER_API_KEY
            </div>
            <p className="text-xs text-gray-400">
              Then redeploy — searches will work instantly.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 max-w-md">{error}</p>
        )}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h3 className="font-semibold text-gray-800 mb-1">No listings found</h3>
        <p className="text-sm text-gray-500 max-w-md">
          Try a different keyword or search term.
        </p>
      </div>
    );
  }

  return (
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
  );
}
