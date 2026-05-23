import Parser from "rss-parser";
import type { Listing } from "@/types/listing";
import { CITIES_MAP } from "./cities";
import { stripHtml } from "./utils";

// ── Parser setup ────────────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 15000, // Longer timeout for national search
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

/**
 * Builds the national Craigslist "wanted" RSS URL.
 * Using www.craigslist.org covers ALL US regions — big cities and small towns.
 * srchType=T restricts matches to listing titles only.
 */
function buildNationalUrl(query: string): string {
  const params = new URLSearchParams({ format: "rss", srchType: "T" });
  if (query.trim()) params.set("query", query.trim());
  return `https://www.craigslist.org/search/wan?${params.toString()}`;
}

// ── City extraction ──────────────────────────────────────────────────────────

/**
 * Extracts the Craigslist subdomain from a listing URL so we can show
 * a city label even for markets not in our CITIES_MAP.
 */
function extractCityFromUrl(url: string): { key: string; label: string } {
  const match = url.match(/https?:\/\/([^.]+)\.craigslist\.org/);
  const key = match ? match[1] : "unknown";
  const cityConfig = CITIES_MAP[key];
  // Fall back to prettifying the subdomain if it's not in our known map
  const label =
    cityConfig?.label ??
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/(?=[A-Z])/)
      .join(" ")
      .replace(/^./, (s) => s.toUpperCase());
  return { key, label };
}

// ── ID generation ────────────────────────────────────────────────────────────

function generateId(cityKey: string, link: string): string {
  const postIdMatch = link.match(/\/(\d{10,})\.html/);
  if (postIdMatch) return `${cityKey}-${postIdMatch[1]}`;
  const segment =
    link.split("/").pop()?.replace(".html", "") ?? String(Date.now());
  return `${cityKey}-${segment}`;
}

// ── National fetch ───────────────────────────────────────────────────────────

/**
 * Fetches for-sale listings from Craigslist's national search.
 * One request covers all US markets — from major metros to small towns.
 */
export async function fetchAllCities(
  _cityKeys: string[], // kept for API compatibility; national search ignores cities
  query: string
): Promise<{ listings: Listing[]; failed: string[] }> {
  const cacheKey = "national|" + query.trim().toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = buildNationalUrl(query);

  try {
    const feed = await parser.parseURL(url);

    const listings: Listing[] = (feed.items ?? []).map((item) => {
      const { key, label } = extractCityFromUrl(item.link ?? "");
      return {
        id: generateId(key, item.link ?? ""),
        title: item.title?.trim() ?? "(no title)",
        link: item.link ?? "",
        description: stripHtml(
          item.content ?? item.contentSnippet ?? ""
        ),
        pubDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        city: key,
        cityLabel: label,
      };
    });

    // Sort newest first
    listings.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    const result = { listings, failed: [] };
    setCached(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[craigslist] Failed to fetch national listings:", err);
    return { listings: [], failed: ["national"] };
  }
}

export { DEFAULT_CITIES, VALID_CITY_KEYS } from "./cities";
