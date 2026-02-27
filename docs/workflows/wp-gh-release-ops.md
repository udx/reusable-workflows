# Publish WP Plugin Release on GitHub Workflow

Reusable workflow for generating and publishing WordPress plugin release on GitHub.

## Features

- Cleanup files prohibited by the WordPress Plugin Directory
- Parse changelog entries from `changes.md` for the target version
- SBOM generation

## Quick Start

```yaml
name: Publish Release

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag (e.g. 1.2.3a)'
        required: true
      version:
        description: 'Release version (e.g. 1.2.3), default: latest'
        required: false
      prerelease:
        description: 'Pre-release version (e.g. RC1, beta, etc...)'
        required: false

permissions:
  contents: write

jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/wp-gh-release-ops.yml@master
    with:
      tag: ${{ github.event.inputs.tag }}
      version: ${{ github.event.inputs.version }}
      prerelease: ${{ github.event.inputs.prerelease }}
```

## Configuration

### Inputs

| Input                     | Description                        | Default                        | Required       |
| ------------------------- | ---------------------------------- | ------------------------------ | -------------- |
| `tag`                     | GitHub release tag                 | -                              | ✅             |
| `version`                 | Plugin version                     | latest version from readme.txt |                |
| `prerelease`              | Pre-release version                | -                              |               |

Input naming note: the reusable workflow input is `tag` (not `tag-name`).

### Caller Permissions and Token

Set `contents: write` in the caller workflow so release/tag operations can succeed.

This reusable workflow uses the default `github.token`; no additional `workflow_call` secret is required for standard release publishing.

## Versioning

1. If `version` is specified, this version is used to parse changes.md for **Release Notes**
2. Otherwise uses the version specified in `readme.txt`

## License

MIT License - See repository LICENSE file
