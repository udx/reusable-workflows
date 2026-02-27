# Maintainer Release Automation

Workflow: `.github/workflows/_release.yml`

This maintainer workflow automates tags and GitHub releases for this repository.

## Trigger Policy

- `push` to `master`: automatic stable release.
- `workflow_dispatch`: manual release for non-`master` refs.
- Manual release targeting `master` is blocked by validation.

## Version Policy

- Version is automatic via GitVersion (`ci/git-version.yml`).
- Tags are normalized to `v<semver>`.
- Existing tags are rejected (local and remote).

Current branch rules:

- `master`: increment `Minor`
- other branches: increment `Patch`

## Changelog Policy

- Release notes are generated from git commit history between the previous reachable release tag and the target commit.
- If no previous tag exists, notes are generated from full history up to the target commit.
- Merge commits are excluded.

## Manual Release Inputs

| Input        | Required | Default | Description                                                                                  |
| ------------ | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `target_ref` | No       | empty   | Branch/tag/commit to release. If empty, uses selected dispatch ref. `master` is not allowed. |
| `prerelease` | No       | `true`  | Mark release as prerelease (recommended for non-`master`).                                   |
| `draft`      | No       | `false` | Create release as draft.                                                                     |

## Notes

- The workflow uses `contents: write` permission to create tags and releases.
- No secret input values are logged.
- Release creation uses argument arrays to avoid shell injection patterns.
