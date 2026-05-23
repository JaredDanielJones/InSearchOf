import type { Listing } from "@/types/listing";

// ── In-memory cache ─────────────────────────────────────────────────────────

const cache = new Map<string, { data: Listing[]; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── Types ─────────────────────────────────────────────────────────────────────

interface RedditPost {
  data: {
    id: string;
    title: string;
    permalink: string;
    selftext: string;
    created_utc: number;
    subreddit: string;
    subreddit_name_prefixed: string;
    is_self: boolean;
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Searches Reddit for ISO/WTB (In Search Of / Want To Buy) posts matching
 * the query. Uses Reddit's public JSON API — no auth, no proxy needed.
 */
export async function fetchWantedListings(query: string): Promise<Listing[]> {
  if (!query.trim()) return [];

  const cacheKey = query.trim().toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  // Wrap the user's query in ISO/WTB keywords so we only get "wanted" posts
  const searchQuery = `(WTB OR ISO OR "want to buy" OR "in search of") ${query.trim()}`;
  const params = new URLSearchParams({
    q: searchQuery,
    sort: "new",
    limit: "100",
    t: "month",
    type: "link",
  });

  const res = await fetch(`https://www.reddit.com/search.json?${params}`, {
    headers: {
      // Reddit requires a non-empty User-Agent for their API
      "User-Agent": "InSearchOf-App/1.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Reddit API returned HTTP ${res.status}`);
  }

  const json = (await res.json()) as { data: { children: RedditPost[] } };

  const listings: Listing[] = json.data.children
    .filter(
      ({ data: p }) =>
        // Skip deleted/removed posts
        p.title !== "[deleted]" &&
        p.title !== "[removed]" &&
        p.selftext !== "[deleted]" &&
        p.selftext !== "[removed]"
    )
    .map(({ data: post }) => ({
      id: `reddit-${post.id}`,
      title: post.title,
      link: `https://www.reddit.com${post.permalink}`,
      description: post.selftext
        ? post.selftext.slice(0, 300).replace(/\s+/g, " ").trim()
        : "",
      pubDate: new Date(post.created_utc * 1000).toISOString(),
      city: post.subreddit.toLowerCase(),
      cityLabel: post.subreddit_name_prefixed,
    }));

  cache.set(cacheKey, { data: listings, expiresAt: Date.now() + CACHE_TTL_MS });
  return listings;
}
