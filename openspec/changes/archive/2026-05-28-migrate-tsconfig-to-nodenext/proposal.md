## Why

The package ships as ESM (`"type": "module"`) but `tsconfig.json` still uses `module: "esnext"` with the legacy `moduleResolution: "node"` strategy. That combination does not enforce Node.js's actual ESM resolution rules (mandatory `.js` extensions on relative imports, no implicit `index` resolution, real `package.json` `exports` lookups), so the compiler currently allows code that Node would reject at runtime — e.g. `src/digraph.ts` and `src/paths.ts` import from `'./interface'` without the `.js` suffix, and the tests import from `'../src/index'`. Aligning the TypeScript configuration with Node's runtime resolver (`module: "nodenext"`, `moduleResolution: "nodenext"`) closes that drift before it produces a broken publish.

## What Changes

- Update `tsconfig.json` to set `module: "nodenext"` and `moduleResolution: "nodenext"` (drops `target` reliance for module emit; keeps current `target: es2022`).
- Fix relative import specifiers in `src/` and `tests/` to include explicit `.js` extensions as required by NodeNext (e.g. `'./interface'` → `'./interface.js'`, `'../src/index'` → `'../src/index.js'`).
- Verify `tsconfig-release.json` and `tsconfig-test.json` inherit the new resolution correctly; adjust only if needed.
- Re-run `npm run check`, `npm run check:test`, `npm run build`, `npm test`, and `publint` to confirm parity with current output.
- **BREAKING**: none for consumers — emitted JS, `dist/` layout, and `exports` map remain unchanged. Internal contributors must use `.js` suffixes on relative imports going forward.

## Capabilities

### New Capabilities

- `tsconfig-nodenext`: TypeScript build configuration aligned with Node.js ESM resolution (NodeNext module + moduleResolution), including the source-side import-specifier rules that NodeNext enforces.

### Modified Capabilities

<!-- No existing OpenSpec specs in this repo; nothing to modify. -->

## Impact

- Affected files: `tsconfig.json`, `src/digraph.ts`, `src/paths.ts`, `tests/digraph.spec.ts`, `tests/cycles.spec.ts`, `tests/paths.spec.ts`, `tests/traversal.spec.ts` (any other relative-import sites surfaced by the type-check).
- Affected scripts: `build`, `build:release`, `check`, `check:test`, `test` — all must pass after the migration.
- No change to public API, `package.json` `exports`, or published artifacts.
- No new runtime dependencies; TypeScript ≥ 5.8 (already in devDependencies) supports `nodenext`.
