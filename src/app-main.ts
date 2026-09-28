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
import { hashForTrick, trickIdFromHash } from "./lib/hash";
import { PanelTabs } from "./ui/PanelTabs";

export async function startApp() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const stage = new Stage(canvas);
  const cameras = new Cameras(canvas);

  // Optional GLB at /models/character.glb — falls back to procedural humanoid.
  const character = await Character.load("/models/character.glb");
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

  // Build HUD title (current trick name)
  const hudTop = document.getElementById("hud-top")!;
  const titleBlock = document.createElement("div");
  titleBlock.className = "title-block";
  hudTop.appendChild(titleBlock);

  // UI mount
  new TrickPicker(document.getElementById("sidebar")!, state);
  const timeline = new Timeline(document.getElementById("timeline")!, state);
  new InfoPanel(document.getElementById("info")!, state);
  new CameraSwitcher(document.getElementById("hud-camera")!, state);
  new OverlaySwitcher(document.getElementById("hud-overlays")!, state);
  new PanelTabs(document.getElementById("panel-tabs")!, document.getElementById("app")!);

  // Handlers wiring state -> systems
  const applyTrick = (id: string) => {
    player.loadTrick(id);
    const meta = getTrick(id);
    state.set("duration", meta.duration);
    state.set("time", 0);
    axisOverlay.setTrick(meta);
    annotations.setTrick(meta);
    comTracer.bake();
    titleBlock.innerHTML = `<div class="jp">${meta.nameJp}</div><div class="en">${meta.nameEn}</div>`;
  };

  state.subscribe("trickId", applyTrick, true);
  const syncHash = (id: string) => {
    const hash = hashForTrick(id);
    if (location.hash !== hash) history.replaceState(null, "", hash);
  };
  state.subscribe("trickId", syncHash);
  // An unknown trick in the URL falls back to the default; make the URL say so.
  if (location.hash) syncHash(initialId);
  window.addEventListener("hashchange", () => {
    const id = trickIdFromHash(location.hash, trickIds);
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

  // Resize
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    stage.resize(w, h);
    cameras.resize(w, h);
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
    cameras.update();
    axisOverlay.follow();
    annotations.highlightAt(player.getTime());

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

