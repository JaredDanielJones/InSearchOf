import Parser from "rss-parser";
import type { Listing } from "@/types/listing";
import { CITIES_MAP } from "./cities";
import { stripHtml } from "./utils";

// ── Parser setup ────────────────────────────────────────────────────────────

const parser = new Parser({
  timeout: 20000,
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
 * www.craigslist.org covers ALL US regions — big cities and small towns.
 */
function buildNationalUrl(query: string): string {
  const params = new URLSearchParams({ format: "rss" });
  if (query.trim()) params.set("query", query.trim());
  return `https://www.craigslist.org/search/wan?${params.toString()}`;
}

// ── Proxy fetch ──────────────────────────────────────────────────────────────

/**
 * Craigslist blocks all cloud/datacenter IPs with a 403 "Host not in allowlist".
 * We route through ScraperAPI (free tier: 1,000 calls/month) which uses
 * residential IPs that Craigslist allows.
 *
 * Set SCRAPER_API_KEY in your environment variables to enable this.
 * Get a free key at: https://www.scraperapi.com/
 */
async function fetchRss(targetUrl: string): Promise<string> {
  const scraperKey = process.env.SCRAPER_API_KEY;

  let fetchUrl: string;
  let fetchOptions: RequestInit;

  if (scraperKey) {
    // Route through ScraperAPI to bypass Craigslist's cloud IP block.
    // ScraperAPI handles its own headers for Craigslist — don't override them.
    fetchUrl = `https://api.scraperapi.com/?api_key=${scraperKey}&url=${encodeURIComponent(targetUrl)}&render=false&premium=true`;
    fetchOptions = {};
  } else {
    fetchUrl = targetUrl;
    fetchOptions = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    };
  }

  const res = await fetch(fetchUrl, fetchOptions);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} fetching RSS${scraperKey ? " via ScraperAPI" : ""}` +
        (body ? `: ${body.slice(0, 200)}` : "")
    );
  }

  return res.text();
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
 * Fetches "for sale" listings from Craigslist's national search.
 * One request covers all US markets — from major metros to small towns.
 *
 * Requires SCRAPER_API_KEY env var to bypass Craigslist's cloud IP block.
 */
export async function fetchAllCities(
  _cityKeys: string[], // kept for API compatibility; national search ignores cities
  query: string
): Promise<{ listings: Listing[]; failed: string[] }> {
  const cacheKey = "national|" + query.trim().toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = buildNationalUrl(query);

  // Fetch raw RSS text (via ScraperAPI proxy if key is set)
  // Errors are intentionally NOT caught here — they bubble up to the route
  // handler which converts them into a user-friendly error response.
  const rssText = await fetchRss(url);

  // Parse the RSS string
  const feed = await parser.parseString(rssText);

  const listings: Listing[] = (feed.items ?? []).map((item) => {
    const { key, label } = extractCityFromUrl(item.link ?? "");
    return {
      id: generateId(key, item.link ?? ""),
      title: item.title?.trim() ?? "(no title)",
      link: item.link ?? "",
      description: stripHtml(item.content ?? item.contentSnippet ?? ""),
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
}

export { DEFAULT_CITIES, VALID_CITY_KEYS } from "./cities";
