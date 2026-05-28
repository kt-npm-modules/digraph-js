## ADDED Requirements

### Requirement: CI workflow mirrors the npm-typescript-template

The repository SHALL provide `.github/workflows/ci.yml` that triggers on `push` to `main` and `contribution`, on `pull_request`, and that mirrors the structure and approach of the corresponding workflow in `kt-npm-modules/npm-typescript-template`. Where individual template jobs do not apply to this package (e.g., `ci-subpackage`, because this repo has no `subpackage/` directory), the workflow SHALL omit them rather than carry them as no-ops, and SHALL drop them from the `needs:` lists of `required-main` and `required-contribution`.

#### Scenario: Pull request from a feature branch

- **WHEN** a contributor opens a pull request against `main`
- **THEN** `check`, `test` (across the configured node-version matrix), and — if `SONAR_TOKEN` is set — `sonar` jobs run
- **AND** the aggregate `required-main (pull_request)` job reports success only after all of the above succeed

#### Scenario: Push to contribution branch with an open PR to main

- **WHEN** a push lands on `contribution` and an open `contribution` → `main` PR already exists
- **THEN** the `check-execution` job sets `should-run=false`
- **AND** all downstream jobs (`config`, `check`, `test`, `sonar`, `required-*`) are skipped to avoid duplicate runs

#### Scenario: Push to contribution branch whose tree matches main

- **WHEN** a push to `contribution` produces a tree identical to `origin/main`
- **THEN** the `check-execution` job sets `should-run=false` and skips downstream jobs

#### Scenario: Sonar token absent

- **WHEN** the workflow runs in a context where `secrets.SONAR_TOKEN` is empty
- **THEN** the `config` job emits `sonar=false`
- **AND** the `sonar` job is skipped
- **AND** `required-main` still passes once the non-sonar jobs succeed

### Requirement: CI exposes stable aggregate gate jobs

The CI workflow SHALL expose two aggregate jobs, `required-main` and `required-contribution`, whose `name:` field embeds `${{ github.event_name }}` and whose `needs:` list covers every other CI job that must pass for that branch context. These job names SHALL be the only CI checks that branch protection rules reference.

#### Scenario: Branch protection on main

- **WHEN** a maintainer configures branch protection for `main`
- **THEN** the required status checks are `required-main (push)` and `required-main (pull_request)` and no others

#### Scenario: Matrix node version added

- **WHEN** a maintainer adds a new entry to the node-version matrix
- **THEN** the existing branch-protection rules continue to apply without edits because the aggregate job name is unchanged

### Requirement: CI uses dynamic configuration via the config job

The CI workflow SHALL include a `config` job that exposes outputs `matrix-node-version`, `sonar`, and `cache-reset` derived from repository variables (`MATRIX_NODE_VERSION`, `CACHE_RESET`) with workflow-local defaults (`DEFAULT_MATRIX_NODE_VERSION`, `DEFAULT_CACHE_RESET`). Downstream jobs SHALL consume these outputs rather than reading repository variables directly.

#### Scenario: Repository variable overrides default

- **WHEN** the repository variable `MATRIX_NODE_VERSION` is set to `["20","22","24"]`
- **THEN** `config.matrix-node-version` resolves to that value and the `test` matrix expands to three node versions

#### Scenario: Repository variable absent

- **WHEN** `MATRIX_NODE_VERSION` is not set on the repository
- **THEN** `config.matrix-node-version` falls back to the workflow's `DEFAULT_MATRIX_NODE_VERSION` value

### Requirement: Test job uploads coverage artifacts per node version

The `test` job SHALL run the project's coverage script, rename the coverage output to `coverage-test-node<version>`, and upload it as a workflow artifact with `if-no-files-found: error`. The `sonar` job SHALL download all `coverage-*` artifacts to the workspace root before invoking `kt-workflows/actions/npm-ci-sonar`.

#### Scenario: Coverage artifact upload

- **WHEN** the `test` job completes successfully on node version `22`
- **THEN** an artifact named `coverage-test-node22` exists for the workflow run

#### Scenario: Sonar consumes downloaded coverage

- **WHEN** the `sonar` job runs after `test` succeeds
- **THEN** it downloads all `coverage-*` artifacts to the repository root before running the sonar action

### Requirement: Release workflow runs only after a successful CI on main

The repository SHALL provide `.github/workflows/release.yml` that triggers on `workflow_run` for the `CI` workflow filtered to the `main` branch (and on `workflow_dispatch`), guards execution by `github.repository == 'kt-npm-modules/digraph-js'`, the upstream `workflow_run.event == 'push'`, and `workflow_run.conclusion == 'success'`, and consists of a single `release` job calling `kt-workflows/actions/npm-release@main`.

