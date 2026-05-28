## Context

`digraph-js` was forked from an earlier revision of `kt-npm-modules/npm-typescript-template`. The template has since gained a richer CI/CD setup that the package has missed: a `contribution` branch flow for safe handling of external PRs, dynamic node-version matrix configuration, conditional Sonar runs, CodeQL scanning, separated minor/patch vs. major Dependabot groups, and an approval-bot flow for auto-merge / auto-release. Maintaining bespoke workflows in `digraph-js` produces drift and forces ad-hoc backports whenever the template improves. The package has no production-side code that interacts with these workflows — all changes are confined to `.github/`, repo settings, and branch-protection configuration.

The existing workflows already use `kt-workflows/actions/*@main` and `WORKFLOW_APP_*` secrets, so the action surface and trust model do not change; what changes is which jobs exist, how they are wired, and which inputs they accept.

## Goals / Non-Goals

**Goals:**
- Adopt the template's overall structure and approach for `.github/workflows/*` and `.github/dependabot.yml`: same job graph, same trigger/guard patterns, same input shapes — but with documented adaptations where individual template jobs don't fit this package.
- Drop or adapt template jobs whose preconditions don't hold here (e.g. `ci-subpackage` has no `subpackage/` to test) rather than carrying them as no-ops.
- Preserve the comments present in the template where they still apply — including the commented-out `echo:` debug jobs at the top of each workflow — so future syncs read as targeted edits, not rewrites.
- Adopt the `main` ↔ `contribution` two-branch flow for external contributions.
- Move branch protection onto stable aggregate checks (`required-main`, `required-contribution`) so adding/removing matrix entries no longer requires updating protection rules.
- Make the migration of repo-side configuration (branch protection, secrets, variables) explicit and reviewable in `tasks.md` rather than implied.

**Non-Goals:**
- No changes to runtime code, package layout, build, or test scripts.
- No version pinning of `kt-workflows/actions/*` (the template tracks `@main`; `digraph-js` follows).
- Not introducing the template's `subpackage/` test path — `digraph-js` has no `subpackage/`, so the `ci-subpackage` job from the template will be omitted (single localized deviation, documented in Decisions).
- Not migrating `.githooks/` content; that is unrelated to this change.

## Decisions

### Decision 1: Take the template's `ci.yml` structure, minus the `ci-subpackage` job

The template's `ci.yml` includes a `ci-subpackage` job that runs `subpackage/test.sh` when files under `subpackage/` or `.githooks/` change. `digraph-js` has no `subpackage/` directory, so that job has no work to do.

- **Choice**: Drop the `ci-subpackage` job; remove it from the `needs:` list of `required-main` and `required-contribution`.
- **Alternative considered**: Keep the job as a no-op via `has-changes-since-last-success` returning false. Rejected — it adds an empty CI minute on every run for no benefit and confuses readers about whether `digraph-js` has a subpackage.
- **General principle established by this decision**: where a template job's preconditions don't hold in this package (no matching directory, no relevant tooling), the job is dropped, not carried as a no-op. This is the rule for any future template-only addition that lands here via sync.

### Decision 2: Adopt aggregate `required-*` jobs as the only branch-protection check names

Branch protection currently references the matrix children directly (`check`, `test`, `sonar`). The template's `required-main` / `required-contribution` jobs `needs:` all real jobs and run a trivial echo. Branch protection points at these aggregates.

- **Choice**: Use `required-main (push)` / `required-main (pull_request)` for `main`, and `required-contribution (...)` for `contribution`.
- **Alternative considered**: Continue listing individual jobs in branch protection. Rejected — every node-version matrix change forces a protection-rule edit, and conditional jobs (sonar) cannot be required without making them mandatory.
- **Rationale**: The aggregate name does not depend on matrix entries, so adding/removing node versions is a pure CI change. The `${{ github.event_name }}` suffix in the job `name:` keeps `push` and `pull_request` runs as separate, distinguishable required checks.

### Decision 3: Use the template's two-token approval flow for auto-merge and auto-release

The template's `auto-merge.yml` and `auto-release.yml` accept both `app-id`/`private-key` (the workflow app, used to act on PRs) and `approve-app-id`/`approve-private-key` (a second app whose only job is to leave the approval that satisfies branch protection's "required reviewers" rule).

- **Choice**: Pass both pairs of inputs in the migrated workflows.
- **Prerequisite**: The `APPROVE_APP_ID` / `APPROVE_APP_PRIVATE_KEY` secrets must exist at the org or repo level before the workflows run; otherwise the action will fail at the approve step.
- **Rationale**: GitHub forbids an app from approving its own PRs, so the same app cannot both open a Dependabot/release PR and approve it. The two-app pattern is the documented solution.

### Decision 4: Keep `release.yml` lean — drop `update-pkg-lock`, add a `branches:` filter

The current `release.yml` carries an `update-pkg-lock` follow-up job. The template's `release.yml` has dropped it (the `npm-release` action now handles lockfile updates internally). The template's `workflow_run` trigger also adds `branches: [main]`, which lets the guard condition simplify because the runner already filters by branch.

