/** Read a trick id from location.hash; null when empty or unknown. */
export function trickIdFromHash(hash: string, knownIds: readonly string[]): string | null {
  let raw = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const id = raw.trim().toLowerCase();
  return id && knownIds.includes(id) ? id : null;
}

export function hashForTrick(id: string): string {
  return `#${id}`;
}

/** The trick to show after the hash changes (e.g. the browser's back button):
 * the default for an empty hash, as when the page was first opened; the trick
 * the hash names; or null for an unknown one (keep the trick, correct the URL). */
export function trickIdOnHashChange(hash: string, knownIds: readonly string[], defaultId: string): string | null {
  return hash === "" || hash === "#" ? defaultId : trickIdFromHash(hash, knownIds);
}
