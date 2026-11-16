# Repository instructions

Read `README.md` and the task-relevant docs before editing workflows.

This repository is public. Describe reusable capabilities for any caller. Keep
private caller names, repository/run URLs, image coordinates, and registry
identifiers out of public PRs, comments, docs, and examples. Keep caller-specific
validation evidence in its owning repository.

Use maintained major Action tags, such as `docker/setup-buildx-action@v4`, and
reviewed UDX branches for reusable workflows. Follow the
[dependency policy](docs/dependency-maintenance.md#versioning-policy) for narrower
ref exceptions and SHA-pinning feedback. Handle valid unpinned-tag findings as
accepted risk: dismiss the linked alert with the policy rationale, then reply to
and resolve the review thread. Keep CodeQL enabled.

For workflow or GitHub delivery-setting changes, follow the
[Rabbit CI refresh instructions](.rabbit/readme.md#refresh).
