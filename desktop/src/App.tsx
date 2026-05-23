import { useState, useCallback } from 'react'
import type { Listing } from './types/listing'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SourceSelector from './components/SourceSelector'
import ListingGrid from './components/ListingGrid'
import { getBookmarkedIds } from './lib/storage'

interface Sources {
  reddit: boolean
  craigslist: boolean
}

interface Errors {
  reddit?: string
  craigslist?: string
}

export default function App() {
  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<Sources>({ reddit: true, craigslist: true })
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => getBookmarkedIds())
  const [hasSearched, setHasSearched] = useState(false)

  const refreshBookmarks = useCallback(() => {
    setBookmarkedIds(getBookmarkedIds())
  }, [])

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    if (!sources.reddit && !sources.craigslist) return

    setIsLoading(true)
    setErrors({})
    setHasSearched(true)

    try {
      const promises: Promise<void>[] = []
      const results: { reddit: Listing[]; craigslist: Listing[] } = {
        reddit: [],
        craigslist: [],
      }
      const newErrors: Errors = {}

      if (sources.reddit) {
        promises.push(
          window.electron
            .searchReddit(trimmed)
            .then((data) => {
              results.reddit = data
            })
            .catch((err: unknown) => {
              newErrors.reddit =
                err instanceof Error ? err.message : 'Failed to fetch Reddit results'
            })
        )
      }

      if (sources.craigslist) {
        promises.push(
          window.electron
            .searchCraigslist(trimmed)
            .then((data) => {
              if ('error' in data) {
                newErrors.craigslist = data.error
              } else {
                results.craigslist = data
              }
            })
            .catch((err: unknown) => {
              newErrors.craigslist =
                err instanceof Error ? err.message : 'Failed to fetch Craigslist results'
            })
        )
      }

      await Promise.all(promises)

      // Merge and deduplicate by ID
      const merged = [...results.reddit, ...results.craigslist]
      const seen = new Set<string>()
      const deduped = merged.filter((l) => {
        if (seen.has(l.id)) return false
        seen.add(l.id)
        return true
      })

      // Sort newest first
      deduped.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      )

      setListings(deduped)
      setErrors(newErrors)
    } finally {
      setIsLoading(false)
    }
  }, [sources])

  const handleRefresh = useCallback(() => {
    if (query.trim()) {
      handleSearch(query)
    }
  }, [query, handleSearch])

  const handleOpenFacebook = useCallback(() => {
    window.electron.openFacebook(query.trim() || 'wanted')
  }, [query])

  const combinedError =
    errors.reddit && errors.craigslist
      ? `Reddit: ${errors.reddit} | Craigslist: ${errors.craigslist}`
      : errors.reddit || errors.craigslist

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        isLoading={isLoading}
        totalCount={listings.length}
        onRefresh={handleRefresh}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Search + Source selection row */}
        <div className="flex flex-col gap-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          <SourceSelector
            sources={sources}
            onToggle={(source) =>
              setSources((prev) => ({ ...prev, [source]: !prev[source] }))
            }
            onOpenFacebook={handleOpenFacebook}
            query={query}
          />
        </div>

        {/* Results */}
        <ListingGrid
          listings={listings}
          isLoading={isLoading}
          bookmarkedIds={bookmarkedIds}
          error={combinedError}
          onBookmarkChange={refreshBookmarks}
          hasSearched={hasSearched}
        />
      </main>
    </div>
  )
}
