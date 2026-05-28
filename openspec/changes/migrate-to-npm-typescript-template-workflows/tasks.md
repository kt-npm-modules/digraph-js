## 1. Pre-flight checks

- [ ] 1.1 Confirm `WORKFLOW_APP_ID` and `WORKFLOW_APP_PRIVATE_KEY` are configured for the repo (already in use by current workflows — sanity check only)
- [ ] 1.2 Confirm `APPROVE_APP_ID` and `APPROVE_APP_PRIVATE_KEY` are configured at the org or repo level; if not, add them before proceeding
- [ ] 1.3 Confirm `SONAR_TOKEN` configuration is unchanged (workflow handles its absence gracefully but document the current value)
- [ ] 1.4 Note current branch protection rules on `main` (required checks: `check`, `test`, `sonar`) so the post-merge update is unambiguous

## 2. Migrate dependabot.yml

- [ ] 2.1 Replace `.github/dependabot.yml` with the template's structure (groups: `minor-and-patch`, `major` with `group-by: dependency-name`)
- [ ] 2.2 Keep `time:` on hour `03` and `timezone: 'Europe/Berlin'`. Pick a minute that is NOT `00` and NOT the template's `47` — keeping the existing `14` is fine; any other jittered value also works
- [ ] 2.3 Keep the existing `ignore` rule for `npm` (`<10.0.0`, `>=11.0.0`)
- [ ] 2.4 Keep `commit-message.prefix` and `prefix-development` set to `dependabot`

## 3. Migrate ci.yml

- [ ] 3.1 Copy `../npm-typescript-template/.github/workflows/ci.yml` to `.github/workflows/ci.yml`
- [ ] 3.2 Remove the `ci-subpackage` job entirely (no `subpackage/` exists in this repo)
- [ ] 3.3 Remove `ci-subpackage` from the `needs:` list of `required-main` and `required-contribution`
- [ ] 3.4 Verify `branches:` on the push trigger lists both `main` and `contribution`
- [ ] 3.5 Keep the commented-out `echo:` debug job at the top of `jobs:`; drop any comments that referred to `ci-subpackage`
- [ ] 3.6 Verify no `cache-additional-path:` input is passed to any `kt-workflows/actions/*` step (the template has already removed it)
- [ ] 3.7 Verify the `test` job's `run-script` runs `npm run build && npm run coverage` and renames the output to `coverage-test-node${{ matrix.node-version }}`
- [ ] 3.8 Confirm `digraph-js` `package.json` exposes a `coverage` script that produces `coverage-test/` output (template assumption); if it differs, adjust the `run-script` accordingly and record the deviation in design notes

## 4. Migrate auto-merge.yml

- [ ] 4.1 Copy `../npm-typescript-template/.github/workflows/auto-merge.yml` to `.github/workflows/auto-merge.yml`
- [ ] 4.2 Verify both `app-id`/`private-key` and `approve-app-id`/`approve-private-key` inputs are passed
- [ ] 4.3 Verify the `if: github.event.pull_request.user.login == 'dependabot[bot]'` guard is in place
- [ ] 4.4 Keep the commented-out `echo:` debug job

## 5. Migrate auto-release.yml

- [ ] 5.1 Copy `../npm-typescript-template/.github/workflows/auto-release.yml` to `.github/workflows/auto-release.yml`
- [ ] 5.2 Replace the repository guard `kt-npm-modules/npm-typescript-template` with `kt-npm-modules/digraph-js`
- [ ] 5.3 Pick a cron offset distinct from the template's `09 5 1 * *` and from other repos in the org (e.g., keep the existing `23 5 1 * *` to avoid collision)
- [ ] 5.4 Verify both pairs of app-id/private-key inputs are passed
- [ ] 5.5 Verify `workflow_dispatch` is in the trigger list
- [ ] 5.6 Keep the commented-out `echo:` debug job and the `# Just for testing purposes - run every 5 minutes` comment

## 6. Migrate release.yml

