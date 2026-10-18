export function toTitle(slug) {
  return String(slug ?? '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
