# dependabot-config Specification

## Purpose

Defines Dependabot configuration requirements for the repository, including update grouping, version constraints, scheduling, and commit message conventions.

## Requirements

### Requirement: Dependabot config separates minor/patch and major updates

The repository SHALL provide `.github/dependabot.yml` that defines a single `npm` ecosystem update rule with two groups: `minor-and-patch` (covering all packages, restricted to `update-types: [minor, patch]`) and `major` (covering all packages, restricted to `update-types: [major]`, with `group-by: dependency-name` so each major bump is its own PR).

#### Scenario: Multiple minor and patch updates available

- **WHEN** Dependabot detects minor or patch updates across several dependencies in the same week
- **THEN** they are batched into a single `minor-and-patch` pull request

#### Scenario: Multiple major updates available

- **WHEN** Dependabot detects major updates for two different dependencies
- **THEN** each major update opens its own pull request, named per dependency, rather than being grouped together

### Requirement: Dependabot ignores out-of-range npm versions

The Dependabot configuration SHALL ignore updates to the `npm` package that are below `10.0.0` or at or above `11.0.0`.

#### Scenario: Out-of-range npm major proposed

- **WHEN** an `npm` release outside `>=10.0.0 <11.0.0` becomes available
- **THEN** Dependabot does not open a PR for it

### Requirement: Dependabot uses a weekly schedule with a jittered minute offset

The configuration SHALL keep a `weekly` schedule at hour `03` in `Europe/Berlin`. The minute SHALL remain jittered (any value other than `00` and other than the template's minute) so that this repository's Dependabot runs do not collide with other repositories in the org that share the template.

#### Scenario: Weekly run timing

- **WHEN** the weekly Dependabot schedule fires
- **THEN** it runs at hour 03 Europe/Berlin time, at a minute distinct from `00` and from the minute used by `kt-npm-modules/npm-typescript-template`

### Requirement: Dependabot commit messages use the dependabot prefix

The configuration SHALL set `commit-message.prefix` and `commit-message.prefix-development` to `dependabot`.

#### Scenario: Dependabot opens a PR

- **WHEN** Dependabot creates a pull request for a grouped update
- **THEN** the commit subject begins with `dependabot:`
