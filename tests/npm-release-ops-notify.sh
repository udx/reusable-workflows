#!/usr/bin/env bash
set -euo pipefail

workflow_file="$(dirname "$0")/../.github/workflows/npm-release-ops.yml"

# Print the indented block that follows the first line matching $1 inside the
# step named $2, stopping at the first line indented less than the block.
extract_block() {
  local marker=$1
  local step_name=$2

  awk -v marker="$marker" -v step="$step_name" '
    index($0, "- name: " step) { in_step = 1; next }
    in_step && !in_block && index($0, marker) { in_block = 1; next }
    in_block {
      if ($0 ~ /^[[:space:]]*$/) { print; next }
      match($0, /^ */)
      if (!indent) indent = RLENGTH
      if (RLENGTH < indent) exit
      print substr($0, indent + 1)
    }
  ' "$workflow_file"
}

assert_slack_payload_has_no_shell_syntax() {
  local payload
  local outside_expressions

  payload=$(extract_block 'payload: |' 'Notify Slack')
  if [[ -z "$payload" ]]; then
    echo "Notify Slack payload not found in $workflow_file" >&2
    return 1
  fi

  # slackapi/slack-github-action sends the payload as-is: shell variables and
  # conditionals are only evaluated when they sit inside ${{ }} expressions.
  outside_expressions=$(printf '%s\n' "$payload" | sed -E 's/\$\{\{[^}]*\}\}//g')
  if grep -nE '\$[A-Za-z_]|&&|\|\|' <<< "$outside_expressions"; then
    echo "Notify Slack payload contains shell syntax outside \${{ }} expressions" >&2
    return 1
  fi
}

assert_report_github_release_line() {
  local enable_gh_release=$1
  local expected=$2
  local script
  local output

  script=$(extract_block 'run: |' 'Report summary')
  output=$(
    CURRENT_BRANCH=latest RELEASE_BRANCH=latest NPM_TAG=latest IS_RELEASE_BRANCH=true \
      ENABLE_GH_RELEASE="$enable_gh_release" NPM_RELEASE_RESULT=success GITHUB_RELEASE_RESULT=success \
      bash -c "$script"
  )

  if ! grep -qxF "GitHub Release: $expected" <<< "$output"; then
    echo "Report summary with ENABLE_GH_RELEASE=$enable_gh_release did not print 'GitHub Release: $expected':" >&2
    printf '%s\n' "$output" >&2
    return 1
  fi
}

assert_slack_payload_has_no_shell_syntax
assert_report_github_release_line 'true' 'enabled'
assert_report_github_release_line 'false' 'disabled'

echo "npm-release-ops notify/report tests passed"
