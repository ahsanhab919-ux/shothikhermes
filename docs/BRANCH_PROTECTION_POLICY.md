# Branch Protection Policy

## Purpose

This document defines the required GitHub branch protection baseline for `shothik-web`.

The objective is to keep `main` stable, reviewable, auditable, and secure before additional backend repositories are extracted.

## Protected Branches

Primary protected branches:

- `main`
- `develop`

`main` is the release branch.
`develop` is optional and may be used for integration batching if needed.

## Required Rules For `main`

### Pull Requests Required

- direct pushes are not allowed
- all changes must land through pull requests

### Review Requirements

- minimum approvals: `2`
- code owner review required: `true`
- stale approvals dismissed on new push: `true`
- last push approval required: `true`

### Required Status Checks

At minimum require successful completion of:

- `Validate Web App`
- `Dependency Review`
- `CodeQL`
- `Secret Scan`
- `Dependency Audit`
- `License Compliance`
- `Trivy File System Scan`
- `Build And Scan Container Image`

Optional checks such as DAST and manual smoke jobs should not block normal merges unless specifically enabled for a release branch.

### History And Merge Rules

- require linear history: `true`
- allow squash merge: `true`
- allow merge commits: `false`
- allow rebase merge: `false`
- automatic branch deletion after merge: `true`

### Signature Rules

- require signed commits on protected branch: `true`

## CODEOWNERS Expectations

Current ownership is defined in:

- [CODEOWNERS](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/.github/CODEOWNERS)

Current state:

- single-user ownership baseline with `@shothikwork`

Future state:

- replace with team-based ownership once frontend, platform, security, and payments teams are available

## Review Responsibilities

### Response Time Targets

- standard pull request first response: `24 hours`
- security-sensitive or payment-sensitive pull request first response: `24 hours`
- routine documentation / low-risk change full review: `48 hours`

### Review Scope

Reviewers must check:

- correctness
- test updates
- auth and security implications
- API route response and error behavior
- performance or bundle impact
- documentation impact

## Emergency Hotfix Procedure

Emergency hotfixes are allowed only when:

- production outage is ongoing
- user data or payment behavior is at risk
- there is no lower-risk rollback available

Required process:

1. create branch `hotfix/<summary>`
2. link incident or outage context
3. get at least one reviewer if humanly possible
4. merge with the smallest viable change set
5. open a follow-up remediation PR within one business day

If an admin bypass is used:

- document who approved it
- document why branch protection was bypassed
- document what follow-up controls were added

## GitHub Settings To Apply

### Repository Settings

- default branch: `main`
- delete head branches automatically: enabled
- allow squash merge: enabled
- allow merge commits: disabled
- allow rebase merge: disabled

### Branch Protection

Apply the `main` branch rules using GitHub UI or `gh api`.

Current implementation status:

- repository-level merge strategy settings have been applied on GitHub
- full branch protection could not be enforced because GitHub returned `403` for this private repository on the current plan

To activate the full policy exactly as written:

- upgrade the owner account to GitHub Pro
- or change repository visibility to public if that is acceptable

Recommended exact settings:

- pull request reviews required
- `2` approvals
- code owner review required
- stale reviews dismissed
- last push approval required
- required status checks enabled
- conversation resolution required
- force pushes disabled
- branch deletion disabled
- linear history required
- signed commits required

## Local Workflow For Developers

- create feature branches from `main`
- keep branch names scoped:
  - `feat/*`
  - `fix/*`
  - `refactor/*`
  - `chore/*`
  - `docs/*`
  - `test/*`
- run local validation before opening a PR:

```bash
pnpm ci:local
pnpm security:audit
pnpm security:licenses
```

## Quarterly Policy Review

Every quarter:

- verify required checks still reflect active workflows
- review if `2` approvals are operationally realistic
- update CODEOWNERS for real teams
- review emergency bypass records
- confirm signed commit policy is still enforced
