# tsconfig-nodenext Specification

## Purpose

Defines the TypeScript configuration requirements for using `module: "nodenext"` and `moduleResolution: "nodenext"` across the repository, the source-code conventions that this resolution mode requires (explicit `.js` extensions on relative imports), and the invariants that must hold for the public package output and existing quality gates after the migration.

## Requirements

### Requirement: TypeScript module configuration uses NodeNext

The root `tsconfig.json` SHALL set `compilerOptions.module` to `"nodenext"` and `compilerOptions.moduleResolution` to `"nodenext"`. Derived configurations (`tsconfig-release.json`, `tsconfig-test.json`) SHALL inherit these values via `extends` and MUST NOT override them.

#### Scenario: Root tsconfig declares NodeNext module and moduleResolution

- **WHEN** a contributor inspects `tsconfig.json`
- **THEN** `compilerOptions.module` equals `"nodenext"` and `compilerOptions.moduleResolution` equals `"nodenext"`

#### Scenario: Derived configs inherit without overrides

- **WHEN** `tsconfig-release.json` or `tsconfig-test.json` is loaded
- **THEN** the effective `module` and `moduleResolution` resolve to `"nodenext"` and neither file redefines them

### Requirement: Relative imports include explicit `.js` extensions

All relative import and re-export specifiers in `src/` and `tests/` SHALL include the `.js` file extension, as required by Node.js ESM resolution under `moduleResolution: "nodenext"`. Bare specifiers (npm package names) and subpath imports MUST continue to use the package's published `exports` paths without extension changes.

#### Scenario: Source files import siblings with .js suffix

- **WHEN** `tsc --project tsconfig.json` runs against `src/`
- **THEN** the compiler reports zero `TS2835` (relative import without extension) errors and emission succeeds

#### Scenario: Test files import the package source with .js suffix

- **WHEN** `tsc --project tsconfig-test.json --noEmit` runs against `tests/`
- **THEN** every relative specifier (e.g. `'../src/index.js'`) resolves and the compiler reports zero relative-import errors

### Requirement: Public package output is unchanged

The migration MUST NOT alter the package's public API surface. The `exports` map, `types` entry, `type: "module"` field, emitted JavaScript filenames, and emitted `.d.ts` filenames in `dist/` SHALL remain identical to the pre-migration build. `publint` MUST continue to pass.

#### Scenario: publint passes after migration

- **WHEN** `npm run prepack` runs after a clean `npm run build`
- **THEN** `publint` exits with status 0 and reports no errors or warnings introduced by this change

#### Scenario: Build emits the same entry files

- **WHEN** `dist/` is produced by `npm run build`
- **THEN** `dist/index.js` and `dist/index.d.ts` exist and the file list under `dist/` matches the pre-migration set

### Requirement: All existing quality gates remain green

After the configuration change, every script the repository already uses to gate quality SHALL pass: `npm run check`, `npm run check:test`, `npm run lint`, `npm run build`, `npm run build:release`, and `npm test` (which chains type-checking, vitest, and the benchmark).

#### Scenario: Type-checking the source passes

- **WHEN** `npm run check` runs
- **THEN** the command exits 0 with no diagnostics

#### Scenario: Type-checking the tests passes

- **WHEN** `npm run check:test` runs
- **THEN** the command exits 0 with no diagnostics

#### Scenario: Test suite and benchmark pass

- **WHEN** `npm test` runs
- **THEN** all vitest specs pass and the benchmark in `tests/benchmarks/webpack` runs to completion without errors
