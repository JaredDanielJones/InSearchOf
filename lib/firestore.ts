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
  updateDoc,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BookmarkedListing, Listing, WantListItem } from "@/types/listing";

// ── Want List ──────────────────────────────────────────────────────────────

export async function getActiveWantList(): Promise<WantListItem[]> {
  const q = query(
    collection(db, "wantList"),
    where("active", "==", true),
    orderBy("addedAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as WantListItem)
  );
}

export async function getAllWantList(): Promise<WantListItem[]> {
  const q = query(collection(db, "wantList"), orderBy("addedAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as WantListItem)
  );
}

export function subscribeWantList(
  callback: (items: WantListItem[]) => void
): () => void {
  const q = query(collection(db, "wantList"), orderBy("addedAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WantListItem)));
  });
}

export async function addWantListItem(item: string): Promise<void> {
  await addDoc(collection(db, "wantList"), {
    item: item.trim(),
    active: true,
    addedAt: serverTimestamp(),
  });
}

export async function toggleWantListItem(
  id: string,
  active: boolean
): Promise<void> {
  await updateDoc(doc(db, "wantList", id), { active });
}

export async function deleteWantListItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "wantList", id));
}

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
