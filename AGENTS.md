# Repository instructions

Read `README.md` and the task-relevant docs before changing workflows.

## GitHub Actions versions

Follow [the dependency policy](docs/dependency-maintenance.md) when adding,
updating, or reviewing action references in workflows and examples.

- Use published major tags by default, such as `actions/checkout@v7` and
  `github/codeql-action/upload-sarif@v4`.
- Preserve an existing major tag. Do not narrow `@v4` to `@v4.37.3` merely
  because Dependabot proposes it or a newer patch is available.
- Do not introduce commit SHA or exact-version pins without a documented
  reason. If no major tag exists, use the broadest published tag within the
  reviewed compatibility boundary.
- Record any deliberate exception and its rationale in the PR. An exception
  approved for one PR does not change the repository default.

Major tags keep routine patch and minor releases from requiring workflow edits.
Agent instructions guide changes and reviews; Dependabot configuration controls
which update PRs it opens.
