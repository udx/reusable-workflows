# NPM Release Workflow
<!-- short: Publish npm packages with provenance and GitHub releases -->

A reusable workflow to publish npm packages with security best practices, optional build/test steps, and GitHub release generation.

## Setup Guide

### 1. Prefer Keyless (OIDC) Publishing
Use npm Trusted Publishing so GitHub Actions can publish without long-lived tokens. This is the recommended default. See the npm docs for [Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) and [supported CI/CD providers](https://docs.npmjs.com/trusted-publishers#supported-cicd-providers).

Steps:
- Configure a **Trusted Publisher** for your package on npmjs.com (GitHub Actions).
- Ensure the workflow filename matches exactly.
- Use GitHub-hosted runners (OIDC is not supported on self-hosted runners).
- npm CLI `>= 11.5.1` is required for trusted publishing.

### 2. Token (Fallback Only)
Use a token only if you cannot use OIDC (for example, unsupported runners or registries), or if you need to install private dependencies during `npm ci`.

- **npmjs.com**: Create an automation token (or granular token with least privilege).
- **Organization Scopes**: Ensure the token has `read-write` access only when publishing is required.

### 3. Add Secret to GitHub (Only If Needed)
Add the generated token as a secret in your repository or organization:
- Name: `NPM_TOKEN`
- Value: *[your-token]*

### 4. GitHub Actions Usage
Call this workflow from your release pipeline (see [example](../../examples/npm-release-ops.yml)).

## Flow Explanation (Release vs Non-Release)

### Release Branch
- Runs tests (`npm test` if a `test` script exists).
- Runs build (`npm run build` if a `build` script exists).
- Runs publish step with provenance (if enabled).
- Creates a GitHub release if `enable_gh_release` is true.

### Non-Release Branch
- Runs tests (`npm test` if a `test` script exists).
- Runs build (`npm run build` if a `build` script exists).
- Does not publish to npm.

## Workflow Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `node_version` | Node.js: Version to use | `20` |
| `provenance` | NPM: Enable provenance | `true` |
| `release_branch`| Branch: Deployment branch that triggers releases | `latest` |
| `enable_gh_release` | GitHub: Whether to create a GitHub release | `true` |
| `working_directory` | Common: Directory containing package.json | `.` |

## Workflow Secrets

| Secret | Description | Required |
|--------|-------------|----------|
| `npm_token` | NPM: Token for publishing or private dependency installs | Optional (prefer OIDC) |
| `slack_webhook_url` | Slack: Webhook URL for notifications | Optional |

## Security and Provenance
This workflow enables **NPM Provenance** by default. This links your published package to the specific GitHub Action run that created it, providing a verifiable chain of custody for your users.

### Keyless Publishing Notes
- Trusted publishing uses OIDC and avoids long-lived tokens.
- OIDC is supported for GitHub Actions (hosted runners) and GitLab.com shared runners.
- OIDC only applies to `npm publish`; other npm commands still require auth for private packages.
  - If you install private dependencies, you may still need a read-only token for `npm ci`.
