# Docker Operations Workflow

Reusable workflow for building, scanning, and publishing Docker images to multiple registries.

## Features

- Multi-platform builds (amd64, arm64)
- Security scanning with Trivy + SBOM generation
- Publish to Docker Hub, GCP Artifact Registry, and/or Azure Container Registry
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
| `gcp_workload_identity_provider` | Workload Identity Provider resource name | -              | For GCP        |
| `gcp_service_account`     | Service account email for WIF      | -                         | For GCP        |
| **Azure Container Registry** |
| `acr_registry`            | ACR registry name (e.g., `myregistry.azurecr.io`) | -              | For ACR        |
| `acr_repository`          | ACR repository name                | -                         | For ACR        |
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

| Secret              | Description                          | Required       |
| ------------------- | ------------------------------------ | -------------- |
| `docker_token`      | Docker Hub token                     | For Docker Hub |
| `acr_credentials`   | Azure service principal JSON         | For ACR        |
| `slack_webhook_url` | Slack webhook URL                    | For Slack      |

**Note:** GCP authentication now uses Workload Identity Federation (keyless auth). JSON key authentication is no longer supported.

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
| **GCP**            | Release branch or manual | `version`, `latest` (release)<br>`branch-name` (feature) | `gcp_region`, `gcp_project_id`, `gcp_repo`, `gcp_workload_identity_provider`, `gcp_service_account` |
| **ACR**            | Release branch or manual | `version`, `latest` (release)<br>`branch-name` (feature) | `acr_registry`, `acr_repository`, `acr_credentials`           |
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

### Multi-Registry (Docker Hub + GCP + ACR)

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
      gcp_workload_identity_provider: projects/123456789/locations/global/workloadIdentityPools/github/providers/github-provider
      gcp_service_account: github-actions@my-project.iam.gserviceaccount.com
      acr_registry: myregistry.azurecr.io
      acr_repository: my-app
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}
      acr_credentials: ${{ secrets.ACR_CREDENTIALS }}
      slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Azure Container Registry Only

```yaml
jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
      acr_registry: myregistry.azurecr.io
      acr_repository: my-app
    secrets:
      acr_credentials: ${{ secrets.ACR_CREDENTIALS }}
```

## GCP Workload Identity Federation Setup

To use GCP Artifact Registry with keyless authentication, configure Workload Identity Federation:

### 1. Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github" \
  --project="my-project" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 2. Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="my-project" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'your-org'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 3. Create Service Account

```bash
gcloud iam service-accounts create github-actions \
  --project="my-project" \
  --display-name="GitHub Actions"
```

### 4. Grant Artifact Registry Writer Role

```bash
gcloud projects add-iam-policy-binding my-project \
  --member="serviceAccount:github-actions@my-project.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### 5. Allow GitHub Actions to Impersonate Service Account

```bash
gcloud iam service-accounts add-iam-policy-binding github-actions@my-project.iam.gserviceaccount.com \
  --project="my-project" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/your-org/your-repo"
```

### 6. Get Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="my-project" \
  --location="global" \
  --workload-identity-pool="github" \
  --format="value(name)"
```

Use this output as `gcp_workload_identity_provider` input.

## Troubleshooting

**GitVersion config not found**

- Ensure `ci/git-version.yml` exists or set `version_config_path`

**Docker Hub push fails**

- Verify all inputs provided: `docker_login`, `docker_org`, `docker_repo`
- Check `docker_token` secret is valid with push permissions

**GCP push fails**

- Verify all inputs: `gcp_region`, `gcp_project_id`, `gcp_repo`, `gcp_workload_identity_provider`, `gcp_service_account`
- Ensure Workload Identity Federation is properly configured in GCP
- Check service account has Artifact Registry Writer role
- Verify the Workload Identity Pool is configured to trust GitHub Actions from your repository

**ACR push fails**

- Verify all inputs: `acr_registry`, `acr_repository`
- Check `acr_credentials` is valid service principal JSON with `AcrPush` role
- Ensure registry name format is correct (e.g., `myregistry.azurecr.io`)

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
