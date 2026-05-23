export interface CityConfig {
  key: string; // CL subdomain
  label: string; // display name
  region: "west" | "central" | "east" | "south";
}

export const CITIES: CityConfig[] = [
  // West
  { key: "sfbay", label: "SF Bay Area", region: "west" },
  { key: "losangeles", label: "Los Angeles", region: "west" },
  { key: "sandiego", label: "San Diego", region: "west" },
  { key: "seattle", label: "Seattle", region: "west" },
  { key: "portland", label: "Portland", region: "west" },
  { key: "phoenix", label: "Phoenix", region: "west" },
  { key: "denver", label: "Denver", region: "west" },

  // Central
  { key: "chicago", label: "Chicago", region: "central" },
  { key: "minneapolis", label: "Minneapolis", region: "central" },
  { key: "stlouis", label: "St. Louis", region: "central" },
  { key: "kansascity", label: "Kansas City", region: "central" },
  { key: "milwaukee", label: "Milwaukee", region: "central" },
  { key: "indianapolis", label: "Indianapolis", region: "central" },
  { key: "columbus", label: "Columbus", region: "central" },

  // South
  { key: "dallas", label: "Dallas", region: "south" },
  { key: "houston", label: "Houston", region: "south" },
  { key: "austin", label: "Austin", region: "south" },
  { key: "miami", label: "Miami", region: "south" },
  { key: "orlando", label: "Orlando", region: "south" },
  { key: "atlanta", label: "Atlanta", region: "south" },
  { key: "nashville", label: "Nashville", region: "south" },
  { key: "charlotte", label: "Charlotte", region: "south" },

  // East
  { key: "newyork", label: "New York City", region: "east" },
  { key: "boston", label: "Boston", region: "east" },
  { key: "philadelphia", label: "Philadelphia", region: "east" },
  { key: "washingtondc", label: "Washington DC", region: "east" },
  { key: "baltimore", label: "Baltimore", region: "east" },
  { key: "pittsburgh", label: "Pittsburgh", region: "east" },
  { key: "detroit", label: "Detroit", region: "east" },
  { key: "cleveland", label: "Cleveland", region: "east" },
];

export const VALID_CITY_KEYS = new Set(CITIES.map((c) => c.key));
export const CITIES_MAP: Record<string, CityConfig> = Object.fromEntries(
  CITIES.map((c) => [c.key, c])
);
export const DEFAULT_CITIES = CITIES.map((c) => c.key);

// Location aliases for free-text location resolution
const LOCATION_ALIASES: Record<string, string[]> = {
  // West
  nyc: ["newyork"],
  "new york": ["newyork"],
  "new york city": ["newyork"],
  "bay area": ["sfbay"],
  sf: ["sfbay"],
  "san francisco": ["sfbay"],
  "sf bay": ["sfbay"],
  "east bay": ["sfbay"],
  "south bay": ["sfbay"],
  la: ["losangeles"],
  "los angeles": ["losangeles"],
  socal: ["losangeles", "sandiego"],
  "southern california": ["losangeles", "sandiego"],
  "san diego": ["sandiego"],
  sd: ["sandiego"],
  wa: ["seattle"],
  washington: ["seattle"],
  or: ["portland"],
  oregon: ["portland"],
  az: ["phoenix"],
  arizona: ["phoenix"],
  co: ["denver"],
  colorado: ["denver"],
  // PNW
  pnw: ["seattle", "portland"],
  "pacific northwest": ["seattle", "portland"],
  // Central
  il: ["chicago"],
  illinois: ["chicago"],
  mn: ["minneapolis"],
  minnesota: ["minneapolis"],
  "st louis": ["stlouis"],
  "saint louis": ["stlouis"],
  mo: ["stlouis", "kansascity"],
  missouri: ["stlouis", "kansascity"],
  "kansas city": ["kansascity"],
  kc: ["kansascity"],
  wi: ["milwaukee"],
  wisconsin: ["milwaukee"],
  in: ["indianapolis"],
  indiana: ["indianapolis"],
  oh: ["columbus", "cleveland"],
  ohio: ["columbus", "cleveland"],
  // South
  tx: ["dallas", "houston", "austin"],
  texas: ["dallas", "houston", "austin"],
  fl: ["miami", "orlando"],
  florida: ["miami", "orlando"],
  ga: ["atlanta"],
  georgia: ["atlanta"],
  tn: ["nashville"],
  tennessee: ["nashville"],
  nc: ["charlotte"],
  "north carolina": ["charlotte"],
  // East
  ma: ["boston"],
  massachusetts: ["boston"],
  pa: ["philadelphia", "pittsburgh"],
  pennsylvania: ["philadelphia", "pittsburgh"],
  dc: ["washingtondc"],
  "washington dc": ["washingtondc"],
  "washington d.c.": ["washingtondc"],
  md: ["baltimore"],
  maryland: ["baltimore"],
  mi: ["detroit"],
  michigan: ["detroit"],
};

/**
 * Resolves free-text location input to one or more Craigslist city keys.
 * Returns empty array if no match (caller should use all cities).
 */
export function resolveLocation(input: string): string[] {
  if (!input || !input.trim()) return [];

  const normalized = input.trim().toLowerCase();

  // Check aliases first (exact match)
  if (LOCATION_ALIASES[normalized]) {
    return LOCATION_ALIASES[normalized];
  }

  // Check city labels directly
  const directMatch = CITIES.filter(
    (c) =>
      c.label.toLowerCase() === normalized ||
      c.key === normalized ||
      c.label.toLowerCase().includes(normalized) ||
      normalized.includes(c.label.toLowerCase())
  ).map((c) => c.key);

  if (directMatch.length > 0) return directMatch;

  // Fuzzy: check aliases for partial matches
  for (const [alias, keys] of Object.entries(LOCATION_ALIASES)) {
    if (alias.includes(normalized) || normalized.includes(alias)) {
      return keys;
    }
  }

  return [];
}

export const REGION_COLORS: Record<CityConfig["region"], string> = {
  west: "bg-blue-100 text-blue-800",
  central: "bg-green-100 text-green-800",
  south: "bg-orange-100 text-orange-800",
  east: "bg-red-100 text-red-800",
};
