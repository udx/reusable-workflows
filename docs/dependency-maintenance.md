# Dependency Maintenance

This repo uses Dependabot for GitHub Actions updates. The goal is to keep shared
workflow templates current without turning every patch release into manual work.

## Versioning Policy

- Prefer major version tags for GitHub Actions, for example `actions/checkout@v7`.
- Do not pin actions to Git SHAs by default.
- If upstream does not publish the desired broad tag, use the broadest existing
  tag that matches the reviewed risk boundary. For example, use a minor-line tag
  such as `aormsby/Fork-Sync-With-Upstream-action@v3.4` when no `v3` tag exists
  and the team wants to avoid patch-level Dependabot churn.
- Use a more specific tag only when the action ecosystem or rollout risk makes it
  useful, for example a temporary `slackapi/slack-github-action@v3.0.1` pin while
  validating a migration.

This keeps routine patch and minor updates quiet while still allowing Dependabot
to surface meaningful major-line changes.

CodeQL `actions/unpinned-tag` findings are expected with this policy. Do not mark
them as false positives, because mutable tags are not immutable pins. Dismiss them
as accepted risk, normally with the `won't fix` reason, and include a short
comment that links the decision to this repository policy and the reviewed tag
boundary.

## Review Policy

Dependabot GitHub Actions PRs should be reviewed against repository-local
evidence first:

- the changed `uses:` references
- upstream release notes and changelog
- changed action inputs, defaults, authentication, runtime, or side effects
- the reusable workflow docs and examples in this repo

Patch, minor, and major GitHub Action tag updates can be merged when release
notes show no breaking behavior, affected workflows use compatible inputs, and
Copilot risk hints do not flag advanced review.

Documented runtime changes and unclear credential or runner requirements need
expert review. Treat a generic upstream “breaking” heading as a triage signal,
not proof that this repository needs a migration: identify the affected behavior
and confirm that a changed workflow uses it before classifying the PR as
`needs migration`. When the Copilot risk scan explicitly finds that a generic breaking
change does not apply, automation may classify the PR as safe. The reviewer
should record the applicable behavior and next validation step instead of
approving from guesswork.

Dependabot PR handling should follow one of two paths: automation handles the PR
end-to-end after a `safe` classification, or automation escalates the PR for
additional expert involvement. For safe PRs, the script writes or updates the
automation comment, tries to merge or enable auto-merge, and then submits the
service-account approval. For `needs migration` and `needs expert decision` PRs,
the script requests the human reviewer and comments with the reason, but does not
approve or merge. When automation escalates, the human reviewer owns the final
safety decision. The reviewer should either approve with the reviewed evidence
and accepted risk, or leave the PR blocked with the specific runtime validation
or owner input needed before merge.

When an expert review intentionally changes Dependabot's requested version, keep
the PR metadata aligned with the final decision. Update the title and body to say
what tag is now being adopted, why that tag boundary was chosen, and which checks
or limitations were reviewed. If Copilot leaves feedback about a mismatch between
Dependabot metadata and the actual workflow change, handle it by fixing the
metadata, replying with the evidence, and resolving the review thread.

Human expert approvals should leave a PR comment that captures the final decision,
not just an approval review. Include the selected action tag, the rationale, any
CodeQL accepted-risk handling, and the validation that was actually performed.

The daily automation intentionally keeps scripts in control of comments, normal
merge attempts, auto-merge, automation approvals, and escalation. For safe PRs,
the automation enables merge/auto-merge first, then submits the service-account
approval so approval is the final branch-protection signal. Approval uses
`DEPENDABOT_REVIEWER_TOKEN` when configured so PR API work is attributed to the
service account. The token must have repository access to this repo with
`Contents`, `Issues`, `Pull requests`, and `Workflows` read/write permissions;
`Issues` is required for PR comments, and `Workflows` is required when a safe
Dependabot PR updates files under `.github/workflows/` and the automation needs
to merge or enable auto-merge. The workflow grants the fallback `GITHUB_TOKEN`
the valid repository-scoped workflow permissions available in Actions YAML, but
the service-account token is still the documented path for workflow-file update
merges. The workflow falls back to `GITHUB_TOKEN` only when the service-account
token is missing. If `COPILOT_GITHUB_TOKEN` is set, the
workflow also runs Copilot CLI for a bounded risk-hint scan over Dependabot
metadata. Copilot hints are advisory by default in this repository: advanced
risks can escalate a PR, but a missing Copilot token does not block deterministic
safe classifications. If Copilot or deterministic checks detect runtime,
authentication, runner, unclear-version, or other advanced concerns, the
automation escalates to the human reviewer instead of making the final decision
and requests that reviewer on the pull request.

## Reusable Workflow Constraint

This repository contains templates. Many failures only appear when a tenant repo
calls the workflow with its own secrets, variables, runner type, cloud project,
Slack workspace, database, or repository permissions.

Because of that, a repository-local check can prove only limited things:

- workflow YAML still parses
- changed action inputs still match documented usage
- non-destructive dry-run or validate commands still execute when required test
  credentials are available

It usually cannot prove that tenant-specific runtime behavior is safe.

## Smoke Checks

Use smoke checks only when they are non-destructive:

- syntax/static checks
- dry-run commands
- validate commands
- sandbox-only calls with dedicated test credentials

Do not validate an action upgrade by sending production Slack messages, applying
infrastructure, mutating cloud resources, mirroring repositories, or running
database operations.

If a safe smoke check requires missing repository variables or secrets, record
the missing context and involve the workflow owner.

## Current Action Notes

- `actions/github-script@v9` breaks scripts that use `require('@actions/github')`,
  redeclare `getOctokit` with `const` or `let`, or rely on non-standard
  `@actions/github` internals. Current usage should be checked before merging.
- `actions/checkout` is used across the reusable workflow templates. Major tag
  bumps should be checked against workflow paths that require fetch depth,
  branch refs, or workflow-file write permissions.
