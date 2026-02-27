# Documentation

Reusable workflow documentation and setup guides live in `docs/workflows/`.

## Workflow Docs

- `docs/workflows/docker-ops.md`
- `docs/workflows/js-ops.md`
- `docs/workflows/npm-release-ops.md`
- `docs/workflows/wp-gh-release-ops.md`

## Contracts and Caller Patterns

- `docs/contracts/caller-patterns.md` (canonical caller guide, contract-first rules, and common Q&A snippets)
- Includes quick-scan core rules for humans plus prompt-shaped Q&A for LLM/agent retrieval.

## Contract-First Policy

Always match the called workflow's declared `on.workflow_call.inputs` and `on.workflow_call.secrets`.

If a field is not declared in the called workflow interface, do not pass it from the caller.

## Keyless Publishing Policy

This repository's `npm-release-ops` workflow supports keyless npm publishing (OIDC Trusted Publishing) and does not support static npm publish tokens.
