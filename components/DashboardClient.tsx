"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Listing, ListingsApiResponse } from "@/types/listing";
import { subscribeBookmarks } from "@/lib/firestore";
import type { BookmarkedListing } from "@/types/listing";
import Header from "./Header";
import SearchBar from "./SearchBar";
import ListingGrid from "./ListingGrid";
import WantList from "./WantList";
import BookmarksList from "./BookmarksList";

export default function DashboardClient() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [aiFiltered, setAiFiltered] = useState(false);

  // Search state
  const [query, setQuery] = useState("");

  // Want list (active items from WantList component)
  const [activeWantList, setActiveWantList] = useState<string[]>([]);

  // Bookmarks (real-time from Firestore)
  const [bookmarks, setBookmarks] = useState<BookmarkedListing[]>([]);
  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks]
  );

  // ── Subscribe to bookmarks ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeBookmarks(setBookmarks);
    return unsub;
  }, []);

  // ── Fetch listings ─────────────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (query.trim()) {
        params.set("query", query.trim());
      }

      if (activeWantList.length > 0) {
        params.set("wantList", activeWantList.join("||"));
      }

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data: ListingsApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to fetch listings.");
        setListings([]);
      } else {
        setListings(data.listings);
        setAiFiltered(data.aiFiltered);
        setLastFetchedAt(new Date(data.fetchedAt));
      }
    } catch {
      setError("Network error — please check your connection.");
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeWantList]);

  // Initial load
  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount — user triggers refresh explicitly

  // Re-fetch when want list changes (only if we already have data)
  useEffect(() => {
    if (lastFetchedAt !== null) {
      fetchListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWantList]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isLoading={isLoading}
        totalCount={listings.length}
        lastFetchedAt={lastFetchedAt}
        aiFiltered={aiFiltered}
        onRefresh={fetchListings}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Search bar */}
        <div className="space-y-3">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={fetchListings}
            isLoading={isLoading}
          />
          {/* Mobile stats + Bookmark panel */}
          <div className="flex items-center">
            {lastFetchedAt && !isLoading && (
              <span className="text-xs text-gray-400 sm:hidden">
                {listings.length} listings
              </span>
            )}
            <div className="ml-auto">
              <BookmarksList />
            </div>
          </div>
        </div>

        {/* Main content: sidebar + grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Want List sidebar */}
          <div className="lg:w-72 shrink-0">
            <WantList onWantListChange={setActiveWantList} />
          </div>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            <ListingGrid
              listings={listings}
              isLoading={isLoading}
              bookmarkedIds={bookmarkedIds}
              aiFiltered={aiFiltered}
              error={error}
              onBookmarkChange={() => {}} // Firestore subscription handles updates
            />
          </div>
        </div>
      </div>
    </div>
  );
}
