import { getTrick, TRICKS, type TrickMeta } from "../tricks/catalog";

/* The progression between tricks: each trick's prerequisites (the tricks to
 * learn first, as Loopkicks lists them) and, the other way round, the tricks
 * it unlocks (those that list it as a prerequisite). */

const unlocked = new Map<string, TrickMeta[]>();
for (const trick of TRICKS) {
  for (const id of trick.prerequisites ?? []) {
    const list = unlocked.get(id) ?? [];
    list.push(trick);
    unlocked.set(id, list);
  }
}

/** The tricks to learn before `id`, in the order Loopkicks lists them. */
export function prerequisitesOf(id: string): TrickMeta[] {
  return (getTrick(id).prerequisites ?? []).map(getTrick);
}

/** The tricks that list `id` as a prerequisite, in catalogue order. */
export function unlocksOf(id: string): TrickMeta[] {
  return unlocked.get(id) ?? [];
}
