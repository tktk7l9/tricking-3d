// Tiny entry point. The Three.js analyzer (~683KB) is loaded only when the
// user clicks the start button ("3Dで見る") so we get a fast FCP / LCP on mobile.

// Cloudflare Web Analytics — production only. The site token is a public
// identifier embedded in every page, not a secret.
if (import.meta.env.PROD) {
  const beacon = document.createElement("script");
  beacon.type = "module";
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = '{"token": "cd156fbf0fd24da0a12e58fdb4e63828"}'; // gitleaks:allow
  document.head.appendChild(beacon);
}

const startBtn = document.getElementById("title-start") as HTMLButtonElement | null;
const titleOverlay = document.getElementById("title-overlay");
const app = document.getElementById("app");

let loadPromise: Promise<typeof import("./app-main")> | null = null;
function load() {
  loadPromise ??= import("./app-main");
  return loadPromise;
}

async function boot() {
  try {
    const mod = await load();
    if (titleOverlay) titleOverlay.remove();
    if (app) app.hidden = false;
    await mod.startApp();
    // The start button is gone; land focus on the trick title so keyboard and
    // screen-reader users know where they are (SHIG 59).
    document.querySelector<HTMLElement>("#hud-top .title-block")?.focus();
  } catch (e) {
    console.error(e);
    showBootError(e);
  }
}

if (startBtn) {
  startBtn.addEventListener("pointerenter", load, { once: true });
  startBtn.addEventListener("touchstart", load, { once: true });
  startBtn.addEventListener(
    "click",
    () => {
      startBtn.disabled = true;
      startBtn.textContent = "読み込み中…";
      boot();
    },
    { once: true },
  );
} else {
  // Fallback: no title button found — boot immediately (preserves legacy behavior).
  boot();
}

/** Constructive boot-failure screen: what happened, why, and what to do next (SHIG 55). */
function showBootError(e: unknown) {
  // The error replaces the whole body, so it must carry the page's only <main>
  // landmark itself; role="alert" sits on an inner wrapper because it would
  // otherwise override the landmark role.
  const box = document.createElement("main");
  box.className = "boot-error";
  const message = document.createElement("div");
  message.setAttribute("role", "alert");
  const h = document.createElement("h1");
  h.textContent = "3D 表示を開始できませんでした";
  const p = document.createElement("p");
  p.textContent =
    "このブラウザでは 3D 描画（WebGL）が使えない可能性があります。再読み込みするか、Chrome・Safari・Edge の最新版でお試しください。";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "再読み込み";
  retry.addEventListener("click", () => location.reload());
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "詳しい情報";
  const pre = document.createElement("pre");
  pre.textContent = String(e);
  details.append(summary, pre);
  message.append(h, p);
  box.append(message, retry, details);
  document.body.replaceChildren(box);
  // The start button that had focus is gone; keep keyboard users on the next step (SHIG 60).
  retry.focus();
}
