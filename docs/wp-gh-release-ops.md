# Publish WP Plugin Release on GitHub Workflow

Reusable workflow for generating and publishing WordPress plugin release on GitHub.

## Features

- Cleanup files, prohibited by WordPress Plugin directory
- Parse changelog from changes.md depending on the version
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

## Versioning

1. If `version` is specified, this version is used to parse changes.md for **Release Notes**
2. Otherwise uses the version specified in `readme.txt`

## License

MIT License - See repository LICENSE file
