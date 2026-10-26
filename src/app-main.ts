import * as THREE from "three";
import { Stage } from "./scene/Stage";
import { Cameras } from "./scene/Cameras";
import { Character } from "./character/Character";
import { AnimationPlayer } from "./character/AnimationPlayer";
import { AxisOverlay } from "./analysis/AxisOverlay";
import { ComTracer } from "./analysis/ComTracer";
import { Annotations } from "./analysis/Annotations";
import { AppState } from "./state/AppState";
import { TrickPicker } from "./ui/TrickPicker";
import { Timeline } from "./ui/Timeline";
import { InfoPanel } from "./ui/InfoPanel";
import { CameraSwitcher, OverlaySwitcher } from "./ui/CameraSwitcher";
import { DEFAULT_TRICK_ID, TRICKS, getTrick } from "./tricks/catalog";
import { hashForTrick, trickIdFromHash, trickIdOnHashChange } from "./lib/hash";
import { sceneLabel } from "./lib/labels";
import { STILL, buildFollowPath, followOffsetAt, type FollowPath } from "./lib/follow";
import { phraseHtml } from "./lib/phrases";
import { PanelTabs } from "./ui/PanelTabs";

/** URL of the optional skinned character, set at build time only when public/models/character.glb exists. */
const CHARACTER_GLB = typeof __CHARACTER_GLB__ === "string" ? __CHARACTER_GLB__ : "";

