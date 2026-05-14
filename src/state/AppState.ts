import type { CameraMode } from "../scene/Cameras";

export type AppStateShape = {
  trickId: string;
  time: number;
  duration: number;
  speed: number;
  playing: boolean;
  cameraMode: CameraMode;
  showAxis: boolean;
  showCom: boolean;
  showAnnotations: boolean;
};

type Listener<K extends keyof AppStateShape> = (
  value: AppStateShape[K],
  prev: AppStateShape[K],
) => void;

export class AppState {
  private state: AppStateShape;
  private listeners = new Map<keyof AppStateShape, Set<Listener<any>>>();

  constructor(initial: AppStateShape) {
    this.state = { ...initial };
  }

  get<K extends keyof AppStateShape>(key: K): AppStateShape[K] {
    return this.state[key];
  }

  set<K extends keyof AppStateShape>(key: K, value: AppStateShape[K]) {
    const prev = this.state[key];
    if (prev === value) return;
    this.state[key] = value;
    const ls = this.listeners.get(key);
    if (ls) for (const fn of ls) fn(value, prev);
  }

  subscribe<K extends keyof AppStateShape>(
    key: K,
    fn: Listener<K>,
    fireImmediately = false,
  ): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(fn as Listener<any>);
    if (fireImmediately) fn(this.state[key], this.state[key]);
    return () => set!.delete(fn as Listener<any>);
  }
}
