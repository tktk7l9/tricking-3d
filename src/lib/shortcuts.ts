export type ShortcutAction = "toggle-play" | "step-back" | "step-forward";

export type KeyInput = {
  key: string;
  targetTag: string;
  targetType?: string;
  isContentEditable?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

const TYPING_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

/**
 * Map a keydown to a playback action. Keys are left alone while the user is in
 * a form control (search box, speed select, slider) so native behaviour wins.
 */
export function shortcutFor(e: KeyInput): ShortcutAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (TYPING_TAGS.has(e.targetTag) || e.isContentEditable) return null;
  switch (e.key) {
    case " ":
      // Space on a focused button activates that button; do not double-fire.
      return e.targetTag === "BUTTON" ? null : "toggle-play";
    case "ArrowLeft":
      return "step-back";
    case "ArrowRight":
      return "step-forward";
    default:
      return null;
  }
}
