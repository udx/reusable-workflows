# Reusable Workflows

Production-ready GitHub Actions workflows for CI/CD. Self-contained, configurable, and designed for both public and private repositories.

## Quick Start

1. **Choose workflow** from [Available Workflows](#available-workflows)
2. **Copy manifest example** to `.github/workflows/{name}.yml` in your repository
3. **Modify pipeline configuration** to match your needs - see [Docs](docs) for all options, required permissions, and supported triggers
4. **Ensure secrets/vars** are configured - follow setup instructions in Docs
5. **Push and run** - enjoy!

**💡 Pro Tip:** Use the CLI for interactive configuration:

```bash
npm install -g @udx/reusable-workflows
reusable-workflows
```

Generates `.github/workflows/{template}.yml` + `SETUP-{template}.md` with step-by-step instructions.

## Available Workflows

| Workflow                                                         | Description                                                                                                          | Docs                                 | Example                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| **[docker-ops](.github/workflows/docker-ops.yml)**               | Build, scan, and publish Docker images to multiple registries (Docker Hub, GCP, ACR) with security scanning and SBOM | [📖 Docs](docs/docker-ops.md)        | [📋 Example](examples/docker-ops.yml)        |
| **[wp-gh-release-ops](.github/workflows/wp-gh-release-ops.yml)** | Generate and publish WordPress plugin releases on GitHub                                                             | [📖 Docs](docs/wp-gh-release-ops.md) | [📋 Example](examples/wp-gh-release-ops.yml) |

## Features

- **Reusable** - Designed for `workflow_call` consumption
- **Self-contained** - No internal or proprietary dependencies
- **Configurable** - Explicit inputs and secrets
- **Documented** - Complete setup guides and examples
- **AI-friendly** - Structured metadata for LLM parsing
- **CLI-enabled** - Interactive workflow generation

## Templates packaging

Each template is structured as follows:

- **Workflow file** (`.github/workflows/`) - Template definition with inputs/secrets
- **Documentation** (`docs/`) - Setup guides, configuration options, troubleshooting
- **Examples** (`examples/`) - Real-world usage patterns with variable/secret patterns

## License

MIT License - see [LICENSE](https://github.com/udx/reusable-workflows/blob/master/LICENSE)
