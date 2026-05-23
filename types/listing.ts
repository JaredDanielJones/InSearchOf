import type { Timestamp } from "firebase/firestore";

export interface Listing {
  id: string; // "{cityKey}-{clPostId}" e.g. "sfbay-7654321098"
  title: string;
  link: string; // original CL URL — user clicks through here
  description: string; // plain text snippet, max 300 chars
  pubDate: string; // ISO 8601
  city: string; // CL subdomain key
  cityLabel: string; // "SF Bay Area"
}

export interface BookmarkedListing extends Listing {
  bookmarkedAt: Timestamp | string;
}

export interface WantListItem {
  id: string; // Firestore auto-ID
  item: string; // e.g. "vintage lawnmower"
  category?: string; // optional label e.g. "yard equipment"
  active: boolean; // toggle on/off without deleting
  addedAt: Timestamp | string;
}

export interface ListingsApiResponse {
  listings: Listing[];
  fetchedAt: string;
  citiesRequested: string[];
  citiesFailed: string[];
  totalCount: number;
  aiFiltered: boolean;
  wantListUsed: string[];
  error?: string;
}
