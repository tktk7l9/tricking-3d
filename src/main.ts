// Tiny entry point. The Three.js analyzer (~683KB) is loaded only when the
// user clicks "ANALYZE START" so we get a fast FCP / LCP on mobile.
const startBtn = document.getElementById("title-start") as HTMLButtonElement | null;
const titleOverlay = document.getElementById("title-overlay");

let loadPromise: Promise<typeof import("./app-main")> | null = null;
function load() {
  loadPromise ??= import("./app-main");
  return loadPromise;
}

async function boot() {
  try {
    const mod = await load();
    if (titleOverlay) titleOverlay.remove();
    await mod.startApp();
  } catch (e) {
    console.error(e);
    document.body.innerHTML =
      '<pre style="color:#ff8;padding:20px">起動失敗: ' + String(e) + "</pre>";
  }
}

if (startBtn) {
  startBtn.addEventListener("pointerenter", load, { once: true });
  startBtn.addEventListener("touchstart", load, { once: true });
  startBtn.addEventListener(
    "click",
    () => {
      startBtn.disabled = true;
      startBtn.textContent = "LOADING…";
      boot();
    },
    { once: true },
  );
} else {
  // Fallback: no title button found — boot immediately (preserves legacy behavior).
  boot();
}
