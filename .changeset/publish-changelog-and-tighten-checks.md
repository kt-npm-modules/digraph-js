---
'@ktarmyshov/digraph-js': patch
---

Publish `CHANGELOG.md` in the package tarball and tighten type-check scripts.

- `files` now includes `CHANGELOG.md` (npm does not auto-include it the way it does `README.md` / `LICENSE`). Removed redundant negative globs (`!tests`, `!examples`, `!benchmarks`) that were no-ops since none of those paths were ever in the whitelist.
- `check` now runs `tsc --project tsconfig.json --noEmit` instead of bare `tsc --skipLibCheck --noEmit`, mirroring `npm-typescript-template`.
- `check:test` no longer passes redundant `--skipLibCheck` (the base config already sets it).

No public API changes.