- **Choice**: Match the template — single `release` job, `workflow_run` filtered to `main`, guard reduced to `repository`/`event`/`conclusion`.
- **Alternative considered**: Keep `update-pkg-lock` as a safety net. Rejected — it is now redundant work and would diverge from the template.

### Decision 5: Preserve template comments where they still apply

Every template workflow has a commented-out `echo:` job at the top that dumps `tojson(github)` for debugging. These have no runtime effect but are useful when troubleshooting CI; keeping them keeps future syncs minimal.

- **Choice**: Copy the commented `echo:` blocks and other inline comments (e.g., `# prevents this action from running on forks`, `# Just for testing purposes - run every 5 minutes`) where they still describe the surrounding code. Drop comments that refer to omitted jobs.
- **Rationale**: Future syncs should read as small targeted edits. Carrying comments that no longer match the file (e.g. a comment about `ci-subpackage` when the job is gone) is worse than dropping them.

### Decision 6: Keep the dependabot schedule on hour `03`, jitter the minute

Both configs schedule weekly with `Europe/Berlin` timezone and hour `03`. The minute differs (`03:14` here vs. `03:47` in the template) — and that's deliberate: the per-repo minute jitter avoids stampeding the org's Dependabot rate limits.

- **Choice**: Keep hour `03` for parity with the template's intent. Pick any minute other than `00` and other than the template's `47` — the existing `14` is fine, or pick a fresh value, but `00` and `47` are off-limits.
- **What the spec encodes**: a constraint (hour=03, minute jittered ≠ 00 ≠ template's), not a specific minute. The implementer can choose.
- **Restructure `groups`**: replace the single `all` group with the template's `minor-and-patch` + `major` (per-dependency) split.

### Decision 7: Stop threading `CACHE_ADDITIONAL_PATH` through workflow inputs

The template's `kt-workflows/actions/npm-ci-*` calls no longer take `cache-additional-path`. The action now derives its cache key internally.

- **Choice**: Remove `cache-additional-path:` inputs from all `kt-workflows/actions/*` callsites; flag the now-unused `CACHE_ADDITIONAL_PATH` repo variable for deletion in `tasks.md` (manual step).
- **Rationale**: Leaving the input would either silently no-op or fail action validation depending on the action's input schema; either way it is dead config.

## Risks / Trade-offs

- **[Risk] Branch protection still points at old job names after merge → CI passes locally but `main` becomes unmergeable.** Mitigation: `tasks.md` includes an explicit step to update branch protection rules to `required-main (push)` and `required-main (pull_request)` *before* merging the workflow PR; verify by opening a no-op PR after the change.
- **[Risk] `APPROVE_APP_*` secrets missing → auto-merge / auto-release fail at the approve step.** Mitigation: pre-merge checklist item to confirm secrets are configured; if absent, the secrets must be added before the first Dependabot run after merge.
- **[Risk] First push to `main` after merge triggers `contribution-update.yml`, which force-creates/updates a `contribution` branch.** Mitigation: this is by design and matches the template; document in tasks that the new `contribution` branch should also be added to branch protection (with `required-contribution` checks) once it exists.
- **[Risk] CodeQL on the `actions` language flags one of our existing custom workflows.** Mitigation: the template runs the same CodeQL config in production already, so this is bounded; treat any findings as an actionable follow-up, not a blocker for the migration.
- **[Trade-off] Tracking `kt-workflows/actions/*@main` continues to mean breakage can land without a version bump.** Accepted — the template makes the same trade and any divergence here would create an even worse maintenance burden.
- **[Trade-off] The `ci-subpackage` job is the most visible deliberate divergence from the template; smaller deviations (cron offsets, dependabot time, the repo slug) also exist.** Accepted — these are documented per-job rather than glossed over, and re-introducing the subpackage job later only requires copying it back and adding it to the two `required-*` `needs:` lists.

## Migration Plan

1. **Pre-merge**: confirm `APPROVE_APP_ID` / `APPROVE_APP_PRIVATE_KEY` secrets are present in the repo (or inherited from org). If not, add them before the workflow PR is merged.
2. Land the workflow + dependabot changes on a feature branch; CI on that branch will exercise the new `ci.yml` (the new `required-*` jobs do not yet block, so failures are visible but non-fatal).
3. Once the PR is green, update branch protection on `main`:
   - Remove required checks: `check`, `test`, `sonar`.
   - Add required checks: `required-main (push)`, `required-main (pull_request)`.
4. Merge the PR. The post-merge `contribution-update.yml` run will create/update the `contribution` branch.
5. Add `contribution` to branch protection with `required-contribution (push)` / `required-contribution (pull_request)` as required checks.
6. Delete the now-unused repo variable `CACHE_ADDITIONAL_PATH`.
7. **Rollback**: revert the workflow PR; re-point branch protection back to the previous job names. No external state (npm registry, releases) is mutated by the migration itself, so rollback is a config-only operation.
