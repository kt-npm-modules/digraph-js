---
'@ktarmyshov/digraph-js': major
---

build: migrate `tsconfig.json` to `module: "nodenext"` / `moduleResolution: "nodenext"` (split into `tsconfig.base.json` + per-target overlays), bump TypeScript `lib` to `es2024` + `ESNext.{Array,Collection,Iterator}`, and raise minimum supported Node.js to `>=22.0.0` (Node 20 reached EOL). First stable 1.0 release. Internal: relative imports in `src/` and `tests/` now require explicit `.js` extensions. No public API surface changes.
