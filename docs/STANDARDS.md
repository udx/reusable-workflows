# Engineering Standards & Best Practices

To maintain high-fidelity automation and adhere to UDX engineering standards (CDE), follow these guidelines when designing and implementing reusable workflows.

## Core Design Principles

### 1. Resource Isolation & Efficiency
- **Access Repo Files**: Only use `actions/checkout` when the workflow specifically needs to access repository source files (e.g., for building, linting, or reading a `package.json`).
- **Avoid Redundant Checkouts**: If a job only processes downloaded artifacts or metadata, skip `actions/checkout` to save time and resources.

### 2. Software & Tooling
- **Composite Actions**: Prefer using existing composite actions over manual software installation (`apt-get`, `curl | bash`) to ensure deterministic environments.
- **UDX Worker Images**: To execute tasks in containers, use **UDX worker images**. These provide a pre-configured, secure environment tailored for our CI/CD pipelines.
- **Easy Deployment**: Worker images are designed for easy deployment via YAML, reducing boilerplate in workflow definitions.

### 3. Security & Authentication
- **Workload Identity (OIDC)**: Always prioritize **Workload Identity Federation** to configure keyless authentication. Avoid the use of static JSON keys or long-lived secrets whenever the provider supports OIDC (e.g., GCP, Azure, npm).
- **Minimal Permissions**: Use the `permissions:` block at the job or workflow level to grant only the necessary scopes (e.g., `contents: read`, `id-token: write`).

### 4. Interface & Contract
- **Contract-First**: Explicitly define all `inputs` and `secrets` in the `workflow_call` trigger.
- **Documentation**: Every workflow must have a corresponding `.md` file in `docs/workflows/` and a functional example in `examples/`.
- **Validation**: Use `actions/github-script` or native workflow primitives for API checks and logic instead of relying on external CLI tools like `gh` when possible, to minimize environment dependencies.

## Maintainer Release Automation

The internal workflow `.github/workflows/_release.yml` automates tags and GitHub releases for this repository.

### Trigger Policy
- **Push to `master`**: Triggers an automatic stable release.
- **Manual (`workflow_dispatch`)**: Allows manual releases for non-`master` refs (e.g., feature branches or hotfixes).
- **Validation**: Manual releases targeting `master` are blocked to enforce the "Push to master" stable release policy.

### Version & Changelog Policy
- **Automatic Versioning**: Managed via GitVersion (`ci/git-version.yml`). Tags are normalized to `v<semver>`.
- **Branch Rules**: `master` increments `Minor`, while other branches increment `Patch`.
- **Automated Changelog**: Generated from git commit history between the previous release tag and the target commit (excluding merge commits).

---
_UDX DevSecOps Team_

