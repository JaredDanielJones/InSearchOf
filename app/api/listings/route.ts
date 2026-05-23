import { type NextRequest, NextResponse } from "next/server";
import { fetchWantedListings } from "@/lib/reddit";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  // Don't fetch anything until the user provides a query
  if (!query.trim()) {
    return NextResponse.json({
      listings: [],
      fetchedAt: new Date().toISOString(),
      totalCount: 0,
    });
  }

  try {
    const listings = await fetchWantedListings(query);
    return NextResponse.json({
      listings,
      fetchedAt: new Date().toISOString(),
      totalCount: listings.length,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[api/listings] Error:", errMsg);
    return NextResponse.json(
      {
        listings: [],
        fetchedAt: new Date().toISOString(),
        totalCount: 0,
        error: `Failed to fetch listings: ${errMsg}`,
      },
      { status: 500 }
    );
  }
}
