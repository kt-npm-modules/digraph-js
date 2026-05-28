## Context

`digraph-js` is published as pure ESM (`"type": "module"`, single `./` export with `.js` paths). The current `tsconfig.json` mixes `module: "esnext"` with `moduleResolution: "node"` — a setting the TypeScript team explicitly recommends against for ESM packages because it does not validate the import-specifier rules Node enforces at runtime (mandatory file extensions, no implicit `index`, real `package.json` `exports` lookups).

Two source files (`src/digraph.ts:1`, `src/paths.ts:1`) and four test files (`tests/*.spec.ts`) currently use extensionless relative specifiers. They compile today but only because the resolver is permissive; Node ESM at runtime resolves them only because the build emits to `dist/*.js` and the corresponding files happen to exist next to each other. The risk is silent: any future refactor (e.g. promoting a folder, adding a barrel) will compile and fail in production.

Constraints:

- TypeScript ≥ 5.8 is already pinned (devDependency) — `nodenext` is fully supported.
- Engines pin `node >= 20`, well within NodeNext's runtime expectations.
- Public API surface (`./dist/index.{js,d.ts}`) must not change; `publint` must stay green.

## Goals / Non-Goals

**Goals:**

- Make the TypeScript compiler enforce Node's actual ESM resolution rules.
- Eliminate the existing extensionless relative imports (`'./interface'`, `'../src/index'`).
- Keep emitted output, public types, and `exports` map byte-equivalent (modulo source-map paths) so downstream consumers see no change.
- Keep all existing scripts (`build`, `build:release`, `check`, `check:test`, `test`, `benchmark`) green.

**Non-Goals:**

- Switching to `module: "node20"` / `node22` (newer presets) — defer; `nodenext` tracks Node's resolver and is the conventional choice today.
- Changing `target` (`es2022`) or `lib`.
- Restructuring `dist/` layout, `exports`, or migrating to dual CJS/ESM.
- Tightening other compiler options (e.g. `verbatimModuleSyntax`, `isolatedModules`); out of scope here, can be separate proposals.

## Decisions

### Decision 1: Use `nodenext` for both `module` and `moduleResolution`

Set:

```jsonc
"module": "nodenext",
"moduleResolution": "nodenext"
```

**Rationale:** With `module: "nodenext"`, TypeScript emits ESM/CJS based on the nearest `package.json` `"type"` field — matching exactly what Node does. Pairing it with `moduleResolution: "nodenext"` enforces extension-required relative imports and respects `exports`. This is the canonical setup for Node ESM packages in the TS handbook.

**Alternatives considered:**

- `module: "node16"` / `moduleResolution: "node16"` — semantically identical to `nodenext` today but is a pinned snapshot. `nodenext` automatically picks up resolver improvements as Node evolves; we already pin `node >= 20`, so we always want the latest behavior.
- `module: "esnext"` + `moduleResolution: "bundler"` — appropriate for bundler-consumed libs, but this package is consumed directly by Node and relies on real `exports` resolution. Rejected.
- Keep `module: "esnext"`, only change `moduleResolution: "nodenext"` — TS forbids that combination; `nodenext` resolution requires `nodenext` (or `node16`) module.

### Decision 2: Add `.js` extensions to relative imports rather than re-emit via a transform

Hand-edit the offending specifiers to add `.js`. There are only ~6 sites (`src/digraph.ts`, `src/paths.ts`, four test files); a one-off edit is cheaper and clearer than introducing tooling.

**Rationale:** Stays within current toolchain; produces a small, reviewable diff; matches what NodeNext requires anyway.

**Alternatives considered:**

- Codemod / `ts-add-js-extension` — overkill for ~6 imports.
- `allowImportingTsExtensions` (use `.ts` in source) — requires `noEmit` or `rewriteRelativeImportExtensions`; conflicts with current build flow.

### Decision 3: Leave `tsconfig-release.json` and `tsconfig-test.json` untouched

Both `extends` `./tsconfig.json` with no module-related overrides, so the inheritance carries the new settings automatically. Verify by running `npm run build:release` and `npm run check:test`; only modify if a real problem surfaces.

### Decision 4: No changes to `package.json` `exports` or `type`

The package already declares `"type": "module"` and an ESM-shaped `exports` map. NodeNext picks these up correctly without further edits. `publint` will validate.

## Risks / Trade-offs

- **Risk:** Hidden extensionless imports beyond the ones already spotted will surface as type errors only after the switch. → **Mitigation:** Run `npm run check` and `npm run check:test` immediately after editing `tsconfig.json`; fix every reported `TS2835`/`TS2307` by adding `.js`. The compiler's error messages are precise and self-correcting.
- **Risk:** A transitive `@types/*` package emits CJS-only types and breaks under NodeNext's stricter dual-emit rules. → **Mitigation:** Inventory failures via `npm run check`. The current dependency set is small (`@types/node`, vitest types) and known-compatible; if anything breaks, pin or replace.
- **Risk:** Source-map / declaration-map paths shift slightly. → **Mitigation:** Compare `dist/` before/after; if changed, document it. Maps are not part of the API contract, so consumers are unaffected.
- **Trade-off:** Contributors must remember to add `.js` to new relative imports. The compiler enforces this — there is no silent failure mode.

## Migration Plan

1. Edit `tsconfig.json` (Decision 1).
2. Run `npm run check` — patch every reported relative-import error by adding `.js`.
3. Run `npm run check:test` — patch test imports the same way.
4. Run `npm run build` and diff `dist/` against the previous build (sanity).
5. Run `npm test` and `npm run benchmark` (the `test` script already chains these).
6. Run `npm run lint` to catch any prettier/eslint surprises from the edits.
7. Commit and add a changeset entry (the repo uses `@changesets/cli`) — patch-level; no consumer-visible change.

**Rollback:** revert the single commit. No published artifacts have changed; no migration is owed to consumers.

## Open Questions

None — the change is mechanical and fully covered by the existing `check` / `test` / `publint` gates.
