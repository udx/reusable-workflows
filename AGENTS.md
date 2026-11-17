# Working on reusable-workflows

Start with [README.md](README.md), then read the affected workflow's guide in
`docs/workflows/` and its caller example in `examples/`. Follow
[engineering standards](docs/STANDARDS.md) for implementation and the
[caller guide](docs/CALLER_GUIDE.md) for cross-repository interfaces.

- Reusable templates live in `.github/workflows/`; files prefixed with `_`
  own this repository's automation. Keep changes within the affected workflow.
- Declare inputs, secrets, and outputs explicitly in `workflow_call`. Preserve
  defaults, optional features, and caller-selected publishing targets. Update
  the workflow guide and examples together when the interface changes.
- Use maintained major Action tags and reviewed UDX workflow references. Follow
  the [dependency policy](docs/dependency-maintenance.md#versioning-policy) for
  narrower-ref exceptions and unpinned-tag feedback.
- Validate changed YAML and GitHub expressions. For Docker Ops argument-parsing
  changes, run `bash tests/docker-ops-build-args.sh`. Repository checks cover
  syntax and local logic; validate changed authentication, permissions, runners,
  and publishing behavior through a representative caller.
- `.rabbit/repo.yaml` is generated. Follow the
  [refresh procedure](.rabbit/readme.md#refresh) for workflow or delivery-setting
  changes; run `rabbit.ci` against this repository and inspect the resolved
  repository identity and diff before committing.
- Merging to `master` enters repository release automation. Follow the
  [release policy](docs/STANDARDS.md#maintainer-release-automation).
