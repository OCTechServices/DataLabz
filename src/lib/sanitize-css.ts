// Server-side CSS sanitizer for MySpace-style custom CSS input.
// Strips dangerous patterns before storing in the DB.
// Applied again client-side as a final guard before injection.

const MAX_LEN = 10_000

export function sanitizeCss(raw: string): string {
  return raw
    .slice(0, MAX_LEN)
    .replace(/<[^>]*>/g, '')                               // strip any HTML tags
    .replace(/javascript\s*:/gi, '')                       // no js: URIs
    .replace(/expression\s*\(/gi, '')                      // no IE CSS expressions
    .replace(/@import\s+url\s*\(\s*["']?\s*https?:\/\//gi, '') // no external @import
    .replace(/behavior\s*:/gi, '')                         // no IE behavior
    .replace(/\burl\s*\(\s*["']?\s*javascript/gi, '')      // no url(javascript:...)
    .replace(/-moz-binding\s*:/gi, '')                     // no XBL binding (old Firefox)
}
