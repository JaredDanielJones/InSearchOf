import { type NextRequest, NextResponse } from "next/server";
import { fetchAllCities } from "@/lib/craigslist";
import { filterListingsWithAI } from "@/lib/claude";

// Allow up to 60s for RSS fetching + AI filtering
export const maxDuration = 60;

// Disable Next.js default caching — we handle caching in craigslist.ts
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query") ?? "";
  const skipAI = searchParams.get("skipAI") === "true";
  const wantListParam = searchParams.get("wantList") ?? "";

  try {
    // Fetch RSS feeds — national search covers all of the US
    const { listings, failed } = await fetchAllCities([], query);

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
      citiesRequested: ["all-us"],
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
        citiesRequested: ["all-us"],
        citiesFailed: [],
        totalCount: 0,
        aiFiltered: false,
        wantListUsed: [],
        error: "Failed to fetch listings. Please try again.",
      },
      { status: 500 }
    );
  }
}
