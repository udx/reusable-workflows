# NPM Release Workflow
<!-- short: Publish npm packages with provenance and GitHub releases -->

A reusable workflow to publish npm packages to a registry with security best practices, optional build/test steps, and GitHub release generation.

## CLI Generator

### Flow

1. **Select template** → npm-release
2. **Setup Node** → Node version, registry URL
3. **Execution options** → Build command, test command, provenance
4. **Secrets configuration** → `NPM_TOKEN`

### Registry Prompts

**NPM:**
- Registry URL → `https://registry.npmjs.org/`
- Provenance → `true`
- Secret: `NPM_TOKEN`

## Setup Guide

### 1. Configure NPM Token
To publish packages, you need an automation token from your npm registry.

- **npmjs.com**: Go to Access Tokens → Generate New Token → Automation.
- **Organization Scopes**: Ensure the token has `read-write` access to the target package.

### 2. Add Secret to GitHub
Add the generated token as a secret in your repository or organization:
- Name: `NPM_TOKEN`
- Value: *[your-token]*

### 3. Local Usage
You can use the common release script locally for testing or manual releases:

```bash
# Set required environment variables
export NPM_TOKEN=your_token
export BUILD_COMMAND="npm run build"

# Run the script
./scripts/npm-publish.sh
```

### 4. GitHub Actions Usage
Call this workflow from your release pipeline (see [example](../examples/npm-release-ops.yml)).

## Workflow Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `node_version` | Node.js: Version to use | `20` |
| `build_command` | Build: Command to run before publishing | `npm run build` |
| `registry_url` | NPM: Registry URL | `https://registry.npmjs.org/` |
| `provenance` | NPM: Enable provenance | `true` |
| `release_branch`| Branch: Deployment branch that triggers releases | `latest` |

## Security and Provenance
This workflow enables **NPM Provenance** by default. This links your published package to the specific GitHub Action run that created it, providing a verifiable chain of custody for your users.
