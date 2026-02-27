# Documentation

Reusable workflow documentation and setup guides live in `docs/workflows/`.

## Workflow Docs

- `docs/workflows/docker-ops.md`
- `docs/workflows/js-ops.md`
- `docs/workflows/npm-release-ops.md`
- `docs/workflows/wp-gh-release-ops.md`

## Contracts and Caller Patterns

- `docs/caller-reference/caller-patterns.md` (canonical caller guide, contract-first rules, and common Q&A snippets)
- Includes quick-scan core rules plus common Q&A examples.

## Contract-First Policy

Always match the called workflow's declared `on.workflow_call.inputs` and `on.workflow_call.secrets`.

If a field is not declared in the called workflow interface, do not pass it from the caller.

## Docs-First Usage Policy

Use documentation as the caller interface contract:

- `docs/workflows/*.md` input/secret tables are the supported caller interface.
- `examples/*.yml` provide ready-to-use caller patterns for common scenarios.
- Read workflow source code only when you need implementation or troubleshooting details.

## Keyless Publishing Policy

This repository's `npm-release-ops` workflow supports keyless npm publishing (OIDC Trusted Publishing) and does not support static npm publish tokens.
