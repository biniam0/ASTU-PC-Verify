/**
 * Turn raw barcode/QR text into a student ID string for the API.
 * Supports plain text, first line only, and optional URL query params (?studentId= / ?id=).
 */
export function normalizeScannedId(raw: string): string {
  const firstLine = raw.trim().split(/\r?\n/)[0]?.trim() ?? ''
  if (!firstLine) return ''

  try {
    const url = new URL(firstLine)
    const fromQuery =
      url.searchParams.get('studentId') ??
      url.searchParams.get('student_id') ??
      url.searchParams.get('id')
    if (fromQuery?.trim()) return fromQuery.trim()
    // e.g. path-only URLs — use last non-empty path segment if it looks like an ID
    const segments = url.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (last && /^[A-Za-z0-9/_\-]+$/.test(last)) return decodeURIComponent(last)
  } catch {
    // not a URL
  }

  return firstLine
}
