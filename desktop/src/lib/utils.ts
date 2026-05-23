/**
 * Strip HTML tags from a string and decode common HTML entities.
 * Returns plain text capped at maxLength characters.
 */
export function stripHtml(html: string, maxLength = 300): string {
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

/**
 * Returns a human-readable relative time string.
 * e.g. "just now", "4m ago", "3h ago", "2d ago"
 */
export function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  if (isNaN(diffMs)) return 'unknown'
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Returns true if the listing was posted within the last N hours.
 */
export function isNew(isoDate: string, hours = 2): boolean {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  return diffMs < hours * 60 * 60 * 1000
}

/**
 * Returns true if the listing is older than N days (visually dimmed).
 */
export function isOld(isoDate: string, days = 3): boolean {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  return diffMs > days * 24 * 60 * 60 * 1000
}

/**
 * Simple debounce — returns a function that delays invoking fn until
 * after `delay` ms have elapsed since the last call.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
