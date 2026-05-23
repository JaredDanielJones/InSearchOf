"use client";

import { useState, useEffect } from "react";
import type { BookmarkedListing } from "@/types/listing";
import { subscribeBookmarks, removeBookmark } from "@/lib/firestore";
import { CITIES_MAP, REGION_COLORS } from "@/lib/cities";
import { relativeTime } from "@/lib/utils";

export default function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<BookmarkedListing[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeBookmarks(setBookmarks);
    return unsub;
  }, []);

  const handleRemove = async (id: string) => {
    await removeBookmark(id);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
      >
        <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        Saved
        {bookmarks.length > 0 && (
          <span className="ml-1 bg-rose-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {bookmarks.length > 9 ? "9+" : bookmarks.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Saved Listings</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {bookmarks.length} {bookmarks.length === 1 ? "item" : "items"} saved
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3">🤍</span>
                  <p className="text-sm text-gray-500">
                    No saved listings yet. Click the heart on any listing to save it.
                  </p>
                </div>
              ) : (
                bookmarks.map((b) => {
                  const city = CITIES_MAP[b.city];
                  const regionColor = city
                    ? REGION_COLORS[city.region]
                    : "bg-gray-100 text-gray-700";

                  return (
                    <div
                      key={b.id}
                      className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${regionColor} shrink-0`}>
                          {b.cityLabel}
                        </span>
                        <button
                          onClick={() => handleRemove(b.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
                          title="Remove bookmark"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{b.title}</p>

                      {b.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{b.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-400">
                          {relativeTime(b.pubDate)}
                        </span>
                        <a
                          href={b.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          View ↗
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
