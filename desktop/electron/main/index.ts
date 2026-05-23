import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import Parser from 'rss-parser'
import type { Listing } from '../../src/types/listing'

// ── RSS parser ───────────────────────────────────────────────────────────────

const rssParser = new Parser({
  timeout: 20000,
  customFields: {
    item: [['dc:date', 'dcDate']],
  },
})

// ── Window tracking ──────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let facebookWindow: BrowserWindow | null = null

// ── Main window ──────────────────────────────────────────────────────────────

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../../out/renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractCityFromUrl(url: string): { key: string; label: string } {
  const match = url.match(/https?:\/\/([^.]+)\.craigslist\.org/)
  const key = match ? match[1] : 'unknown'
  const label = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (s) => s.toUpperCase())
  return { key, label }
}

function generateCraigslistId(cityKey: string, link: string): string {
  const postIdMatch = link.match(/\/(\d{10,})\.html/)
  if (postIdMatch) return `cl-${cityKey}-${postIdMatch[1]}`
  const segment = link.split('/').pop()?.replace('.html', '') ?? String(Date.now())
  return `cl-${cityKey}-${segment}`
}

function stripHtml(html: string, maxLength = 300): string {
  return html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

// ── IPC: search:reddit ───────────────────────────────────────────────────────

interface RedditPost {
  data: {
    id: string
    title: string
    permalink: string
    selftext: string
    created_utc: number
    subreddit: string
    subreddit_name_prefixed: string
  }
}

interface RedditApiResponse {
  data: {
    children: RedditPost[]
  }
}

ipcMain.handle('search:reddit', async (_event, query: string): Promise<Listing[]> => {
  if (!query.trim()) return []

  const searchQuery = `(WTB OR ISO OR "want to buy" OR "in search of") ${query.trim()}`
  const params = new URLSearchParams({
    q: searchQuery,
    sort: 'new',
    limit: '100',
    t: 'month',
    type: 'link',
  })

  const res = await fetch(`https://www.reddit.com/search.json?${params}`, {
    headers: {
      'User-Agent': 'InSearchOf-Desktop/1.0',
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Reddit API returned HTTP ${res.status}`)
  }

  const json = (await res.json()) as RedditApiResponse

  const listings: Listing[] = json.data.children
    .filter(
      ({ data: p }) =>
        p.title !== '[deleted]' &&
        p.title !== '[removed]' &&
        p.selftext !== '[deleted]' &&
        p.selftext !== '[removed]'
    )
    .map(({ data: post }) => ({
      id: `reddit-${post.id}`,
      title: post.title,
      link: `https://www.reddit.com${post.permalink}`,
      description: post.selftext
        ? post.selftext.slice(0, 300).replace(/\s+/g, ' ').trim()
        : '',
      pubDate: new Date(post.created_utc * 1000).toISOString(),
      city: post.subreddit.toLowerCase(),
      cityLabel: post.subreddit_name_prefixed,
      source: 'reddit' as const,
    }))

  // Bounce dock on macOS when results arrive
  if (process.platform === 'darwin' && listings.length > 0) {
    app.dock.bounce('informational')
  }

  return listings
})

// ── IPC: search:craigslist ───────────────────────────────────────────────────

ipcMain.handle(
  'search:craigslist',
  async (_event, query: string): Promise<Listing[] | { error: string }> => {
    if (!query.trim()) return []

    try {
      const params = new URLSearchParams({ format: 'rss', query: query.trim() })
      const url = `https://www.craigslist.org/search/wan?${params.toString()}`

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      })

      if (!res.ok) {
        return { error: `Craigslist returned HTTP ${res.status}. Try again later.` }
      }

      const rssText = await res.text()
      const feed = await rssParser.parseString(rssText)

      const listings: Listing[] = (feed.items ?? []).map((item) => {
        const { key, label } = extractCityFromUrl(item.link ?? '')
        return {
          id: generateCraigslistId(key, item.link ?? ''),
          title: item.title?.trim() ?? '(no title)',
          link: item.link ?? '',
          description: stripHtml(item.content ?? item.contentSnippet ?? ''),
          pubDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          city: key,
          cityLabel: label,
          source: 'craigslist' as const,
        }
      })

      listings.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      )

      // Bounce dock on macOS when results arrive
      if (process.platform === 'darwin' && listings.length > 0) {
        app.dock.bounce('informational')
      }

      return listings
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { error: `Failed to fetch Craigslist results: ${message}` }
    }
  }
)

// ── IPC: facebook:open ───────────────────────────────────────────────────────

ipcMain.handle('facebook:open', async (_event, query: string): Promise<void> => {
  const encodedQuery = encodeURIComponent(`ISO ${query}`)
  const fbUrl = `https://www.facebook.com/marketplace/search/?query=${encodedQuery}`

  if (facebookWindow && !facebookWindow.isDestroyed()) {
    facebookWindow.loadURL(fbUrl)
    facebookWindow.focus()
    return
  }

  facebookWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'Facebook Marketplace — InSearchOf',
    webPreferences: {
      partition: 'persist:facebook',
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  facebookWindow.loadURL(fbUrl)
  facebookWindow.show()

  facebookWindow.on('closed', () => {
    facebookWindow = null
  })
})

// ── IPC: shell:openExternal ──────────────────────────────────────────────────

ipcMain.handle('shell:openExternal', async (_event, url: string): Promise<void> => {
  await shell.openExternal(url)
})
