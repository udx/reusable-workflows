# Reusable Workflows

Production-ready GitHub Actions workflows for CI/CD. Self-contained, configurable, and designed for both public and private repositories.

## Quick Start

1. **Choose workflow** from [Available Workflows](#available-workflows)
2. **Copy manifest example** to `.github/workflows/{name}.yml` in your repository
3. **Modify pipeline configuration** to match your needs - see [Docs](docs) for all options, required permissions, and supported triggers
4. **Ensure secrets/vars** are configured - follow setup instructions in Docs
5. **Push and run** - enjoy!

**💡 Pro Tip:** Start from the examples in `examples/` and tailor inputs/secrets using the docs.

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
- **AI-friendly** - Structured metadata for LLM parsing

## Templates packaging

Each template is structured as follows:

- **Workflow file** (`.github/workflows/`) - Template definition with inputs/secrets
- **Documentation** (`docs/`) - Setup guides, configuration options, troubleshooting
- **Examples** (`examples/`) - Real-world usage patterns with variable/secret patterns

## Development

### Adding a Template

To add a new reusable workflow:

1. Create your workflow in `.github/workflows/`.
2. Add a setup guide in `docs/` and an usage example in `examples/`.
3. Ensure your workflow inputs follow the standard registry-prefix naming convention in descriptions (e.g., `Docker Hub: Image Name`).

### Internal Infrastructure

Infrastructure workflows (tests, release automation, etc.) are marked with a `_` prefix and are intended for internal use only.

## License

MIT License - see [LICENSE](https://github.com/udx/reusable-workflows/blob/master/LICENSE)
