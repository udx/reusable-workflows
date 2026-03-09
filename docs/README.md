# Documentation

Reusable workflow docs and maintainer references for this repository.

## Workflow Docs

Detailed documentation for each reusable workflow, including input/secret tables and usage notes.

- `docs/workflows/context7-ops.md`
- `docs/workflows/docker-ops.md`
- `docs/workflows/js-ops.md`
- `docs/workflows/npm-release-ops.md`
- `docs/workflows/wp-gh-release-ops.md`

## For Workflow Users

- **Caller Guide**: [`docs/CALLER_GUIDE.md`](CALLER_GUIDE.md) (Canonical guide for calling workflows)
- **Examples**: [`examples/*.yml`](../examples/) (Ready-to-use caller patterns)

### Quick Tips
- Reference workflows by branch (`@master`), tag (`@v1.0.1`), or commit SHA.
- Always match the called workflow's declared `inputs` and `secrets`.
- Pass secrets via `jobs.<job_id>.secrets` (e.g., `npm_token: ${{ secrets.NPM_TOKEN }}`).

## For Maintainers

- **Engineering Standards**: [`docs/STANDARDS.md`](STANDARDS.md) (Design principles and release automation policy)
- **Release Workflow**: [`.github/workflows/_release.yml`](../.github/workflows/_release.yml)
- **Version Strategy**: [`ci/git-version.yml`](../ci/git-version.yml)

## Project Policies

- **Contract-First**: If a field is not declared in the `workflow_call` interface, do not pass it from the caller.
- **Keyless First**: We prioritize OIDC (Workload Identity) for GCP, Azure, and npm. Static keys are generally not supported.
- **Docs-First**: Use the markdown documentation as the source of truth for the workflow contract.

---
_UDX DevSecOps Team_
