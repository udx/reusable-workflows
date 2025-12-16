# Docker Operations Workflow

Reusable workflow for building, scanning, and publishing Docker images to multiple registries.

## Features

- Multi-platform builds (amd64, arm64)
- Security scanning with Trivy + SBOM generation
- Publish to Docker Hub and/or GCP Artifact Registry
- Slack notifications
- Automatic versioning (package.json or GitVersion)

## Quick Start

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
      docker_login: myusername
      docker_org: myorg
      docker_repo: my-app
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}
```

## Configuration

### Inputs

| Input                     | Description                        | Default                   | Required       |
| ------------------------- | ---------------------------------- | ------------------------- | -------------- |
| `image_name`              | Docker image name                  | -                         | ✅             |
| **Docker Hub**            |
| `docker_login`            | Docker Hub username                | -                         | For Docker Hub |
| `docker_org`              | Docker Hub organization            | -                         | For Docker Hub |
| `docker_repo`             | Docker Hub repository              | -                         | For Docker Hub |
| **GCP Artifact Registry** |
| `gcp_region`              | GCP region (e.g., `us-central1`)   | -                         | For GCP        |
| `gcp_project_id`          | GCP project ID                     | -                         | For GCP        |
| `gcp_repo`                | Artifact Registry repo name        | -                         | For GCP        |
| **Build**                 |
| `release_branch`          | Branch that triggers releases      | `latest`                  |                |
| `dockerfile_path`         | Path to Dockerfile                 | `./Dockerfile`            |                |
| `build_platforms`         | Platforms (comma-separated)        | `linux/amd64,linux/arm64` |                |
| `build_args`              | Build args (`ARG1=val1,ARG2=val2`) | -                         |                |
| `version_config_path`     | GitVersion config path             | `ci/git-version.yml`      |                |
| **Security**              |
| `enable_security_scan`    | Run vulnerability scan             | `true`                    |                |
| `enable_security_upload`  | Upload to GitHub Security          | `true`                    |                |

### Secrets

| Secret              | Description              | Required       |
| ------------------- | ------------------------ | -------------- |
| `docker_token`      | Docker Hub token         | For Docker Hub |
| `gcp_credentials`   | GCP service account JSON | For GCP        |
| `slack_webhook_url` | Slack webhook URL        | For Slack      |

## Versioning

**Auto-detection:**

1. If `package.json` exists → version from it
2. Otherwise → GitVersion (requires config at `version_config_path`)

**Build arg placeholders:**

- `{{version}}` → Release version
- `{{branch}}` → Current branch

Example: `build_args: "VERSION={{version}},ENV=production"`

## Publishing

| Target             | When                     | Tags                                                     | Requirements                                                  |
| ------------------ | ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------- |
| **GitHub Release** | Release branch           | Version tag                                              | None                                                          |
| **Docker Hub**     | Release branch           | `version`, `latest`                                      | `docker_login`, `docker_org`, `docker_repo`, `docker_token`   |
| **GCP**            | Release branch or manual | `version`, `latest` (release)<br>`branch-name` (feature) | `gcp_region`, `gcp_project_id`, `gcp_repo`, `gcp_credentials` |
| **Slack**          | After release            | -                                                        | `slack_webhook_url`                                           |

## Security & Changelog

**Security (Trivy):**

- Generates SBOM (SPDX format)
- Scans for CRITICAL/HIGH vulnerabilities
- Uploads to GitHub Security (release branches)
- Disable: `enable_security_scan: "false"`

**Changelog:**

- Create `changes.md` with version entries (e.g., `### 1.2.0`)
- Or auto-generated from git commits since last tag

## Examples

### Minimal (GitHub Only)

```yaml
jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
```

### Docker Hub

```yaml
jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
      docker_login: myusername
      docker_org: myorg
      docker_repo: my-app
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}
```

### Multi-Registry

```yaml
jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
      docker_login: myusername
      docker_org: myorg
      docker_repo: my-app
      gcp_region: us-central1
      gcp_project_id: my-project
      gcp_repo: docker-images
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}
      gcp_credentials: ${{ secrets.GCP_CREDENTIALS }}
      slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Troubleshooting

**GitVersion config not found**

- Ensure `ci/git-version.yml` exists or set `version_config_path`

**Docker Hub push fails**

- Verify all inputs provided: `docker_login`, `docker_org`, `docker_repo`
- Check `docker_token` secret is valid with push permissions

**GCP push fails**

- Verify all inputs: `gcp_region`, `gcp_project_id`, `gcp_repo`
- Check `gcp_credentials` has Artifact Registry Writer role

**Security scan upload fails**

- Only works on release branches
- Requires `security-events: write` permission (auto-granted)

## Best Practices

1. Use semantic versioning in `package.json` or GitVersion config
2. Maintain `changes.md` for better release notes
3. Keep security scanning enabled
4. Use build arg placeholders for version/metadata
5. Test on feature branches before merging to release branch

## License

MIT License - See repository LICENSE file
