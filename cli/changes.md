# Changelog

### 1.1.5
- **Feat**: Asset-Driven UX Testing suite (verifies CLI against repository templates/examples).
- **Fix**: Normalized preset matching (matches `multi-registry` to `Multi Registry`).
- **Fix**: Trigger sanitization (removes `workflow_call` from generated manifests).
- **Fix**: Non-interactive mode now correctly selects groups with required inputs.
- **Refactor**: Unified test structure under `cli/test/cases/_fixtures`.

### 1.1.4
- **Feat**: Introduced specific Docker presets: `Docker Hub`, `GCR`, `ACR`, and `Multi Registry`.
- **Refactor**: Standardized all example configurations to use GitHub `vars` and `secrets`.
- **Chore**: Updated metadata descriptions for `build_platforms` and `version_config_path`.

### 1.1.3
- **Feat**: Implemented marker-free Auto-Preset detection via `TemplateLoader`.
- **Feat**: Smart prompt skipping (CLI skips questions if values are detected or provided by preset).
- **Refactor**: `FileGenerator` now constructs manifests from scratch for cleaner YAML output.
- **Chore**: Removed legacy "AI Prompt" comments from all assets.

### 1.1.2
- **Fix**: Bundled templates with NPM package for reliable global installation.
- **Fix**: Improved repo root detection for global CLI usage.

### 1.1.0
- **Feat**: Added OIDC (Keyless) publishing support.
- **Feat**: Added GitHub Environment support (configured for `Master` environment).
- **Feat**: Added `--ref` and `-r` flags for pinning workflow versions.
- **Feat**: Added `--output` and `-o` flags for custom manifest destination.
- **Refactor**: Flattened repository structure with `_` prefix for internal workflows.
- **Chore**: Standardized metadata across all templates.

### 1.0.0
- Initial release of the Reusable Workflows CLI.
- Interactive workflow generation.
- Existing configuration auto-detection.
- Preview manifest before writing.
