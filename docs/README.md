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
- `js-ops` supports build env via `build_env` (inline `KEY=VALUE`) or `build_env_file` (repository-root `.env` path); set only one.

If a field is not declared in the called workflow interface, do not pass it from the caller.

## Reusable Workflow FAQ (Benchmark-Oriented)

### 1. How to ensure a reusable workflow has required permissions (`contents: write`, `packages: write`)?

Set permissions in the **caller job**. A called workflow cannot elevate them.

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

### 2. What naming convention should new `workflow_call` inputs follow?

Use `lower_snake_case` with descriptive names (for example `deploy_environment`).

```yaml
on:
  workflow_call:
    inputs:
      deploy_environment:
        description: "Target environment (dev|staging|production)"
        required: true
        type: string
```

### 3. How to call reusable workflow only on PR `opened`/`synchronized` for `develop`?

Use pull request event filters.

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

### 4. How to consume reusable output like `deployment_url`?

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

### 5. How to call `wp-gh-release-ops` with a `tag_name` value?

`wp-gh-release-ops` input is `tag` (not `tag_name`). Map your caller variable/value to `tag`.

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

### 6. How to call `npm-release-ops` if you expected `npm_token` and `package_version`?

`npm-release-ops` does not declare `npm_token` or `package_version` in `workflow_call`. Use declared inputs (`dist_dir`, `release_branch`, etc.). Package version is read from `package.json` in `dist_dir`.

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

### 7. How to call `docker-ops` with `image_name` and `registry_url`?

`docker-ops` does not declare `registry_url`. Use `image_name` plus provider-specific inputs.

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

### 8. How to securely pass secret `NPM_TOKEN` to reusable workflow?

Pass secrets only through `jobs.<job_id>.secrets` mapping, never through `with:`.

```yaml
jobs:
  publish:
    uses: my-org/my-repo/.github/workflows/publish.yml@main
    secrets:
      npm_token: ${{ secrets.NPM_TOKEN }}
```

For this repository specifically, `npm-release-ops` accepts only `gh_token` and `slack_webhook_url` as `workflow_call` secrets.

### 9. How to pass string input `environment: production` with `workflow_call`?

```yaml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to ${{ inputs.environment }}"
```

Caller:

```yaml
jobs:
  call-reusable:
    uses: my-org/my-repo/.github/workflows/deploy.yml@main
    with:
      environment: production
```

### 10. How to consume `my-org/my-repo/.github/workflows/build.yml@main` from another workflow?

```yaml
jobs:
  build:
    uses: my-org/my-repo/.github/workflows/build.yml@main
```

For same-repo calls, use `uses: ./.github/workflows/build.yml`.

## Keyless Publishing

Prefer keyless (OIDC) publishing wherever supported. Use tokens only when required (for example, installing private dependencies or when the registry does not support OIDC).
