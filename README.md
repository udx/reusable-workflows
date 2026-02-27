# Reusable Workflows

Production-ready GitHub Actions workflows for CI/CD. Self-contained, configurable, and designed for both public and private repositories.

## Quick Start

1. **Choose workflow** from [Available Workflows](#available-workflows)
2. **Copy manifest example** to `.github/workflows/{name}.yml` in your repository
3. **Modify pipeline configuration** to match your needs - see [Docs](docs) for all options, required permissions, and supported triggers
4. **Ensure secrets/vars** are configured - follow setup instructions in Docs
5. **Push and run** - enjoy!

**💡 Pro Tip:** Start from the examples in `examples/` and tailor inputs/secrets using the docs.

## Version References

When calling workflows from this repo, you can pin by:

- Branch: `@master`
- Tag: `@v1.0.1` (or moving major tag like `@v1`)
- Commit SHA: `@<full_sha>`

Example:

```yaml
jobs:
  build:
    uses: udx/reusable-workflows/.github/workflows/js-ops.yml@v1.0.1
```

## Reusable Caller Essentials

When calling any reusable workflow, use the canonical caller patterns in [`docs/caller-reference/caller-patterns.md`](docs/caller-reference/caller-patterns.md) and the docs index in [`docs/README.md`](docs/README.md):

- Set permissions in the caller job (`contents`, `packages`, `id-token`) using least privilege.
- Use clear `workflow_call` input names (prefer `lower_snake_case`, for example `deploy_environment`).
- Prefer trigger filters and workflow inputs (for example `release_branch`) over complex job-level `if:` gates.
- Pass secrets via `jobs.<id>.secrets` mapping (for example `gh_token: ${{ secrets.GH_TOKEN }}`).
- Consume outputs with `needs.<job_id>.outputs.<output_name>`.

### Quick Caller Notes

- `npm-release-ops` uses keyless npm publishing (OIDC); caller inputs are declared in docs and do not include `npm_token` or `package_version`.
- `docker-ops` uses provider-specific declared inputs; `registry_url` is not part of this workflow interface.
- `wp-gh-release-ops` expects `tag`; if your caller uses `tag_name`, map it to `tag`.

## Available Workflows

| Workflow                                                         | Description                                                                                                          | Docs                                           | Example                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| **[docker-ops](.github/workflows/docker-ops.yml)**               | Build, scan, and publish Docker images to multiple registries (Docker Hub, GCP, ACR) with security scanning and SBOM | [📖 Docs](docs/workflows/docker-ops.md)        | [📋 Example](examples/docker-ops.yml)        |
| **[js-ops](.github/workflows/js-ops.yml)**                       | Build and validate immutable Next.js standalone bundles, with optional GitHub Release publishing and metadata        | [📖 Docs](docs/workflows/js-ops.md)            | [📋 Example](examples/js-ops.yml)            |
| **[npm-release-ops](.github/workflows/npm-release-ops.yml)**     | Build and publish npm packages with provenance, versioning, and release automation                                   | [📖 Docs](docs/workflows/npm-release-ops.md)   | [📋 Example](examples/npm-release-ops.yml)   |
| **[wp-gh-release-ops](.github/workflows/wp-gh-release-ops.yml)** | Generate and publish WordPress plugin releases on GitHub                                                             | [📖 Docs](docs/workflows/wp-gh-release-ops.md) | [📋 Example](examples/wp-gh-release-ops.yml) |

## Features

- **Reusable** - Designed for `workflow_call` consumption
- **Self-contained** - No internal or proprietary dependencies
- **Configurable** - Explicit inputs and secrets
- **Documented** - Complete setup guides and examples
- **Automation-friendly** - Structured documentation for consistent tooling and team usage

## Templates packaging

Each template is structured as follows:

- **Workflow file** (`.github/workflows/`) - Template definition with inputs/secrets
- **Documentation** (`docs/`) - Setup guides, configuration options, troubleshooting
- **Examples** (`examples/`) - Real-world usage patterns with variable/secret patterns

## Development

### Adding a Template

To add a new reusable workflow:

1. Create your workflow in `.github/workflows/`.
2. Add a setup guide in `docs/` and a usage example in `examples/`.
3. Ensure your workflow inputs follow the standard registry-prefix naming convention in descriptions (e.g., `Docker Hub: Image Name`).

### Maintainer Release Process

Repository automation workflows (tests, release automation, etc.) are marked with a `_` prefix.

- [`.github/workflows/_release.yml`](.github/workflows/_release.yml)
- [`ci/git-version.yml`](ci/git-version.yml)
- Details: [`docs/release-automation.md`](docs/release-automation.md)

## License

MIT License - see [LICENSE](https://github.com/udx/reusable-workflows/blob/master/LICENSE)
