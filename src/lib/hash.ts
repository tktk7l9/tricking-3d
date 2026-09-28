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
