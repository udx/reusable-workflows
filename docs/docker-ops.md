# Docker Operations Workflow
<!-- short: Docker image release pipeline with multi-registry support -->

Build, scan, and publish Docker images to multiple registries with security scanning and SBOM generation.

Reusable workflow for building, scanning, and publishing Docker images to multiple registries.

## Features

- Multi-platform builds (amd64, arm64)
- Security scanning with Trivy + SBOM generation
- Publish to Docker Hub, GCP Artifact Registry, and/or Azure Container Registry
- Slack notifications
- Automatic versioning (package.json or GitVersion)

## CLI Generator

Generate workflow configuration interactively:

```bash
npm install -g @udx/reusable-workflows
reusable-workflows
```

### Flow

1. **Select template** → docker-ops
2. **Common inputs** → Image name, release branch, dockerfile path, build platforms
3. **Select registries** → Docker Hub, GCP, ACR (multi-select)
4. **Registry configuration** → Prompted for selected registries only
5. **Output** → `.github/workflows/docker-ops.yml` + `SETUP-docker-ops.md`

### Registry Prompts

**Docker Hub:**
- Username → `${{ vars.DOCKER_USERNAME }}`
- Organization
- Repository
- Secret: `DOCKER_TOKEN`

**GCP Artifact Registry:**
- Region
- Project ID
- Repository name
- Workload Identity Provider
- Service account email
- Permissions: `id-token: write`

**Azure Container Registry:**
- Registry (e.g., myregistry.azurecr.io)
- Repository
- Client ID
- Tenant ID
- Subscription ID
- Permissions: `id-token: write`

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

| Input                            | Description                                       | Default                   | Required       |
| -------------------------------- | ------------------------------------------------- | ------------------------- | -------------- |
| `image_name`                     | Docker image name                                 | -                         | ✅             |
| **Docker Hub**                   |
| `docker_login`                   | Docker Hub username                               | -                         | For Docker Hub |
| `docker_org`                     | Docker Hub organization                           | -                         | For Docker Hub |
| `docker_repo`                    | Docker Hub repository                             | -                         | For Docker Hub |
| **GCP Artifact Registry**        |
| `gcp_region`                     | GCP region (e.g., `us-central1`)                  | -                         | For GCP        |
| `gcp_project_id`                 | GCP project ID                                    | -                         | For GCP        |
| `gcp_repo`                       | Artifact Registry repo name                       | -                         | For GCP        |
| `gcp_workload_identity_provider` | Workload Identity Provider resource name          | -                         | For GCP        |
| `gcp_service_account`            | Service account email for WIF                     | -                         | For GCP        |
| **Azure Container Registry**     |
| `acr_registry`                   | ACR registry name (e.g., `myregistry.azurecr.io`) | -                         | For ACR        |
| `acr_repository`                 | ACR repository name                               | -                         | For ACR        |
| `azure_client_id`                | Azure Client ID for OIDC                          | -                         | For ACR        |
| `azure_tenant_id`                | Azure Tenant ID for OIDC                          | -                         | For ACR        |
| `azure_subscription_id`          | Azure Subscription ID for OIDC                    | -                         | For ACR        |
| **Build**                        |
| `release_branch`                 | Branch that triggers releases                     | `latest`                  |                |
| `dockerfile_path`                | Path to Dockerfile                                | `./Dockerfile`            |                |
| `build_platforms`                | Platforms (comma-separated)                       | `linux/amd64,linux/arm64` |                |
| `build_args`                     | Build args (`ARG1=val1,ARG2=val2`)                | -                         |                |
| `version_config_path`            | GitVersion config path                            | `ci/git-version.yml`      |                |
| **Security**                     |
| `enable_security_scan`           | Run vulnerability scan                            | `true`                    |                |
| `enable_security_upload`         | Upload to GitHub Security                         | `true`                    |                |
| `enable_sbom`                    | Generate and upload SBOM                          | `true`                    |                |

### Secrets

| Secret              | Description       | Required       |
| ------------------- | ----------------- | -------------- |
| `docker_token`      | Docker Hub token  | For Docker Hub |
| `slack_webhook_url` | Slack webhook URL | For Slack      |

**Note:** Both GCP and Azure authentication now use OIDC/Workload Identity Federation (keyless auth). JSON key/credential authentication is no longer supported.

## Dependency & Permission Matrix

This matrix maps each registry type to its required configuration for AI-assisted workflow generation:

| Registry Type                | Mandatory Inputs                                                                                    | Mandatory Secrets | Required IAM Role/Permission                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------- |
| **Docker Hub**               | `docker_login`, `docker_org`, `docker_repo`                                                         | `docker_token`    | Token with push permissions                        |
| **GCP Artifact Registry**    | `gcp_region`, `gcp_project_id`, `gcp_repo`, `gcp_workload_identity_provider`, `gcp_service_account` | None (OIDC)       | `roles/artifactregistry.writer` on service account |
| **Azure Container Registry** | `acr_registry`, `acr_repository`, `azure_client_id`, `azure_tenant_id`, `azure_subscription_id`     | None (OIDC)       | `AcrPush` role on service principal                |

