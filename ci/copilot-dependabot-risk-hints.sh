#!/usr/bin/env bash
set -euo pipefail

inventory_path="${PR_INVENTORY_PATH:-dependabot-action-prs.json}"
hints_path="${COPILOT_HINTS_PATH:-copilot-dependabot-risk-hints.json}"
work_dir="${REVIEW_WORK_DIR:-.tmp/dependabot-actions-review}"

repo_args=()
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  repo_args=(--repo "${GITHUB_REPOSITORY}")
fi

write_hints() {
  local status="$1"
  printf '{"source":"copilot-cli","status":"%s","hints":[]}\n' "${status}" > "${hints_path}"
}

mkdir -p "${work_dir}"
write_hints "not_run"

if [ -z "${COPILOT_GITHUB_TOKEN:-}" ]; then
  echo "Copilot risk scan: COPILOT_GITHUB_TOKEN is not set; continuing without Copilot hints."
  write_hints "unavailable"
  exit 0
fi

input_path="${work_dir}/copilot-risk-input.json"
raw_output_path="${work_dir}/copilot-risk-output.txt"
prompt_path="${work_dir}/copilot-risk-prompt.md"
candidate_path="${work_dir}/copilot-risk-hints-candidate.json"
: > "${input_path}"

{
  echo '['
  first="true"
  for number in $(jq -r '.[].number' "${inventory_path}"); do
    details_path="${work_dir}/copilot-pr-${number}.json"
    gh pr view "${number}" "${repo_args[@]}" \
      --json number,title,url,body,files \
      > "${details_path}"

    if [ "${first}" = "true" ]; then
      first="false"
    else
      echo ','
    fi

    jq '{
      number,
      title,
      url,
      files: [.files[].path],
      body_excerpt: ((.body // "") | .[0:12000])
    }' "${details_path}"
  done
  echo ']'
} > "${input_path}"

cat > "${prompt_path}" <<PROMPT
You are doing a bounded risk scan for Dependabot GitHub Actions PRs.

Read \`${input_path}\`.

Task:
- Detect dynamic release-note or changelog concerns that a simple version parser
  could miss.
- Use the changed file paths and the corresponding workflow files in the current
  checkout to decide whether a concern applies to this repository.
- Mark "advanced_review" only for breaking changes, runtime or runner changes,
  authentication or permission changes, changed action inputs/defaults, side
  effects, unclear release notes, or tenant/runtime validation needs that are
  relevant to the changed workflows.
- Mark "none" when the metadata does not show those concerns, or when an
  upstream concern is generic and the affected workflows do not use the relevant
  trigger, input, authentication mode, runner, or runtime behavior.

Boundaries:
- Do not comment on GitHub.
- Do not merge or enable auto-merge.
- Do not edit files.
- Do not run commands.
- Do not make the final merge decision.

Print exactly one marker-wrapped JSON object and no other prose:

COPILOT_DEPENDABOT_RISK_HINTS_JSON_START
{"source":"copilot-cli","status":"ok","hints":[{"number":123,"risk":"none","reason":"No advanced risk found"}]}
COPILOT_DEPENDABOT_RISK_HINTS_JSON_END
PROMPT

if ! copilot \
  --prompt "$(cat "${prompt_path}")" \
  --allow-tool='read' \
  --no-ask-user \
  --no-auto-update \
  --secret-env-vars=COPILOT_GITHUB_TOKEN \
  --silent \
  > "${raw_output_path}"; then
  echo "Copilot risk scan: Copilot CLI failed; continuing without Copilot hints."
  write_hints "failed"
  exit 0
fi

sed -n '/COPILOT_DEPENDABOT_RISK_HINTS_JSON_START/,/COPILOT_DEPENDABOT_RISK_HINTS_JSON_END/p' "${raw_output_path}" \
  | sed '1d;$d' > "${candidate_path}"

if jq -e '.hints | type == "array"' "${candidate_path}" >/dev/null 2>&1; then
  jq '.source = (.source // "copilot-cli") | .status = (.status // "ok")' "${candidate_path}" > "${hints_path}"
  hint_count="$(jq '.hints | length' "${hints_path}")"
  advanced_count="$(jq '[.hints[]? | select(.risk == "advanced_review")] | length' "${hints_path}")"
  echo "Copilot risk scan: wrote ${hint_count} hint(s), ${advanced_count} advanced review request(s), to ${hints_path}."
else
  echo "Copilot risk scan: no valid marker-wrapped JSON found; continuing without Copilot hints."
  write_hints "invalid"
fi
