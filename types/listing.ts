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

export interface ListingsApiResponse {
  listings: Listing[];
  fetchedAt: string;
  citiesRequested: string[];
  citiesFailed: string[];
  totalCount: number;
  error?: string;
}
