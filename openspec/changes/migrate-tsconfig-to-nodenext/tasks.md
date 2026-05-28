## 1. Update TypeScript configuration

- [ ] 1.1 In `tsconfig.json`, change `compilerOptions.module` from `"esnext"` to `"nodenext"`
- [ ] 1.2 In `tsconfig.json`, change `compilerOptions.moduleResolution` from `"node"` to `"nodenext"`
- [ ] 1.3 Confirm `tsconfig-release.json` and `tsconfig-test.json` still extend `./tsconfig.json` and do not redeclare `module` or `moduleResolution` (no edit unless an override is found)

## 2. Fix relative imports in source

- [ ] 2.1 In `src/digraph.ts`, change `from './interface'` to `from './interface.js'`
- [ ] 2.2 In `src/paths.ts`, change `from './interface'` to `from './interface.js'`
- [ ] 2.3 Run `npm run check`; for any additional `TS2835` (or related) error, append `.js` to the offending relative specifier and re-run until clean

## 3. Fix relative imports in tests

- [ ] 3.1 In `tests/digraph.spec.ts`, change `from '../src/index'` to `from '../src/index.js'`
- [ ] 3.2 In `tests/cycles.spec.ts`, change `from '../src/index'` to `from '../src/index.js'`
- [ ] 3.3 In `tests/paths.spec.ts`, change `from '../src/index'` to `from '../src/index.js'`
- [ ] 3.4 In `tests/traversal.spec.ts`, change `from '../src/index'` to `from '../src/index.js'`
- [ ] 3.5 Run `npm run check:test`; for any remaining relative-import error, append `.js` and re-run until clean
- [ ] 3.6 Skip `tests/*.old` files — they are excluded from the build and out of scope

## 4. Verify build output and tooling

- [ ] 4.1 Run `npm run build` and confirm it completes successfully
- [ ] 4.2 Confirm `dist/index.js` and `dist/index.d.ts` exist and the `dist/` file list matches the pre-migration set
- [ ] 4.3 Run `npm run build:release` and confirm it completes successfully
- [ ] 4.4 Run `npm run prepack` (publint) and confirm zero new errors/warnings

## 5. Verify tests, lint, and benchmark

- [ ] 5.1 Run `npm test` — type-check + vitest + benchmark must all pass
- [ ] 5.2 Run `npm run lint` — prettier + eslint must pass; fix formatting if needed (`npm run format`)
- [ ] 5.3 Run `npm run coverage` to confirm coverage collection still works under NodeNext

## 6. Finalize

- [ ] 6.1 Add a changeset entry (`npx changeset`) describing the tsconfig migration as a patch (no consumer-visible change)
- [ ] 6.2 Review the diff to confirm no unintended changes to `package.json`, `exports`, or emitted file names
- [ ] 6.3 Commit on the `contribution` branch and open a PR against `main`
