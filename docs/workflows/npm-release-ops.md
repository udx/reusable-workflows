# NPM Release Workflow

A reusable workflow to publish npm packages with security best practices, optional build/test steps (via `--if-present`), and GitHub release generation. Build/test run on every trigger; release steps run only on the configured release branch.

## Setup Guide

### 1. Keyless (OIDC) access

Use npm Trusted Publishing so GitHub Actions can publish without long-lived tokens. This workflow supports keyless Trusted Publishing for `npm publish` and does not support static npm publish tokens. See the npm docs for [Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) and [supported CI/CD providers](https://docs.npmjs.com/trusted-publishers#supported-cicd-providers).

Steps:

- Configure a **Trusted Publisher** for your package on npmjs.com (GitHub Actions).
- Ensure the workflow filename matches exactly.
- Use GitHub-hosted runners (OIDC is not supported on self-hosted runners).
- npm CLI `>= 11.5.1` is required for trusted publishing.

### 2. GitHub Actions Usage

Call this workflow from your release pipeline (see [example](../../examples/npm-release-ops.yml)).

## Flow Explanation (Release vs Non-Release)

### Release Branch

- Runs tests (`npm test --if-present`).
- Runs build (`npm run build --if-present`).
- Runs publish step with provenance (if enabled).
- Creates a GitHub release if `enable_gh_release` is true.

### Non-Release Branch

- Runs tests (`npm test --if-present`).
- Runs build (`npm run build --if-present`).
- Does not publish to npm.

## Workflow Inputs

| Input               | Description                                      | Default  |
| ------------------- | ------------------------------------------------ | -------- |
| `node_version`      | Node.js: Version to use                          | `24`     |
| `provenance`        | NPM: Enable provenance                           | `true`   |
| `release_branch`    | Branch: Deployment branch that triggers releases | `latest` |
| `enable_gh_release` | GitHub: Whether to create a GitHub release       | `true`   |
| `dist_dir`          | Common: Directory containing package.json        | `dist`   |

## Workflow Secrets

| Secret              | Description                                                     | Required |
| ------------------- | --------------------------------------------------------------- | -------- |
| `slack_webhook_url` | Slack: Webhook URL for notifications                            | Optional |
| `gh_token`          | GitHub: Token override for tagging/release (defaults to `github.token`) | Optional |

`npm-release-ops` does not accept an npm publish token secret (`NPM_TOKEN`/`NODE_AUTH_TOKEN`) via `workflow_call`.

## Contract-First Caller Example

`npm-release-ops` does not declare `npm_token` or `package_version` in `on.workflow_call`.

- Use `dist_dir` to point at the directory containing `package.json`.
- The release version is read from `package.json`.
- Use Trusted Publishing (`id-token: write`) for `npm publish`.
- Static npm publish tokens are a legacy approach and are not supported or maintained in this workflow.

```yaml
jobs:
  publish:
    permissions:
      contents: write
      id-token: write
    uses: udx/reusable-workflows/.github/workflows/npm-release-ops.yml@master
    with:
      node_version: "24"
      release_branch: "latest"
      dist_dir: "dist"
      provenance: true
      enable_gh_release: true
    secrets:
      gh_token: ${{ secrets.GH_TOKEN }}
```

### When to provide `gh_token`

Use a custom token if your org enforces protected tag/branch rules that the default `github.token` cannot bypass (for example, tagging requires a service account or specific allowlist).

## Security and Provenance

This workflow enables **NPM Provenance** by default. This links your published package to the specific GitHub Action run that created it, providing a verifiable chain of custody for your users.

### Keyless Publishing Notes

- Trusted publishing uses OIDC and avoids long-lived tokens.
- This workflow requires GitHub-hosted runners for Trusted Publishing.
- OIDC only applies to `npm publish`; other npm commands still require auth for private packages.
