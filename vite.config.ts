import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The skinned character is optional (README: キャラクターモデル). Request it only
// when it is actually shipped, so a deploy without it doesn't 404 on every visit.
const characterGlb = existsSync(fileURLToPath(new URL("./public/models/character.glb", import.meta.url)));

export default defineConfig({
  define: {
    __CHARACTER_GLB__: JSON.stringify(characterGlb ? "/models/character.glb" : ""),
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "es2022",
  },
});
