import { type NextRequest, NextResponse } from "next/server";
import { fetchAllCities } from "@/lib/craigslist";

// Allow up to 60s for RSS fetching
export const maxDuration = 60;

// Disable Next.js default caching — we handle caching in craigslist.ts
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  try {
    const { listings, failed } = await fetchAllCities([], query);

    return NextResponse.json({
      listings,
      fetchedAt: new Date().toISOString(),
      citiesRequested: ["all-us"],
      citiesFailed: failed,
      totalCount: listings.length,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[api/listings] Error:", errMsg);
    const missingKey = !process.env.ZENROWS_API_KEY && !process.env.SCRAPER_API_KEY;
    return NextResponse.json(
      {
        listings: [],
        fetchedAt: new Date().toISOString(),
        citiesRequested: ["all-us"],
        citiesFailed: [],
        totalCount: 0,
        error: missingKey
          ? "ZENROWS_API_KEY is not set. Craigslist blocks cloud server IPs — add a free ZenRows key to fix this. Get one at zenrows.com."
          : `Failed to fetch listings: ${errMsg}`,
      },
      { status: 500 }
    );
  }
}
