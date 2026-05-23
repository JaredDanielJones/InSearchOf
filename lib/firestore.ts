"use client";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BookmarkedListing, Listing } from "@/types/listing";

// ── Bookmarks ──────────────────────────────────────────────────────────────

export function subscribeBookmarks(
  callback: (items: BookmarkedListing[]) => void
): () => void {
  const q = query(
    collection(db, "bookmarks"),
    orderBy("bookmarkedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookmarkedListing))
    );
  });
}

export async function addBookmark(listing: Listing): Promise<void> {
  await setDoc(doc(db, "bookmarks", listing.id), {
    ...listing,
    bookmarkedAt: serverTimestamp(),
  });
}

export async function removeBookmark(id: string): Promise<void> {
  await deleteDoc(doc(db, "bookmarks", id));
}

export async function getBookmarkedIds(): Promise<Set<string>> {
  const snap = await getDocs(collection(db, "bookmarks"));
  return new Set(snap.docs.map((d) => d.id));
}

// Kept for future use — add new item to a collection
export async function addItem(collectionName: string, data: Record<string, unknown>): Promise<void> {
  await addDoc(collection(db, collectionName), {
    ...data,
    addedAt: serverTimestamp(),
  });
}
