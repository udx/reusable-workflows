# Deploy WP Plugin to WordPress.org SVN Workflow

Reusable workflow for deploying a tagged WordPress plugin release to the WordPress.org Plugin Directory via SVN, using [10up/action-wordpress-plugin-deploy](https://github.com/10up/action-wordpress-plugin-deploy) (SHA-pinned).

## Features

- Deploys `trunk/` + `tags/<tag>/` to `plugins.svn.wordpress.org/<slug>/`
- Handles `.wordpress-org/` assets (banners, icons, screenshots) when present
- `dry_run` mode rehearses checkout and SVN package preparation without committing; credentials are still required and injected (the deploy tool verifies they are set before anything runs) — only the authenticated commit is skipped

## Quick Start

```yaml
name: Publish Release

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag (e.g. 1.2.3a)'
        required: true

permissions:
  contents: read

jobs:
  deploy:
    uses: udx/reusable-workflows/.github/workflows/wp-org-svn-deploy.yml@master
    with:
      tag: ${{ github.event.inputs.tag }}
    secrets:
      svn_username: ${{ secrets.SVN_USERNAME }}
      svn_password: ${{ secrets.SVN_PASSWORD }}
```

## Configuration

### Inputs

| Input       | Description                                  | Default                     | Required |
| ----------- | -------------------------------------------- | --------------------------- | -------- |
| `tag`       | Release tag to deploy (must exist)           | -                           | ✅       |
| `slug`      | WordPress.org plugin slug                    | calling repository name     |          |
| `dry_run`   | Validate without committing to SVN           | `false`                     |          |

### Secrets

| Secret         | Description                                   | Required |
| -------------- | --------------------------------------------- | -------- |
| `svn_username` | WordPress.org SVN username (committer account) | ✅       |
| `svn_password` | WordPress.org SVN password                     | ✅       |

Store them as organization secrets (e.g. `SVN_USERNAME` / `SVN_PASSWORD`) with visibility scoped to the repositories that release plugins. Nothing secret is ever written to a repository — the workflow only references them.

## Notes

- The tag's tree is what ships. Run after your GitHub release workflow so the tag exists (e.g. `needs: release`).
- The plugin's `readme.txt` `Stable tag` field should match the deployed tag; the directory serves the version it points at.
