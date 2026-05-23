import Parser from "rss-parser";
import type { Listing } from "@/types/listing";
import { CITIES_MAP, DEFAULT_CITIES, VALID_CITY_KEYS } from "./cities";
import { stripHtml } from "./utils";

// ── Parser setup ────────────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  customFields: {
    item: [["dc:date", "dcDate"]],
  },
});

// ── In-memory cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  data: { listings: Listing[]; failed: string[] };
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(
  key: string,
  data: { listings: Listing[]; failed: string[] }
) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── URL builder ─────────────────────────────────────────────────────────────

function buildUrl(cityKey: string, query: string): string {
  const params = new URLSearchParams({ format: "rss" });
  if (query.trim()) params.set("query", query.trim());
  return `https://${cityKey}.craigslist.org/search/wan?${params.toString()}`;
}

// ── ID generation ────────────────────────────────────────────────────────────

function generateId(cityKey: string, link: string): string {
  const postIdMatch = link.match(/\/(\d{10,})\.html/);
  if (postIdMatch) return `${cityKey}-${postIdMatch[1]}`;
  // Fallback: use last URL path segment
  const segment = link.split("/").pop()?.replace(".html", "") ?? String(Date.now());
  return `${cityKey}-${segment}`;
}

// ── Single city fetch ────────────────────────────────────────────────────────

async function parseFeed(
  cityKey: string,
  query: string
): Promise<{ listings: Listing[]; error?: string }> {
  const city = CITIES_MAP[cityKey];
  if (!city) return { listings: [], error: `Unknown city: ${cityKey}` };

  const url = buildUrl(cityKey, query);

  try {
    const feed = await parser.parseURL(url);
    const listings: Listing[] = (feed.items ?? []).map((item) => ({
      id: generateId(cityKey, item.link ?? ""),
      title: item.title?.trim() ?? "(no title)",
      link: item.link ?? "",
      description: stripHtml(
        item.content ?? item.contentSnippet ?? ""
      ),
      pubDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      city: cityKey,
      cityLabel: city.label,
    }));
    return { listings };
  } catch (err) {
    console.error(`[craigslist] Failed to fetch ${cityKey}:`, err);
    return { listings: [], error: String(err) };
  }
}

// ── Batch fetch all cities ───────────────────────────────────────────────────

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 300;

export async function fetchAllCities(
  cityKeys: string[],
  query: string
): Promise<{ listings: Listing[]; failed: string[] }> {
  // Validate keys
  const validKeys = cityKeys.filter((k) => VALID_CITY_KEYS.has(k));

  // Cache key based on sorted cities + query
  const cacheKey = [...validKeys].sort().join(",") + "|" + query;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const allListings: Listing[] = [];
  const failed: string[] = [];

  for (let i = 0; i < validKeys.length; i += BATCH_SIZE) {
    const batch = validKeys.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map((key) => parseFeed(key, query))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        allListings.push(...result.value.listings);
        if (result.value.error) failed.push(batch[j]);
      } else {
        failed.push(batch[j]);
      }
    }

    // Delay between batches (not after the last one)
    if (i + BATCH_SIZE < validKeys.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Sort newest first
  allListings.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const result = { listings: allListings, failed };
  setCached(cacheKey, result);
  return result;
}

export { DEFAULT_CITIES, VALID_CITY_KEYS };