#### Scenario: CI on main succeeds

- **WHEN** the CI workflow completes successfully for a `push` to `main`
- **THEN** the release workflow runs and invokes `npm-release`

#### Scenario: CI on contribution succeeds

- **WHEN** the CI workflow completes successfully for a `push` to `contribution`
- **THEN** the release workflow does not run because the `workflow_run` trigger is filtered to `main`

#### Scenario: Manual release dispatch

- **WHEN** a maintainer triggers `release.yml` via `workflow_dispatch`
- **THEN** the release job runs without requiring an upstream CI run

### Requirement: Auto-merge workflow uses the two-app approval flow

The repository SHALL provide `.github/workflows/auto-merge.yml` that runs on `pull_request`, restricts execution to PRs authored by `dependabot[bot]`, and calls `kt-workflows/actions/dependabot-auto-merge@main` with both `app-id`/`private-key` (from `WORKFLOW_APP_*`) and `approve-app-id`/`approve-private-key` (from `APPROVE_APP_*`) inputs.

#### Scenario: Dependabot pull request opened

- **WHEN** Dependabot opens a pull request
- **THEN** the auto-merge job runs and, after successful CI and approval, the PR is merged automatically

#### Scenario: Human-authored pull request opened

- **WHEN** a non-Dependabot author opens a pull request
- **THEN** the auto-merge job is skipped

### Requirement: Auto-release workflow runs monthly with fork guard

The repository SHALL provide `.github/workflows/auto-release.yml` that runs on a monthly schedule and on `workflow_dispatch`, guards execution by `github.repository == 'kt-npm-modules/digraph-js'`, and calls `kt-workflows/actions/dependabot-auto-release@main` with both pairs of app-id/private-key inputs.

#### Scenario: Scheduled monthly run

- **WHEN** the configured monthly cron fires on the canonical repository
- **THEN** the auto-release job runs

#### Scenario: Fork attempts to run

- **WHEN** the workflow attempts to run in a fork
- **THEN** the repository guard short-circuits the job and no auto-release action runs

### Requirement: Contribution branch flow is automated

The repository SHALL provide `.github/workflows/contribution-update.yml` and `.github/workflows/contribution-reset.yml` matching the template, so that pushes to `main` propagate to `contribution`, and a merged PR from `contribution` → `main` triggers a hard reset of `contribution` to `main`.

#### Scenario: Push to main propagates to contribution

- **WHEN** a commit is pushed to `main` that did not originate from a merged `contribution` → `main` PR
- **THEN** the `contribution-update` workflow merges `main` into `contribution` (or creates `contribution` from `main` if it does not yet exist) and pushes the result

#### Scenario: Contribution-to-main PR is merged

- **WHEN** a PR with head `contribution` and base `main` is merged
- **THEN** the `contribution-reset` workflow force-pushes `contribution` to match `main` exactly

#### Scenario: Push originating from contribution-to-main merge

- **WHEN** a push to `main` is identified as originating from a merged `contribution` → `main` PR
- **THEN** `contribution-update` skips the propagation to avoid an immediate redundant update

### Requirement: CodeQL scanning is enabled

The repository SHALL provide `.github/workflows/codeql.yml` that scans both `actions` and `javascript-typescript` languages on `push` to `main`, on `pull_request`, and on a weekly schedule.

#### Scenario: Pull request triggers CodeQL

- **WHEN** a pull request is opened
- **THEN** CodeQL runs the `actions` and `javascript-typescript` analyses

#### Scenario: Weekly scheduled scan

- **WHEN** the weekly cron fires
- **THEN** CodeQL analyses run on the default branch

### Requirement: Workflow files preserve template comments where they still apply

Every migrated workflow SHALL retain inline comments from the source template that still describe the surrounding code, including the commented-out `echo:` debug job at the top of each `jobs:` block (used for dumping `tojson(github)` during troubleshooting). Comments that refer to omitted jobs or removed inputs SHALL be dropped together with the code they describe, so the file remains internally consistent.

#### Scenario: Maintenance diff against template

- **WHEN** a maintainer diffs `.github/workflows/<file>.yml` against the corresponding file in `kt-npm-modules/npm-typescript-template`
- **THEN** the differences consist of intentional adaptations (repository slug, omitted jobs such as `ci-subpackage`, cron offsets) and the comments referring to those omitted jobs — and nothing else
