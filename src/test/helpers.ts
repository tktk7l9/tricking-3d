import { AppState, type AppStateShape } from "../state/AppState";

/** Fresh app state with the same defaults startApp() uses. */
export function makeState(overrides: Partial<AppStateShape> = {}): AppState {
  return new AppState({
    trickId: "back-flip",
    time: 0,
    duration: 1.6,
    speed: 1,
    playing: true,
    cameraMode: "free",
    showAxis: true,
    showCom: true,
    showAnnotations: true,
    ...overrides,
  });
}

/** Mount an empty host element into the document and return it. */
export function mountHost(tag = "div", id?: string): HTMLElement {
  const host = document.createElement(tag);
  if (id) host.id = id;
  document.body.appendChild(host);
  return host;
}