- [ ] 6.1 Copy `../npm-typescript-template/.github/workflows/release.yml` to `.github/workflows/release.yml`
- [ ] 6.2 Replace the repository guard `kt-npm-modules/npm-typescript-template` with `kt-npm-modules/digraph-js`
- [ ] 6.3 Verify the `workflow_run` trigger has `branches: [main]`
- [ ] 6.4 Verify the guard condition is reduced to `repository`/`workflow_run.event == 'push'`/`workflow_run.conclusion == 'success'` (no `github.ref` check)
- [ ] 6.5 Confirm the `update-pkg-lock` job is NOT present (removed in the template)
- [ ] 6.6 Verify no `cache-additional-path:` input is passed
- [ ] 6.7 Keep the commented-out `echo:` debug job

## 7. Add codeql.yml

- [ ] 7.1 Copy `../npm-typescript-template/.github/workflows/codeql.yml` to `.github/workflows/codeql.yml` unchanged
- [ ] 7.2 Verify languages list contains `actions` and `javascript-typescript`
- [ ] 7.3 Verify the weekly cron is present

## 8. Add contribution-flow workflows

- [ ] 8.1 Copy `../npm-typescript-template/.github/workflows/contribution-update.yml` to `.github/workflows/contribution-update.yml`
- [ ] 8.2 Replace the repository guard with `kt-npm-modules/digraph-js`
- [ ] 8.3 Copy `../npm-typescript-template/.github/workflows/contribution-reset.yml` to `.github/workflows/contribution-reset.yml`
- [ ] 8.4 Replace the repository guard with `kt-npm-modules/digraph-js`

## 9. Local validation

- [ ] 9.1 Run `actionlint` (or `gh actions-runner` parser) on every file under `.github/workflows/` to catch syntax errors before pushing
- [ ] 9.2 Diff each migrated workflow against its template counterpart and confirm every difference is intentional and documented (repository slug, omitted `ci-subpackage` job in `ci.yml`, jittered cron/dependabot offsets, dropped comments referring to omitted code)
- [ ] 9.3 Run `npm run check` and `npm run test` locally to confirm the package itself still builds (sanity check; this change does not touch package code)

## 10. Push to feature branch and verify CI

- [ ] 10.1 Open a draft PR from the feature branch to `main`; confirm the new `check`, `test`, `sonar` (if `SONAR_TOKEN` is set) jobs run and the `required-main (pull_request)` aggregate succeeds
- [ ] 10.2 Confirm the upload of `coverage-test-node*` artifacts succeeds on at least one matrix entry
- [ ] 10.3 If `SONAR_TOKEN` is set, confirm the sonar job downloads the coverage artifacts and reports successfully

## 11. Update branch protection (pre-merge)

- [ ] 11.1 In repo settings → branches → `main`, add `required-main (push)` and `required-main (pull_request)` to required status checks
- [ ] 11.2 Remove the now-stale required checks: `check`, `test`, `sonar` (do this in the same edit so the protection rule is never simultaneously empty)
- [ ] 11.3 Verify the draft PR still reports the new aggregate as the gating check

## 12. Merge

- [ ] 12.1 Mark the PR ready for review and merge after approval
- [ ] 12.2 Watch the post-merge `contribution-update` workflow run; confirm the `contribution` branch is created or updated successfully

## 13. Post-merge configuration

- [ ] 13.1 Add branch protection for `contribution` with `required-contribution (push)` and `required-contribution (pull_request)` as required checks
- [ ] 13.2 Delete the now-unused repo variable `CACHE_ADDITIONAL_PATH`
- [ ] 13.3 Open a no-op PR (e.g., a comment-only change) to confirm `required-main (pull_request)` is reported as the gating check; close without merging
- [ ] 13.4 Wait for the next monthly `auto-release` cron (or trigger via `workflow_dispatch`) and confirm the approve-app flow completes without errors
- [ ] 13.5 Confirm CodeQL has produced a scan result on the default branch within 24 hours of the merge

## 14. Documentation

- [ ] 14.1 If `README.md` or contributor docs reference the old branch-protection job names or the single-branch flow, update them to describe the `main` ↔ `contribution` flow
- [ ] 14.2 Archive this OpenSpec change with `/opsx:archive` once all post-merge steps are confirmed
