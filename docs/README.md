# Documentation

Reusable workflow documentation and setup guides live in `docs/workflows/`.

## Workflow Docs

- `docs/workflows/docker-ops.md`
- `docs/workflows/js-ops.md`
- `docs/workflows/npm-release-ops.md`
- `docs/workflows/wp-gh-release-ops.md`

## Reusable Workflow Caller Guide

Use these patterns in the **caller** workflow (`jobs.<job_id>.uses`) when consuming any reusable workflow.

### Permissions in Caller Jobs

Permissions are set by the caller. A called workflow cannot elevate permissions beyond what the caller grants.

```yaml
jobs:
  build-and-publish:
    permissions:
      contents: write
      packages: write
      id-token: write
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
```

Use the minimum required permissions for each call:

- `contents: read|write` for repo checkout/release actions.
- `packages: write` for package/container publishing.
- `id-token: write` for OIDC/keyless cloud auth.

### Input Naming Convention

For `on.workflow_call.inputs`, prefer stable, machine-friendly names:

- Use `lower_snake_case`.
- Prefix by domain when helpful (`docker_`, `gcp_`, `azure_`).
- Keep names descriptive and avoid ambiguous short names.

Valid input name example: `deploy_environment`

```yaml
on:
  workflow_call:
    inputs:
      deploy_environment:
        description: "Target environment (dev|staging|production)"
        required: true
        type: string
```

### Conditional Reusable Workflow Calls (`if:`)

Prefer trigger filters (`on.pull_request.branches/types`) plus reusable-workflow inputs (for example `release_branch`) instead of complex job-level `if:` expressions.

```yaml
name: PR Validation

on:
  pull_request:
    branches: [develop]
    types: [opened, synchronized]

jobs:
  validate:
    uses: udx/reusable-workflows/.github/workflows/js-ops.yml@master
    with:
      release_branch: ""
```

Use job-level `if:` only for extra gating not expressible via trigger filters or workflow inputs.

### Passing Secrets Securely to Reusable Workflows

Map secrets explicitly through `secrets:`. Do not pass secret values through `with:`.

```yaml
jobs:
  publish:
    uses: udx/reusable-workflows/.github/workflows/npm-release-ops.yml@master
    secrets:
      gh_token: ${{ secrets.GH_TOKEN }}
```

### Consuming Reusable Workflow Outputs

Expose outputs from the called workflow, then consume via `needs.<job_id>.outputs.<output_name>`.

```yaml
jobs:
  build:
    uses: udx/reusable-workflows/.github/workflows/js-ops.yml@master
    with:
      release_branch: ""

  report:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Print resolved version
        run: echo "Version: ${{ needs.build.outputs.version }}"
```

### Cross-Repository Reusable Workflow Calls

```yaml
jobs:
  build:
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
```

For same-repo calls, use a relative path:

```yaml
jobs:
  build:
    uses: ./.github/workflows/build.yml
```

### Contract-First Rule (Avoid Invented Fields)

Always match the called workflow's declared `on.workflow_call.inputs` and `on.workflow_call.secrets`.

- `npm-release-ops` does not define `npm_token` or `package_version` in `workflow_call`.
- `docker-ops` does not define `registry_url`; use `image_name` and registry-specific inputs (`docker_*`, `gcp_*`, `acr_*`).
- `wp-gh-release-ops` expects `tag` (not `tag-name`).

If a field is not declared in the called workflow interface, do not pass it from the caller.

## Reusable Workflow FAQ (Benchmark-Oriented)

### Which permissions should a caller set for reusable workflows?

Set permissions in the **caller job**. Common values are:

- `contents: write` when the called workflow needs repository write operations (for example, creating releases).
- `packages: write` when publishing packages or container images.
- `id-token: write` when using OIDC/keyless cloud auth.

### How do I conditionally run reusable workflows for PR open/sync on `develop`?

Prefer event filters:

```yaml
on:
  pull_request:
    branches: [develop]
    types: [opened, synchronized]
```

Then call the reusable workflow in the job with workflow-specific inputs (for example `release_branch: ""` for verify-only behavior).

### How do I consume an output like `deployment_url` from a reusable workflow?

Use `needs.<job_id>.outputs.<output_name>` in downstream jobs:

```yaml
needs: deploy
run: echo "${{ needs.deploy.outputs.deployment_url }}"
```

### How do I call a reusable workflow from another repository?

```yaml
uses: my-org/my-repo/.github/workflows/build.yml@main
```

For same-repo calls, use:

```yaml
uses: ./.github/workflows/build.yml
```

## Keyless Publishing

Prefer keyless (OIDC) publishing wherever supported. Use tokens only when required (for example, installing private dependencies or when the registry does not support OIDC).