export async function startApp() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const stage = new Stage(canvas);
  const cameras = new Cameras(canvas);

  // The procedural humanoid unless a GLB was bundled; a deploy without one
  // doesn't request it (no 404 in the console).
  const character = await Character.load(CHARACTER_GLB || undefined);
  stage.scene.add(character.root);

  const player = new AnimationPlayer(character);
  const axisOverlay = new AxisOverlay(character);
  stage.scene.add(axisOverlay.group);
  const comTracer = new ComTracer(character, player);
  stage.scene.add(comTracer.line);
  const annotations = new Annotations(character, player);
  annotations.setCamera(cameras.camera);
  stage.scene.add(annotations.group);

  // The trick in the URL hash survives reloads and can be shared (SHIG 59, 12).
  const trickIds = TRICKS.map((t) => t.id);
  const initialId = trickIdFromHash(location.hash, trickIds) ?? DEFAULT_TRICK_ID;
  const initialTrick = getTrick(initialId);
  const state = new AppState({
    trickId: initialId,
    time: 0,
    duration: initialTrick.duration,
    speed: 1,
    playing: true,
    cameraMode: "free",
    showAxis: true,
    showCom: true,
    showAnnotations: true,
  });

  // Build HUD title (current trick name). It is the page's h1 once the title
  // screen is gone, and focusable so boot can move focus onto it.
  const hudTop = document.getElementById("hud-top")!;
  const titleBlock = document.createElement("h1");
  titleBlock.className = "title-block";
  titleBlock.tabIndex = -1;
  hudTop.appendChild(titleBlock);

  // UI mount
  new TrickPicker(document.getElementById("sidebar")!, state);
  const timeline = new Timeline(document.getElementById("timeline")!, state);
  new InfoPanel(document.getElementById("info")!, state);
  new CameraSwitcher(document.getElementById("hud-camera")!, state);
  new OverlaySwitcher(document.getElementById("hud-overlays")!, state);
  new PanelTabs(document.getElementById("panel-tabs")!, document.getElementById("app")!);

  // Camera follow for tricks that travel (SHIG 59: the body stays in view).
  // With reduced motion the camera does not move during playback; it frames
  // the whole travelled area instead.
  let follow: FollowPath = STILL;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reduceMotion = reducedMotion?.matches ?? false;
  reducedMotion?.addEventListener?.("change", (e) => {
    reduceMotion = e.matches;
  });

  // Handlers wiring state -> systems
  const applyTrick = (id: string) => {
    player.loadTrick(id);
    const meta = getTrick(id);
    state.set("duration", meta.duration);
    state.set("time", 0);
    canvas.setAttribute("aria-label", sceneLabel(meta));
    axisOverlay.setTrick(meta);
    annotations.setTrick(meta);
    comTracer.bake();
    follow = buildFollowPath(comTracer.samples, player.getDuration());
    titleBlock.innerHTML = `<span class="jp">${phraseHtml(meta.nameJp)}</span><span class="en">${meta.nameEn}</span>`;
    updateLabelKeepOut();
  };

  state.subscribe("trickId", applyTrick, true);
  const syncHash = (id: string) => {
    const hash = hashForTrick(id);
    if (location.hash !== hash) history.replaceState(null, "", hash);
  };
  state.subscribe("trickId", syncHash);
  // An unknown trick in the URL falls back to the default; make the URL say so.
  if (location.hash) syncHash(initialId);
  // Links between tricks add history entries, so the browser's back button
  // returns to the previous trick (SHIG 60).
  window.addEventListener("hashchange", () => {
    const id = trickIdOnHashChange(location.hash, trickIds, DEFAULT_TRICK_ID);
    if (id) state.set("trickId", id);
    else syncHash(state.get("trickId"));
  });
  cameras.setUserOrbitHandler(() => state.set("cameraMode", "free"));
  state.subscribe("playing", (p) => player.setPlaying(p));
  state.subscribe("speed", (s) => player.setSpeed(s));
  state.subscribe("cameraMode", (m) => cameras.setMode(m));
  state.subscribe("time", (t) => {
    if (Math.abs(player.getTime() - t) > 1e-3) player.setTime(t);
  });
  state.subscribe("showAxis", (v) => axisOverlay.setVisible(v));
  state.subscribe("showCom", (v) => comTracer.setVisible(v));
  state.subscribe("showAnnotations", (v) => annotations.setVisible(v));

  annotations.setSeekHandler((t) => {
    state.set("playing", false);
    state.set("time", t);
  });

  // Click handling for annotations
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    );
    annotations.tryClick(ndc);
  });

  // Labels in the 3D view stay clear of the controls drawn over it (SHIG 85).
  function updateLabelKeepOut() {
    const base = canvas.getBoundingClientRect();
    const controls = [titleBlock, document.getElementById("hud-camera"), document.getElementById("hud-overlays")];
    annotations.setBlockedAreas(
      controls
        .map((el) => el?.getBoundingClientRect())
        .filter((r): r is DOMRect => !!r && r.width > 0 && r.height > 0)
        .map((r) => ({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height })),
    );
  }

  // Resize
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    stage.resize(w, h);
    cameras.resize(w, h);
    annotations.setViewport(w, h);
    updateLabelKeepOut();
  };
  window.addEventListener("resize", resize);
  // initial resize once layout settles
  requestAnimationFrame(resize);

  // Main loop
  // THREE.Clock is deprecated since r183; Timer needs an explicit update() per frame.
  const timer = new THREE.Timer();
  let lastDur = state.get("duration");

  const tick = () => {
    timer.update();
    const dt = timer.getDelta();
    player.update(dt);
    if (!follow.active) cameras.setFollow(0, 0, 1);
    else if (reduceMotion) cameras.setFollow(follow.center.x, follow.center.z, follow.zoom);
    else {
      const offset = followOffsetAt(follow, player.getTime());
      cameras.setFollow(offset.x, offset.z, 1);
    }
    cameras.update();
    cameras.camera.updateMatrixWorld();
    axisOverlay.follow();
    annotations.highlightAt(player.getTime());
    annotations.updateLayout(dt, reduceMotion);

    // Sync state.time from player when playing
    if (state.get("playing")) {
      state.set("time", player.getTime());
    }
    timeline.syncFromTime(player.getTime());

    // Detect external duration changes
    if (state.get("duration") !== lastDur) {
      lastDur = state.get("duration");
    }

    stage.renderer.render(stage.scene, cameras.camera);
    requestAnimationFrame(tick);
  };
  tick();
}

