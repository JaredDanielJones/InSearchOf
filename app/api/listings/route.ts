import { type NextRequest, NextResponse } from "next/server";
import { fetchAllCities } from "@/lib/craigslist";
import { filterListingsWithAI } from "@/lib/claude";
import { resolveLocation, DEFAULT_CITIES, VALID_CITY_KEYS } from "@/lib/cities";

// Allow up to 60s for RSS fetching + AI filtering
export const maxDuration = 60;

// Disable Next.js default caching — we handle caching in craigslist.ts
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const citiesParam = searchParams.get("cities");
  const query = searchParams.get("query") ?? "";
  const location = searchParams.get("location") ?? "";
  const skipAI = searchParams.get("skipAI") === "true";
  const wantListParam = searchParams.get("wantList") ?? "";

  // Resolve city list
  let requestedCities: string[];

  if (location.trim()) {
    // Location search overrides city selection
    const resolved = resolveLocation(location);
    requestedCities = resolved.length > 0 ? resolved : DEFAULT_CITIES;
  } else if (citiesParam) {
    requestedCities = citiesParam
      .split(",")
      .map((c) => c.trim())
      .filter((c) => VALID_CITY_KEYS.has(c));
    if (requestedCities.length === 0) requestedCities = DEFAULT_CITIES;
  } else {
    requestedCities = DEFAULT_CITIES;
  }

  try {
    // Fetch RSS feeds
    const { listings, failed } = await fetchAllCities(requestedCities, query);

    // AI filtering — only if want list provided and AI not skipped
    const wantListItems = wantListParam
      ? wantListParam
          .split("||")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let filteredListings = listings;
    let aiFiltered = false;

    if (!skipAI && wantListItems.length > 0) {
      filteredListings = await filterListingsWithAI(listings, wantListItems);
      aiFiltered = true;
    }

    return NextResponse.json({
      listings: filteredListings,
      fetchedAt: new Date().toISOString(),
      citiesRequested: requestedCities,
      citiesFailed: failed,
      totalCount: filteredListings.length,
      aiFiltered,
      wantListUsed: wantListItems,
    });
  } catch (err) {
    console.error("[api/listings] Error:", err);
    return NextResponse.json(
      {
        listings: [],
        fetchedAt: new Date().toISOString(),
        citiesRequested: requestedCities,
        citiesFailed: requestedCities,
        totalCount: 0,
        aiFiltered: false,
        wantListUsed: [],
        error: "Failed to fetch listings. Please try again.",
      },
      { status: 500 }
    );
  }
}
