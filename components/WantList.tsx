"use client";

import { useState, useEffect, useRef } from "react";
import type { WantListItem } from "@/types/listing";
import {
  subscribeWantList,
  addWantListItem,
  toggleWantListItem,
  deleteWantListItem,
} from "@/lib/firestore";

interface WantListProps {
  onWantListChange?: (activeItems: string[]) => void;
}

export default function WantList({ onWantListChange }: WantListProps) {
  const [items, setItems] = useState<WantListItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsub = subscribeWantList((wantListItems) => {
      setItems(wantListItems);
      const active = wantListItems
        .filter((i) => i.active)
        .map((i) => i.item);
      onWantListChange?.(active);
    });
    return unsub;
  }, [onWantListChange]);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      await addWantListItem(newItem.trim());
      setNewItem("");
      inputRef.current?.focus();
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const handleToggle = async (item: WantListItem) => {
    await toggleWantListItem(item.id, !item.active);
  };

  const handleDelete = async (id: string) => {
    await deleteWantListItem(id);
  };

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="font-semibold text-gray-800">My Want List</span>
          {activeCount > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
              AI Filtering ON · {activeCount} active
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Add item input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. vintage lawnmower, wooden shelf..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newItem.trim()}
              className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? "..." : "+ Add"}
            </button>
          </div>

          {/* Items list */}
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-2">
              Add items you&apos;re willing to source & resell
            </p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-2 group p-2 rounded-lg transition-colors ${
                    item.active ? "bg-purple-50" : "bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(item)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        item.active
                          ? "bg-purple-500 border-purple-500"
                          : "border-gray-300"
                      }`}
                    >
                      {item.active && (
                        <svg
                          className="w-full h-full text-white p-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-sm ${
                        item.active
                          ? "text-gray-800 font-medium"
                          : "text-gray-400 line-through"
                      }`}
                    >
                      {item.item}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Status footer */}
          {activeCount > 0 && (
            <p className="text-xs text-purple-600 text-center">
              🤖 Claude is filtering listings to match your{" "}
              {activeCount} active {activeCount === 1 ? "item" : "items"}
            </p>
          )}
          {items.length > 0 && activeCount === 0 && (
            <p className="text-xs text-gray-400 text-center">
              Enable items above to activate AI filtering
            </p>
          )}
        </div>
      )}
    </div>
  );
}
