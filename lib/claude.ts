import Anthropic from "@anthropic-ai/sdk";
import type { Listing } from "@/types/listing";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHUNK_SIZE = 50; // Max listings per Claude call

/**
 * Uses Claude to filter listings based on the user's want list.
 * Returns only listings that are relevant to at least one want list item.
 * Falls back to returning all listings if Claude errors.
 */
export async function filterListingsWithAI(
  listings: Listing[],
  wantList: string[]
): Promise<Listing[]> {
  if (!listings.length || !wantList.length) return listings;

  const filtered: Listing[] = [];

  // Process in chunks to stay within token limits
  for (let i = 0; i < listings.length; i += CHUNK_SIZE) {
    const chunk = listings.slice(i, i + CHUNK_SIZE);
    const chunkFiltered = await filterChunk(chunk, wantList);
    filtered.push(...chunkFiltered);
  }

  return filtered;
}

async function filterChunk(
  listings: Listing[],
  wantList: string[]
): Promise<Listing[]> {
  const listingSummaries = listings
    .map((l, i) => `${i}: ${l.title} — ${l.description.slice(0, 120)}`)
    .join("\n");

  const wantListText = wantList.map((w) => `- ${w}`).join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: `You are a filter for classified ad listings. You help a reseller find items that people want to buy so they can source and sell them. Be semantically inclusive — "ride-on mower" matches "lawnmower", "bookcase" matches "wooden shelf", etc.`,
          // Enable prompt caching for the stable system prompt
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `The user is willing to source and resell these types of items:
${wantListText}

Here are classified "wanted" listings (index: title — description):
${listingSummaries}

Return ONLY a JSON array of the index numbers of listings relevant to at least one want list item. Return an empty array [] if none match. No explanation, just the JSON array.
Example: [0, 3, 7]`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return listings;

    // Extract JSON array from response
    const match = content.text.match(/\[[\d,\s]*\]/);
    if (!match) return listings;

    const indexes: number[] = JSON.parse(match[0]);
    return indexes
      .filter((i) => Number.isInteger(i) && i >= 0 && i < listings.length)
      .map((i) => listings[i]);
  } catch (err) {
    console.error("[claude] AI filtering failed, returning unfiltered:", err);
    return listings; // Graceful fallback
  }
}
