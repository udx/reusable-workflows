# Reusable Workflow Caller Patterns

Canonical caller-side patterns for `workflow_call` reusable workflows.

Use this document when authoring or reviewing caller workflows (`jobs.<job_id>.uses`).

## How to Use This Doc

- Start with `Core Rules` and `Workflow Contract Matrix`.
- Use `Common Caller Q&A` for ready-to-copy examples.
- Enforce `Contract-First Rule (No Invented Fields)` against declared `workflow_call` inputs/secrets.

## Core Rules

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

Use least privilege for each call:

- `contents: read|write` for repository checkout/release operations
- `packages: write` for package/container publishing
- `id-token: write` for OIDC/keyless authentication

### Input Naming Convention

For `on.workflow_call.inputs`, prefer stable, machine-friendly names:

- use `lower_snake_case`
- use domain prefixes when helpful (`docker_`, `gcp_`, `azure_`)
- keep names descriptive and avoid ambiguous short names

```yaml
on:
  workflow_call:
    inputs:
      deploy_environment:
        description: "Target environment (dev|staging|production)"
        required: true
        type: string
```

### Conditional Calls

Prefer trigger filters (`on.pull_request.branches/types`) and reusable-workflow inputs over complex job-level `if:`.

```yaml
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

### Passing Secrets Securely

Map secrets through `jobs.<job_id>.secrets`. Do not pass secret values via `with:`.

```yaml
jobs:
  publish:
    uses: udx/reusable-workflows/.github/workflows/npm-release-ops.yml@master
    secrets:
      gh_token: ${{ secrets.GH_TOKEN }}
```

### Consuming Reusable Workflow Outputs

Consume outputs via `needs.<job_id>.outputs.<output_name>`.

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
      - run: echo "Version: ${{ needs.build.outputs.version }}"
```

### Cross-Repository and Same-Repository Calls

```yaml
jobs:
  build:
    uses: my-org/my-repo/.github/workflows/build.yml@main
```

For same-repo calls:

```yaml
jobs:
  build:
    uses: ./.github/workflows/build.yml
```

### Contract-First Rule (No Invented Fields)

Always match the called workflow's declared `on.workflow_call.inputs` and `on.workflow_call.secrets`.

- `npm-release-ops` does not define `npm_token` or `package_version`; npm publishing is keyless (OIDC Trusted Publishing) only
- `docker-ops` does not define `registry_url`; use `image_name` and provider-specific inputs (`docker_*`, `gcp_*`, `acr_*`)
- `wp-gh-release-ops` expects `tag` (not `tag_name`/`tag-name`)
- `js-ops` supports build env via `build_env` (inline `KEY=VALUE`) or `build_env_file` (repository-root `.env` path), set only one

If a field is not declared in the called workflow interface, do not pass it.

## Workflow Contract Matrix

| Workflow | Do use | Do not use | Notes |
| --- | --- | --- | --- |
| `js-ops` | `build_env` or `build_env_file` | both together | set exactly one build env mode when overriding defaults |
| `npm-release-ops` | `dist_dir`, `release_branch`, `provenance`, `enable_gh_release` | `npm_token`, `package_version` | version comes from repository `package.json`; npm publish is keyless only |
| `docker-ops` | `image_name` + provider-specific inputs | `registry_url` | use `docker_*`, `gcp_*`, or `acr_*` inputs |
| `wp-gh-release-ops` | `tag` | `tag_name`, `tag-name` | map caller variable names to declared input `tag` |

## Common Caller Q&A

Ready-to-copy snippets for common reusable-workflow questions.

### 1. How do I ensure reusable workflow permissions are sufficient?

Set explicit caller permissions:

```yaml
jobs:
  release:
    permissions:
      contents: write
      packages: write
      id-token: write
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
```

### 2. How should I name new workflow_call inputs?

Use `lower_snake_case`, for example:

```yaml
deploy_environment
```

### 3. How do I run only for PR opened/synchronized on develop?

```yaml
on:
  pull_request:
    branches: [develop]
    types: [opened, synchronized]
```

### 4. How do I consume an output like `deployment_url`?

```yaml
jobs:
  deploy:
    uses: my-org/my-repo/.github/workflows/deploy.yml@main

  notify:
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - run: echo "${{ needs.deploy.outputs.deployment_url }}"
```

### 5. How do I call `wp-gh-release-ops` when my caller uses `tag_name`?

Map your caller value to declared input `tag`:

```yaml
jobs:
  release:
    permissions:
      contents: write
    uses: udx/reusable-workflows/.github/workflows/wp-gh-release-ops.yml@master
    with:
      tag: ${{ inputs.tag_name }}
      version: ${{ inputs.version }}
      prerelease: ${{ inputs.prerelease }}
```

### 6. How do I call `npm-release-ops` if I expected `npm_token` and `package_version`?

Those fields are not part of the contract. Use declared inputs and keyless publishing:

```yaml
jobs:
  publish:
    permissions:
      contents: write
      id-token: write
    uses: udx/reusable-workflows/.github/workflows/npm-release-ops.yml@master
    with:
      release_branch: latest
      dist_dir: dist
      provenance: true
      enable_gh_release: true
    secrets:
      gh_token: ${{ secrets.GH_TOKEN }}
```

Release version is derived from repository `package.json` (no caller override input). Static npm publish tokens are legacy and not supported in `npm-release-ops`.

### 7. How do I call `docker-ops` with `image_name` and `registry_url`?

`registry_url` is not a declared input. Use provider-specific inputs:

```yaml
jobs:
  release:
    permissions:
      contents: write
      packages: write
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
      docker_login: my-user
      docker_org: my-org
      docker_repo: my-app
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}
```

### 8. How do I securely pass `NPM_TOKEN` to a reusable workflow?

Generic pattern (only if called workflow declares that secret):

```yaml
jobs:
  publish:
    uses: my-org/my-repo/.github/workflows/publish.yml@main
    secrets:
      npm_token: ${{ secrets.NPM_TOKEN }}
```

Repository-specific note: `npm-release-ops` supports only keyless npm publishing and does not accept npm publish token secrets via `workflow_call`.

### 9. How do I pass `environment: production` as a workflow_call input?

Reusable workflow:

```yaml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
```

Caller workflow:

```yaml
jobs:
  call-reusable:
    uses: my-org/my-repo/.github/workflows/deploy.yml@main
    with:
      environment: production
```

### 10. How do I call `my-org/my-repo/.github/workflows/build.yml@main`?

```yaml
jobs:
  build:
    uses: my-org/my-repo/.github/workflows/build.yml@main
```