**Key Points:**

- **Docker Hub**: Requires username, organization, repository name, and a personal access token with push permissions
- **GCP**: Uses Workload Identity Federation (keyless). Service account must have Artifact Registry Writer role
- **Azure**: Uses OIDC authentication (keyless). Service principal must have AcrPush role on the registry

## Versioning

**Auto-detection:**

1. If `package.json` exists → version from it
2. Otherwise → GitVersion (requires config at `version_config_path`)

**Build arg placeholders:**

- `{{version}}` → Release version
- `{{branch}}` → Current branch

Example: `build_args: "VERSION={{version}},ENV=production"`

## Publishing

| Target             | When                     | Tags                                                     | Requirements                                                                                        |
| ------------------ | ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **GitHub Release** | Release branch           | Version tag                                              | None                                                                                                |
| **Docker Hub**     | Release branch           | `version`, `latest`                                      | `docker_login`, `docker_org`, `docker_repo`, `docker_token`                                         |
| **GCP**            | Release branch or manual | `version`, `latest` (release)<br>`branch-name` (feature) | `gcp_region`, `gcp_project_id`, `gcp_repo`, `gcp_workload_identity_provider`, `gcp_service_account` |
| **ACR**            | Release branch or manual | `version`, `latest` (release)<br>`branch-name` (feature) | `acr_registry`, `acr_repository`, `azure_client_id`, `azure_tenant_id`, `azure_subscription_id`     |
| **Slack**          | After release            | -                                                        | `slack_webhook_url`                                                                                 |

## Security & Changelog

**Security (Trivy):**

- Generates SBOM (SPDX format) - attached to GitHub releases
- Scans for CRITICAL/HIGH vulnerabilities
- Uploads to GitHub Security (release branches)
- Disable scanning: `enable_security_scan: "false"`
- Disable SBOM: `enable_sbom: "false"`

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
      azure_client_id: 12345678-90ab-cdef-1234-567890abcdef
      azure_tenant_id: 87654321-fedc-ba09-8765-4321fedcba09
      azure_subscription_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}
      slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Azure Container Registry Only

```yaml
jobs:
  release:
    permissions:
      id-token: write
      contents: read
    uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master
    with:
      image_name: my-app
      acr_registry: myregistry.azurecr.io
      acr_repository: my-app
      azure_client_id: 12345678-90ab-cdef-1234-567890abcdef
      azure_tenant_id: 87654321-fedc-ba09-8765-4321fedcba09
      azure_subscription_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
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

## Azure OIDC Setup

To use Azure Container Registry with OIDC authentication, configure federated credentials for your service principal:

### 1. Create Service Principal

```bash
az ad sp create-for-rbac --name "sp-github-actions-acr" \
  --role "AcrPush" \
  --scopes /subscriptions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/resourceGroups/my-resource-group/providers/Microsoft.ContainerRegistry/registries/myregistry
```

Note the `appId` (Client ID), `tenant` (Tenant ID) from the output.

### 2. Configure Federated Credentials

Azure supports multiple credential patterns. Choose based on your security requirements:

#### Option A: Strict Security (Production Recommended)

**Single branch credential** - Only the specified branch can authenticate:

```bash
az ad app federated-credential create \
  --id 12345678-90ab-cdef-1234-567890abcdef \
  --parameters '{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:your-org/your-repo:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

**Use when:**

- Production environments
- You only publish from release branches
- Following principle of least privilege

#### Option B: Flexible Security (Development/Testing)

**Wildcard credential** - All branches and PRs can authenticate:

```bash
az ad app federated-credential create \
  --id 12345678-90ab-cdef-1234-567890abcdef \
  --parameters '{
    "name": "github-actions-all-branches",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:your-org/your-repo:ref:refs/heads/*",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Optional: Add PR support
az ad app federated-credential create \
  --id 12345678-90ab-cdef-1234-567890abcdef \
  --parameters '{
    "name": "github-actions-pr",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:your-org/your-repo:pull_request",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

**Use when:**

- Development/test subscriptions
- You need to test builds from feature branches
- Convenience outweighs strict security

**Note:** This workflow only publishes on release branches by default, so Option A is sufficient for most use cases. Option B is useful for development environments where you want flexibility to test from any branch.

### 3. Required Workflow Permissions

Ensure your workflow has `id-token: write` permission:

```yaml
jobs:
  release:
    permissions:
      id-token: write
      contents: read
```

### 4. Use in Workflow

Provide the Azure OIDC parameters:

```yaml
with:
  acr_registry: myregistry.azurecr.io
  acr_repository: my-app
  azure_client_id: 12345678-90ab-cdef-1234-567890abcdef
  azure_tenant_id: 87654321-fedc-ba09-8765-4321fedcba09
  azure_subscription_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

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

- Verify all inputs: `acr_registry`, `acr_repository`, `azure_client_id`, `azure_tenant_id`, `azure_subscription_id`
- Ensure federated credentials are configured for your repository in Azure AD
- Check service principal has `AcrPush` role on the registry
- Verify `id-token: write` permission is set in workflow
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
