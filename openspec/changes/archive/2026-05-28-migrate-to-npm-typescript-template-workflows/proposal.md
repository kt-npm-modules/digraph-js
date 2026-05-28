## Why

The `digraph-js` repository's GitHub Actions workflows and Dependabot config have drifted away from the canonical `npm-typescript-template`, which has since gained dynamic node-version configuration, contribution-branch flow, CodeQL scanning, separated minor/patch vs. major Dependabot groups, and improved release/auto-merge gates. Aligning the structure and approach with the template (with documented adaptations where individual jobs don't fit this package) eliminates per-repo drift, picks up these improvements, and makes future template updates a small targeted edit rather than a custom backport.

## What Changes

- Replace `.github/workflows/ci.yml` with the template's structure: adds `contribution` branch trigger, `check-execution` skip logic for contribution↔main duplicates, `config` job exposing `matrix-node-version`/`sonar`/`cache-reset` outputs, coverage artifact upload per node version, sonar conditional on `SONAR_TOKEN` presence, and stable `required-main` / `required-contribution` aggregate gates for branch protection. The template's `ci-subpackage` job is omitted because this repo has no `subpackage/`.
- **BREAKING (CI surface)**: required status checks for branch protection must move from individual jobs (`check`, `test`, `sonar`) to `required-main (...)` / `required-contribution (...)`.
- Replace `.github/workflows/auto-merge.yml` to pass `approve-app-id` / `approve-private-key` for the second-bot approval flow.
- Replace `.github/workflows/auto-release.yml`: add `workflow_dispatch`, repository guard against forks, and the approve-app inputs; reuse template cron offset.
- Replace `.github/workflows/release.yml`: drop the `update-pkg-lock` job (template no longer ships it), add `branches: [main]` filter to the `workflow_run` trigger, simplify the guard condition (no `github.ref` check needed once the branches filter is in place), and update the repository guard to `kt-npm-modules/digraph-js`.
- Add `.github/workflows/codeql.yml` (CodeQL for `actions` + `javascript-typescript`, weekly cron).
- Add `.github/workflows/contribution-reset.yml` and `.github/workflows/contribution-update.yml` to support the `main` ↔ `contribution` two-branch contribution flow used by the template.
- Replace `.github/dependabot.yml`: split single `all` group into `minor-and-patch` and `major` (the latter grouped per-dependency); keep the existing schedule cadence but align time format with the template.
- Drop reliance on the `CACHE_ADDITIONAL_PATH` repo variable: the template no longer threads it through `kt-workflows/actions/*` (cache key composition is handled inside the action). Surface this in tasks so the variable can be removed from repo settings.

## Capabilities

### New Capabilities

- `github-workflows`: GitHub Actions CI, release, dependency-update, code-scanning, and contribution-flow automation for the package, mirroring the `npm-typescript-template` reference layout.
- `dependabot-config`: Dependabot version-update configuration with separated minor/patch and major update groups.

### Modified Capabilities

<!-- None — no spec files exist for these capabilities yet, so the change introduces them rather than modifying. -->

## Impact

- Affected files: `.github/workflows/{ci,auto-merge,auto-release,release}.yml`, new `.github/workflows/{codeql,contribution-reset,contribution-update}.yml`, `.github/dependabot.yml`.
- Repository settings: branch protection rules on `main` must be re-pointed to the new `required-main (push)` / `required-main (pull_request)` checks; a `contribution` branch must exist (created by the new workflows on first run, but should be added to branch protection); `CACHE_ADDITIONAL_PATH` repo variable becomes unused and can be deleted; secrets `APPROVE_APP_ID` / `APPROVE_APP_PRIVATE_KEY` must be configured at the org or repo level for the auto-merge / auto-release approve flow.
- External actions: continues to depend on `kt-workflows/actions/*@main`; no version pin changes.
- Runtime/package code: none — workflow-only change.
- Contributor flow: external PRs land on `contribution`; maintainers open a follow-up PR from `contribution` → `main` for full secret-bearing CI.
