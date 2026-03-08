# Context7 Ops

Reusable workflow to synchronize a repository with [Context7](https://context7.com).
It uses the Context7 Refresh API to trigger a refresh of the library documentation.

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `library_name` | Context7 Library name (e.g. `/owner/repo`). | No | `/${{ github.repository }}` |
| `branch` | Branch to refresh. | No | Current branch |

## Secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `context7_api_key` | Context7 API Key (`ctx7sk...`). | Yes |

## Example Usage

```yaml
jobs:
  sync:
    uses: udx/reusable-workflows/.github/workflows/context7-ops.yml@latest
    with:
      library_name: "/udx/reusable-workflows"
    secrets:
      context7_api_key: ${{ secrets.CONTEXT7_API_KEY }}
```
