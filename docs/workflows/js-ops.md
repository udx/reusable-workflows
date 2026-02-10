# JS App Release Ops Workflow

<!-- short: Build, verify, and release immutable Next.js standalone bundles to GitHub Releases -->

Reusable workflow for Next.js applications.

It performs one production build per commit, packages an immutable standalone bundle, runs quality/security scripts when present in `package.json`, publishes assets to GitHub Release, and emits `release.json` metadata for promotion workflows.

## Quick Start

```yaml
name: Release JS App Bundle

on:
  push:
    branches:
      - latest

jobs:
  standard-release:
    permissions:
      contents: write
    uses: udx/reusable-workflows/.github/workflows/js-ops.yml@master
```

## Workflow Jobs

### `config`

- Validates `working_directory` and `package.json`
- Ensures package metadata exists (`name`, `version`) and `scripts.build` is present
- Resolves package-manager commands once (install/build/lint/typecheck/test/scan), with package manager auto-detection when input is omitted
- Detects available optional scripts (`lint`, `typecheck`, `test`, `scan`)
- Uses `package.json` version as release version/tag
- Emits configuration summary in the job summary

### `build-and-scan`

- Installs dependencies using config-resolved command
- Runs `lint`, `typecheck`, `test`, and `scan` only when each script exists in `package.json`
- Builds production app (`NODE_ENV=production`)
- Packages `.next/standalone`, `.next/static`, and `public` into `tar.gz`
- Produces SHA-256 checksum
- Generates `release.json`
- Uploads bundle + metadata artifacts

### `github-release`

- Downloads release assets artifact
- Creates/updates GitHub Release with:
  - bundle archive
  - checksum file
  - `release.json`

## Inputs

| Input               | Description                                   | Default | Required |
| ------------------- | --------------------------------------------- | ------- | -------- |
| `app_name`          | App name used in artifact naming and metadata. If empty, derived from `package.json` name | `""` | |
| `working_directory` | Directory containing `package.json`           | `.`     | |
| `node_version`      | Node.js version                               | `24`    | |
| `package_manager`   | Package manager (`npm` or `yarn`). If empty, auto-detected from `packageManager` field and lockfiles | `""` | |

## Secrets

| Secret     | Description                                                                       | Required |
| ---------- | --------------------------------------------------------------------------------- | -------- |
| `gh_token` | Optional GitHub token override for release publishing (`github.token` is default) | Optional |

## Outputs

| Output                      | Description                             |
| --------------------------- | --------------------------------------- |
| `version`                   | Resolved release version                |
| `artifact_type`             | Always `bundle`                         |
| `bundle_artifact_name`      | Uploaded bundle artifact name           |
| `bundle_sha256`             | SHA-256 of the bundle tarball           |
| `release_metadata_artifact` | Artifact name containing `release.json` |

## Caller Examples

### Minimal Required Inputs

```yaml
name: Release JS App Bundle

on:
  push:
    branches:
      - latest

jobs:
  standard-release:
    permissions:
      contents: write
    uses: udx/reusable-workflows/.github/workflows/js-ops.yml@master
```

### Full Inputs (including optional secret override)

```yaml
name: Release JS App Bundle

on:
  workflow_dispatch:

jobs:
  configured-release:
    permissions:
      contents: write
    uses: udx/reusable-workflows/.github/workflows/js-ops.yml@master
    with:
      app_name: web-app
      working_directory: apps/web
      node_version: "24"
      package_manager: yarn
    secrets:
      gh_token: ${{ secrets.GH_TOKEN }}
```

## Required Next.js Build Output

This workflow expects:

- `.next/standalone`
- `.next/static` (optional but recommended)
- `public` (optional)

For Next.js, configure standalone output in `next.config.*`:

```js
module.exports = {
  output: "standalone",
};
```

## `release.json` Format

Generated metadata includes:

- `app`
- `package_name`
- `package_version`
- `repo`
- `commit_sha`
- `version`
- `artifact_type`
- `bundle_url`
- `checksum`
- `build_timestamp`
