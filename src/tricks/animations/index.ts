import * as THREE from "three";
import {
  build540,
  buildBackside720,
  buildBackside900,
  buildBackside900Hyper,
  buildCheat720,
  buildCheat900,
  buildLotus,
  buildPop360,
  buildPop540,
  buildPop720,
  buildPopTornado,
  buildSwing360,
  buildSwing900,
  buildTornado,
  buildTornadoSidekick,
} from "./kicks";
import {
  buildAerial,
  buildAerialTwist,
  buildButterflyKick,
  buildButterflyKickSwitch,
  buildButterflyTwist,
  buildCartwheel,
  buildMasterscoot,
  buildOneHandedCartwheel,
  buildRoundoff,
  buildScoot,
  buildScootHyper,
} from "./inside";
import {
  buildDoubleleg,
  buildDoublelegTwist,
  buildGumbi,
  buildRaiz,
  buildSailorMoon,
  buildSailorMoonRound,
  buildSideFlip,
  buildSideswipe,
  buildSpyder,
  buildSpyderTwist,
  buildTouchdownRaiz,
} from "./outside";
import {
  buildArabian,
  buildBackFlip,
  buildBackPike,
  buildCorkSwipe,
  buildCorkscrew,
  buildCorkscrewHyper,
  buildFlashKick,
  buildFrontFlip,
  buildFrontHalf,
  buildFrontXOut,
  buildFull,
  buildGainer,
  buildGainerArabian,
  buildGainerFlash,
  buildGainerSwitch,
  buildJanitor,
  buildLoser,
  buildTakFull,
  buildWebster,
  buildWebsterHalf,
  buildWrapFull,
  buildXOut,
} from "./flips";

/* Trick animation registry. Every trick lives in kicks.ts / inside.ts /
 * outside.ts / flips.ts and is authored on the semantic Rig (rig.ts), which
 * also solves foot and hand contact and ballistic flight. */

/* ============================ Registry ============================ */
type Factory = () => THREE.AnimationClip;

export const TRICK_FACTORIES: Record<string, Factory> = {
  // vertical kicks
  "cheat-kick": buildTornado,
  "tornado-sidekick": buildTornadoSidekick,
  "540-kick": build540,
  "cheat-720": buildCheat720,
  "cheat-900": buildCheat900,
  "pop-kick": buildPop360,
  "pop-tornado": buildPopTornado,
  "pop-540": buildPop540,
  "pop-720": buildPop720,
  "backside-720": buildBackside720,
  "backside-900": buildBackside900,
  "backside-900-hyper": buildBackside900Hyper,
  "swing-kick": buildSwing360,
  "swing-900": buildSwing900,
  // backward
  "back-flip": buildBackFlip,
  "back-pike": buildBackPike,
  "x-out": buildXOut,
  "flash-kick": buildFlashKick,
  arabian: buildArabian,
  "gainer-arabian": buildGainerArabian,
  gainer: buildGainer,
  "gainer-flash": buildGainerFlash,
  "gainer-switch": buildGainerSwitch,
  full: buildFull,
  corkscrew: buildCorkscrew,
  "corkscrew-hyper": buildCorkscrewHyper,
  "cork-swipe": buildCorkSwipe,
  // forward
  "front-flip": buildFrontFlip,
  "front-half": buildFrontHalf,
  "front-x-out": buildFrontXOut,
  webster: buildWebster,
  "webster-half": buildWebsterHalf,
  loser: buildLoser,
  janitor: buildJanitor,
  // inside
  butterfly: buildButterflyKick,
  "butterfly-kick-switch": buildButterflyKickSwitch,
  "butterfly-twist": buildButterflyTwist,
  cartwheel: buildCartwheel,
  "one-handed-cartwheel": buildOneHandedCartwheel,
  roundoff: buildRoundoff,
  aerial: buildAerial,
  "aerial-twist": buildAerialTwist,
  scoot: buildScoot,
  "scoot-hyper": buildScootHyper,
  "master-swing": buildMasterscoot,
  wrap: buildWrapFull,
  tak: buildTakFull,
  // outside
  gumbi: buildGumbi,
  raiz: buildRaiz,
  "touchdown-raiz": buildTouchdownRaiz,
  "sailor-moon": buildSailorMoon,
  "sailor-moon-round": buildSailorMoonRound,
  sideswipe: buildSideswipe,
  "double-leg": buildDoubleleg,
  "doubleleg-twist": buildDoublelegTwist,
  spider: buildSpyder,
  "spyder-twist": buildSpyderTwist,
  lotus: buildLotus,
  "side-flip": buildSideFlip,
};

export function buildClipFor(trickId: string): THREE.AnimationClip {
  const f = TRICK_FACTORIES[trickId];
  if (!f) throw new Error(`no animation factory for trick: ${trickId}`);
  return f();
}
