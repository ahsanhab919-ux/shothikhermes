# CI/CD Security Hardening Guide

## Purpose

This document defines the CI/CD security baseline for `shothik-web` and explains the local and GitHub-side controls required to keep the frontend repository production-safe before additional backend services are extracted.

## Security Objectives

- keep the default pipeline principle-of-least-privilege
- detect vulnerable dependencies before merge
- detect leaked secrets before merge
- scan repository content, configuration, and container images for misconfiguration and CVEs
- maintain deployment artifact integrity with provenance attestations
- keep branch merges blocked until required checks succeed

## Workflow Inventory

### Core Validation

- [ci.yml](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/.github/workflows/ci.yml)

Checks:

- dependency install
- type-check
- test coverage
- production build
- optional Playwright smoke run

### Security Workflow

- [security.yml](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/.github/workflows/security.yml)

Checks:

- dependency review for pull requests
- CodeQL SAST
- Gitleaks secret scanning
- `pnpm audit` dependency vulnerability scan
- license compliance enforcement
- Trivy file system misconfiguration and vulnerability scan
- Trivy container image scan
- provenance attestation for exported image artifact
- optional SonarCloud analysis when `SONAR_TOKEN` is configured

### DAST Workflow

- [dast.yml](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/.github/workflows/dast.yml)

Checks:

- OWASP ZAP baseline scan against a staging or preview URL

## Pipeline Security Controls

### Minimal Permissions

Workflows use:

- `contents: read` by default
- elevated permissions only per-job when required:
  - `security-events: write` for SARIF uploads
  - `attestations: write` and `id-token: write` for artifact provenance
  - `pull-requests: read` for dependency review

### Secret Handling

- build-time env placeholders are used only for static validation
- production secrets must come from GitHub Actions encrypted secrets or a managed cloud secret store
- never commit `.env`, `.env.local`, or provider keys

### Artifact Integrity

Current protection:

- exported container image tarball is attested with GitHub artifact provenance

Next step:

- move to signed OCI images in a registry once image publishing is enabled

## Required GitHub Secrets

### Required for core CI

None beyond `GITHUB_TOKEN` for the initial baseline, because build uses placeholders.

### Optional but Recommended

| Secret | Purpose |
| --- | --- |
| `SONAR_TOKEN` | SonarCloud quality analysis |
| `SNYK_TOKEN` | future Snyk integration if adopted |
| `DAST_TARGET_URL` | optional default staging target for DAST |

## Local Security Commands

Use these before high-risk merges:

```bash
pnpm ci:local
pnpm security:audit
pnpm security:licenses
```

### Current Dependency Audit Enforcement

Current blocking threshold:

- `critical`

Reason:

- `axios` has been remediated to a patched version
- `xlsx` still has unresolved high-severity upstream advisories without an adopted safe replacement in this repo today

Policy:

- critical vulnerabilities block immediately
- unresolved high-severity findings must stay documented and tracked until the dependency is upgraded, replaced, or isolated

## Container Security

The repo Docker image is scanned in CI using Trivy after build.

Current image controls:

- multi-stage build
- explicit build args for required validation envs
- Trivy image vulnerability scan
- provenance attestation

Future improvements:

- pin base images by digest
- produce SBOM artifacts
- publish signed images to registry

## Infrastructure And Configuration Security

This repo currently contains limited standalone IaC, but the file-system Trivy scan already checks:

- Dockerfile misconfigurations
- GitHub Actions workflow misconfigurations
- YAML and config file security issues

If Terraform or CloudFormation files are added later:

- keep them in dedicated directories
- add explicit IaC-only policy scanning as a required job

## Operational Guidance

### When a security job fails

- do not bypass protection on `main`
- identify whether it is:
  - dependency risk
  - leaked secret
  - code-level vulnerability
  - container/image issue
  - license policy violation
- document the resolution in the PR

### Emergency exception policy

- emergency hotfixes may use a reduced review window only when documented in the hotfix PR
- security failures may only be bypassed by repo administrators if a rollback or service outage is at stake
- any bypass requires a follow-up remediation PR within one business day

## Review Cadence

Review this hardening baseline quarterly:

- rotate or validate secrets
- review scanner noise and suppressions
- update dependency and image scan severity thresholds
- review allowed/disallowed license policy
- add new required checks when the repo matures

## Current GitHub Repository State

Applied successfully on GitHub:

- squash-only merge strategy
- merge commits disabled
- rebase merges disabled
- automatic branch deletion after merge
- vulnerability alerts enabled
- automated security fixes enabled

Not currently enforceable on this repository plan:

- full branch protection for private repo branches
- signed-commit enforcement through protected branch settings
- private-repo secret scanning and push protection

To enable those remaining protections:

- upgrade the repository owner to GitHub Pro
- or make the repository public if that matches your risk model
