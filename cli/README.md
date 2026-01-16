# Reusable Workflows CLI

A minimal-friction CLI to integrate and update GitHub Actions workflows based on the [udx/reusable-workflows](https://github.com/udx/reusable-workflows) templates.

## Usage

Run the CLI in the root of your repository to select, configure, and update workflows.

### On-the-fly
Always runs the latest version without installation:
```bash
npx @udx/reusable-workflows [template-id] [options]
```

### Global Installation
For frequent use as a local command:
```bash
npm install -g @udx/reusable-workflows
reusable-workflows [template-id] [options]
```

## Features

- **Smart Auto-Detection**: Scans `.github/workflows` to pre-fill existing configurations.
- **Dynamic Presets**: Automatically extracts configuration presets (e.g., GCR, ACR) from example files.
- **Fast-Path Flow**: Skips redundant prompts and moves straight to a manifest preview.
- **One-Glance Preview**: Review the generated YAML in your terminal before writing.
- **Non-Interactive Mode**: Full support for headless environments and CI/CD scripts.
- **Asset-Driven Testing**: Built-in test suite verifies CLI output against source templates and examples.

## Options

- `[template-id]`: Optional positional argument to skip selection (e.g., `docker-ops`).
- `-n, --non-interactive`: Use detected/default values without prompting.
- `-p, --preset [name]`: Apply a specific configuration preset (e.g., `GCR`, `Docker Hub`).
- `-r, --ref [version]`: Pin the reusable workflow to a specific Git ref/version.
- `-o, --output [path]`: Specify custom destination for the manifest.
- `-h, --help`: Show usage instructions.

## Metadata Architecture

The CLI parses a three-layer structure to provide a dynamic UI:
1. **Workflow (.yml)**: Defines inputs with registry-prefixed metadata.
2. **Docs (.md)**: Provides the generator flow and setup instructions.
3. **Example (.yml)**: Acts as the base template for the generated manifest.

## Development

### Local Testing
To test the CLI during development:
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run UX test suite
../scripts/test-cli-ux.sh

# Run locally in a target repo
node index.js
```

## Releasing
Publishing is automated via GitHub Actions:
- **Trigger**: Merge to `master`.
- **Workflow**: Uses [`npm-release-ops`](file:///Users/jonyfq/git/udx/reusable-workflows/.github/workflows/npm-release-ops.yml) with `working_directory: cli`.
- **Manual**: To publish from local (if authorized):
  ```bash
  ../scripts/npm-publish.sh # Run from /cli folder
  ```
