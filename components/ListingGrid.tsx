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
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="font-semibold text-gray-800 mb-1">Something went wrong</h3>
        <p className="text-sm text-gray-500 max-w-md">{error}</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h3 className="font-semibold text-gray-800 mb-1">Search to find buyers</h3>
        <p className="text-sm text-gray-500 max-w-md">
          Type an item above to find Reddit ISO/WTB posts — people actively looking to buy that thing.
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
