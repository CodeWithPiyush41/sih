/**
 * Normalizes text strings for deterministic string matching:
 * Converts to lowercase, strips punctuation, normalizes dashes/underscores and whitespace.
 */
export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\-_]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Checks whether target string contains normalized query string as exact or token match.
 */
export function isNormalizedMatch(source?: string | null, target?: string | null): boolean {
  const normSource = normalizeText(source);
  const normTarget = normalizeText(target);
  if (!normSource || !normTarget) return false;
  return normSource.includes(normTarget) || normTarget.includes(normSource);
}
