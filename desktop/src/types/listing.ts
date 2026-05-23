export interface Listing {
  id: string
  title: string
  link: string
  description: string
  pubDate: string
  city: string        // subreddit key OR craigslist subdomain
  cityLabel: string   // "r/wantToBuy" OR "SF Bay Area"
  source: 'reddit' | 'craigslist'
}

// Extend window with our Electron bridge
declare global {
  interface Window {
    electron: {
      searchReddit: (query: string) => Promise<Listing[]>
      searchCraigslist: (query: string) => Promise<Listing[] | { error: string }>
      openFacebook: (query: string) => Promise<void>
      openExternal: (url: string) => Promise<void>
    }
  }
}
