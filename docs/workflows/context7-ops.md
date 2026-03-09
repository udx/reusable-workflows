# Context7 Sync Workflow

Synchronize your repository documentation with the [Context7](https://context7.com) AI knowledge layer using the Refresh API.

This reusable workflow automates the process of notifying Context7 when your documentation or codebase changes, ensuring your AI-ready context stays perfectly in sync with your latest commits.

## Features

- **Automated Re-indexing**: Triggers an immediate refresh of your Context7 library.
- **Branch Awareness**: Supports refreshing specific branches (e.g., `master`, `develop`, or feature branches).
- **Secure Authentication**: Uses encrypted secrets for API key management.
- **Execution Summary**: Provides a clear status report in the GitHub Action job summary.

## Quick Start

```yaml
name: Documentation Sync

on:
  push:
    branches:
      - master

jobs:
  sync:
    uses: udx/reusable-workflows/.github/workflows/context7-ops.yml@master
    with:
      library_name: "/udx/reusable-workflows"
    secrets:
      context7_api_key: ${{ secrets.CONTEXT7_API_KEY }}
```

## Workflow Jobs

### `refresh`

The core job that performs the following steps:
- **Validation**: Ensures the `context7_api_key` is provided and valid.
- **API Interaction**: Executes a `POST` request to the [Context7 Refresh API](https://context7.com/docs/api-reference/refresh/refresh-a-library).
- **Status Reporting**: Captures the API response and emits a high-signal summary in the workflow run.
- **Error Handling**: Gracefully handles API timeouts or authentication failures with descriptive error messages.

## Configuration

### Inputs

| Input | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `library_name` | The unique identifier for your library in Context7. Format: `/@owner/@repo`. | `/${{ github.repository }}` | No |
| `branch` | The specific branch in your repository that Context7 should re-index. | `github.ref_name` | No |

### Secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `context7_api_key` | Your private Context7 API Key (`ctx7sk...`). Found in your Context7 Dashboard -> Settings. | **Yes** |

## Caller Examples

### 1. Simple Sync on Push to Master

Standard pattern for keeping your main documentation updated.

```yaml
jobs:
  sync:
    uses: udx/reusable-workflows/.github/workflows/context7-ops.yml@master
    with:
      library_name: "/my-org/my-repo"
    secrets:
      context7_api_key: ${{ secrets.CONTEXT7_API_KEY }}
```

### 2. Manual Trigger (Workflow Dispatch)

Useful for triggering a refresh without a new commit, or for testing updates on specific branches.

```yaml
on:
  workflow_dispatch:
    inputs:
      target_branch:
        description: "Branch to refresh"
        required: true
        default: "master"

jobs:
  manual-sync:
    uses: udx/reusable-workflows/.github/workflows/context7-ops.yml@master
    with:
      library_name: "/my-org/my-repo"
      branch: ${{ inputs.target_branch }}
    secrets:
      context7_api_key: ${{ secrets.CONTEXT7_API_KEY }}
```

### 3. Sync on Release Tags

Ensure your stable, versioned documentation is refreshed whenever a new release is published.

```yaml
on:
  push:
    tags:
      - 'v*'

jobs:
  release-sync:
    uses: udx/reusable-workflows/.github/workflows/context7-ops.yml@master
    with:
      library_name: "/my-org/my-repo"
      branch: ${{ github.ref_name }}
    secrets:
      context7_api_key: ${{ secrets.CONTEXT7_API_KEY }}
```

## Troubleshooting

**API Key Unauthorized**
- Verify the `context7_api_key` secret is correctly mapped in the caller workflow.
- Ensure the key hasn't expired in your Context7 dashboard.

**Library Not Found**
- Double-check the `library_name` input. It must match the identifier shown in the Context7 URL for your library.

**Branch Mismatch**
- Ensure the `branch` exists in the repository. Context7 can only index branches that have been pushed to GitHub.

---
_UDX DevSecOps Team_
