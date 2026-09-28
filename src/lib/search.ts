/**
 * Normalize search text so users need not type precisely (SHIG 50):
 * NFKC folds full/half-width, hiragana becomes katakana, and spaces,
 * hyphens and middle dots are dropped.
 */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[\s\-‐‑‒–—―ー・･_]/g, (c) => (c === "ー" ? c : ""));
}

/** `haystack` must already be normalized with normalizeSearch. */
export function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizeSearch(query);
  return q === "" || haystack.includes(q);
}
