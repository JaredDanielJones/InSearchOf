import type { Listing } from '../types/listing'

const STORAGE_KEY = 'insearchof:bookmarks'

/**
 * Returns all bookmarked listing IDs as a Set.
 */
export function getBookmarkedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const ids = JSON.parse(raw) as string[]
    return new Set(ids)
  } catch {
    return new Set()
  }
}

/**
 * Returns all bookmarked listings.
 */
export function getBookmarks(): Listing[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:data`)
    if (!raw) return []
    return JSON.parse(raw) as Listing[]
  } catch {
    return []
  }
}

/**
 * Adds a listing to bookmarks.
 */
export function addBookmark(listing: Listing): void {
  const ids = getBookmarkedIds()
  const listings = getBookmarks()

  if (!ids.has(listing.id)) {
    ids.add(listing.id)
    listings.push(listing)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
    localStorage.setItem(`${STORAGE_KEY}:data`, JSON.stringify(listings))
  }
}

/**
 * Removes a listing from bookmarks by ID.
 */
export function removeBookmark(id: string): void {
  const ids = getBookmarkedIds()
  const listings = getBookmarks()

  ids.delete(id)
  const updated = listings.filter((l) => l.id !== id)

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  localStorage.setItem(`${STORAGE_KEY}:data`, JSON.stringify(updated))
}

/**
 * Returns true if the listing ID is bookmarked.
 */
export function isBookmarked(id: string): boolean {
  return getBookmarkedIds().has(id)
}
