#!/usr/bin/env bash
set -euo pipefail

inventory_path="${PR_INVENTORY_PATH:-dependabot-action-prs.json}"
report_path="${REPORT_PATH:-dependabot-actions-review-report.md}"
copilot_hints_path="${COPILOT_HINTS_PATH:-}"
copilot_hints_required="${COPILOT_HINTS_REQUIRED:-false}"
dry_run="${DRY_RUN:-true}"
human_reviewer="${HUMAN_REVIEWER:-}"
automation_github_token="${AUTOMATION_GITHUB_TOKEN:-${APPROVAL_GITHUB_TOKEN:-${GH_TOKEN:-}}}"
merge_method="${MERGE_METHOD:-squash}"
work_dir="${REVIEW_WORK_DIR:-.tmp/dependabot-actions-review}"

repo_args=()
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  repo_args=(--repo "${GITHUB_REPOSITORY}")
fi

mkdir -p "${work_dir}"
: > "${work_dir}/safe.md"
: > "${work_dir}/needs-migration.md"
: > "${work_dir}/needs-expert.md"
: > "${work_dir}/skipped.md"
: > "${work_dir}/notes.md"
: > "${work_dir}/decisions.md"

run_gh() {
  if [ -n "${automation_github_token}" ]; then
    GH_TOKEN="${automation_github_token}" gh "$@"
  else
    gh "$@"
  fi
}

markdown_table_cell() {
  local value="$1"
  value="${value//$'\r'/ }"
  value="${value//$'\n'/ }"
  value="${value//$'\t'/ }"
  value="${value//|/\\|}"
  printf '%s' "${value}"
}

append_decision() {
  local number="$1"
  local classification="$2"
  local reason="$3"
  local action_taken="$4"
  local url="$5"
  local classification_cell action_taken_cell reason_cell

  classification_cell="$(markdown_table_cell "${classification}")"
  action_taken_cell="$(markdown_table_cell "${action_taken}")"
  reason_cell="$(markdown_table_cell "${reason}")"

  printf '| [#%s](%s) | %s | %s | %s |\n' \
    "${number}" \
    "${url}" \
    "${classification_cell}" \
    "${action_taken_cell}" \
    "${reason_cell}" >> "${work_dir}/decisions.md"
}

normalized_numeric_version() {
  local version="$1"
  local normalized="${version#v}"

  if [[ "${normalized}" =~ ^[0-9]+([.][0-9]+){0,2}$ ]]; then
    printf '%s' "${normalized}"
    return 0
  fi

  return 1
}

version_part() {
  local version="$1"
  local part="$2"
  local cleaned major minor patch
  cleaned="$(normalized_numeric_version "${version}")" || return 1
  IFS='.' read -r major minor patch _ <<< "${cleaned}"
  case "${part}" in
    major) printf '%s' "${major:-0}" ;;
    minor) printf '%s' "${minor:-0}" ;;
    patch) printf '%s' "${patch:-0}" ;;
  esac
}

is_integer() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

comment_already_exists() {
  local details_path="$1"
  jq -e '.comments[]? | select(.body | contains("<!-- udx-dependabot-actions-review -->"))' "${details_path}" >/dev/null
}

existing_comment_id() {
  local details_path="$1"
  jq -r '
    .comments[]?
    | select(.body | contains("<!-- udx-dependabot-actions-review -->"))
    | (try (.url | capture("issuecomment-(?<id>[0-9]+)$").id) catch empty)
  ' "${details_path}" | head -n 1
}

copilot_hint_reason() {
  local number="$1"

  if [ -z "${copilot_hints_path}" ] || [ ! -f "${copilot_hints_path}" ]; then
    return 0
  fi

  jq -r --argjson number "${number}" '
    .hints[]?
    | select(.number == $number and .risk == "advanced_review")
    | .reason
  ' "${copilot_hints_path}" 2>/dev/null | head -n 1 || true
}

copilot_hints_status() {
  if [ -z "${copilot_hints_path}" ] || [ ! -f "${copilot_hints_path}" ]; then
    echo "missing"
    return
  fi

  jq -r '.status // "missing"' "${copilot_hints_path}" 2>/dev/null || echo "invalid"
}

write_comment() {
  local number="$1"
  local classification="$2"
  local body="$3"
  local details_path="$4"
  local comment_path="${work_dir}/pr-${number}-comment.md"
  local existing_id

  {
    printf '<!-- udx-dependabot-actions-review -->\n'
    printf '\n'
    printf '%s\n' "${body}"
    printf '\n'
    printf '_Classification: %s._\n' "${classification}"
  } > "${comment_path}"

  existing_id="$(existing_comment_id "${details_path}")"

  if [ "${dry_run}" = "true" ]; then
    if [ -n "${existing_id}" ]; then
      echo "dry-run: would update automation comment on #${number}: ${classification}" >> "${work_dir}/notes.md"
    else
      echo "dry-run: would comment on #${number}: ${classification}" >> "${work_dir}/notes.md"
    fi
    return 0
  fi

  if [ -n "${existing_id}" ]; then
    if [ -z "${GITHUB_REPOSITORY:-}" ]; then
      echo "#${number}: could not update automation comment because GITHUB_REPOSITORY is unset" >> "${work_dir}/notes.md"
      return 0
    fi
    run_gh api \
      -X PATCH \
      "repos/${GITHUB_REPOSITORY}/issues/comments/${existing_id}" \
      -F "body=@${comment_path}" \
      --silent
  else
    run_gh pr comment "${number}" "${repo_args[@]}" --body-file "${comment_path}"
  fi
}

request_human_review() {
  local number="$1"

  if [ -z "${human_reviewer}" ]; then
    return 0
  fi

  if [ "${dry_run}" = "true" ]; then
    echo "dry-run: would request @${human_reviewer} review on #${number}" >> "${work_dir}/notes.md"
    return 0
  fi

  if [ -z "${GITHUB_REPOSITORY:-}" ]; then
    echo "#${number}: could not request @${human_reviewer} review because GITHUB_REPOSITORY is unset" >> "${work_dir}/notes.md"
    return 0
  fi

  if run_gh api \
    -X POST \
    "repos/${GITHUB_REPOSITORY}/pulls/${number}/requested_reviewers" \
    -f "reviewers[]=${human_reviewer}" \
    --silent; then
    echo "#${number}: requested @${human_reviewer} review" >> "${work_dir}/notes.md"
  else
    echo "#${number}: failed to request @${human_reviewer} review" >> "${work_dir}/notes.md"
  fi
}

approve_pr() {
  local number="$1"

  if [ -z "${automation_github_token}" ]; then
    echo "#${number}: no approval token configured; skipped automation approval" >> "${work_dir}/notes.md"
    return 0
  fi

  if [ "${dry_run}" = "true" ]; then
    echo "dry-run: would approve #${number} with automation token" >> "${work_dir}/notes.md"
    return 0
  fi

  if run_gh pr review "${number}" "${repo_args[@]}" --approve --body "Approved by Dependabot Actions review automation."; then
    echo "#${number}: approved with automation token" >> "${work_dir}/notes.md"
  else
    echo "#${number}: failed to approve with automation token" >> "${work_dir}/notes.md"
  fi
}

try_merge_pr() {
  local number="$1"
  local merge_flag

  case "${merge_method}" in
    merge) merge_flag="--merge" ;;
    rebase) merge_flag="--rebase" ;;
    squash|*) merge_flag="--squash" ;;
  esac

  if [ "${dry_run}" = "true" ]; then
    echo "dry-run: would merge #${number} with ${merge_method} or enable auto-merge if branch protection blocks immediate merge" >> "${work_dir}/notes.md"
    return 0
  fi

  if run_gh pr merge "${number}" "${repo_args[@]}" "${merge_flag}" --auto; then
    echo "#${number}: merged or enabled auto-merge with ${merge_method}" >> "${work_dir}/notes.md"
  elif run_gh pr merge "${number}" "${repo_args[@]}" "${merge_flag}"; then
    echo "#${number}: merged with ${merge_method}" >> "${work_dir}/notes.md"
  else
    echo "#${number}: safe, but GitHub did not allow merge with current checks/reviews/protection" >> "${work_dir}/notes.md"
  fi
}

classify_pr() {
  local title="$1"
  local body="$2"
  local changed_files="$3"
  local title_for_parse action_name old_version new_version old_major new_major old_minor new_minor lower_body

  title_for_parse="${title#chore(deps): }"
  title_for_parse="${title_for_parse#chore(deps):}"

  if ! [[ "${title_for_parse}" =~ ^[Bb]ump[[:space:]]+(.+)[[:space:]]+from[[:space:]]+([^[:space:]]+)[[:space:]]+to[[:space:]]+([^[:space:]]+) ]]; then
    echo "needs expert decision|Could not parse Dependabot title format"
    return
  fi

  action_name="${BASH_REMATCH[1]}"
  old_version="${BASH_REMATCH[2]}"
  new_version="${BASH_REMATCH[3]}"

  if [ -z "${changed_files}" ]; then
    echo "skipped|No changed files were reported by GitHub"
    return
  fi

  if ! old_major="$(version_part "${old_version}" major)" || ! new_major="$(version_part "${new_version}" major)"; then
    echo "needs expert decision|Unclear version format ${old_version} -> ${new_version}"
    return
  fi

  old_minor="$(version_part "${old_version}" minor)"
  new_minor="$(version_part "${new_version}" minor)"
  lower_body="$(printf '%s' "${body}" | tr '[:upper:]' '[:lower:]')"

  if ! is_integer "${old_major}" || ! is_integer "${new_major}"; then
    echo "needs expert decision|Could not compare versions ${old_version} -> ${new_version}"
    return
  fi

  if printf '%s' "${lower_body}" | grep -Eq '(^|[^[:alnum:]_])breaking([^[:alnum:]_]|$)|migration|removed input|removed option|removed parameter|renamed input|renamed option|renamed parameter|changed authentication|requires authentication|authentication requirement|changed credential|requires credential|credential requirement|changed default'; then
    echo "needs migration|Release notes mention breaking, migration, authentication, credential, input, option, parameter, or default-behavior changes"
    return
  fi

  if printf '%s' "${lower_body}" | grep -Eq 'requires node ?2[0-9]|node ?2[0-9] (is |now )?required|node2[0-9]|requires node24|changed runtime|runtime requirement|runner compatibility|runner requirement'; then
    echo "needs expert decision|Release notes mention runtime or runner compatibility risk"
    return
  fi

  if ! is_integer "${old_minor}" || ! is_integer "${new_minor}"; then
    echo "needs expert decision|Could not compare minor versions ${old_version} -> ${new_version}"
    return
  fi

  if (( new_major > old_major )); then
    echo "safe|Major bump ${action_name} ${old_version} -> ${new_version}; no deterministic risk terms found in Dependabot release notes"
    return
  fi

  if (( new_minor > old_minor )); then
    echo "safe|Minor bump ${action_name} ${old_version} -> ${new_version}; no risk terms found in Dependabot release notes"
    return
  fi

  echo "safe|Patch bump ${action_name} ${old_version} -> ${new_version}; no risk terms found in Dependabot release notes"
}

pr_count="$(jq 'length' "${inventory_path}")"
copilot_status="$(copilot_hints_status)"
echo "Review: ${pr_count} Dependabot GitHub Actions PR(s); dry_run=${dry_run}; copilot_status=${copilot_status}."
for row in $(jq -r '.[].number' "${inventory_path}"); do
  number="${row}"
  details_path="${work_dir}/pr-${number}.json"

  run_gh pr view "${number}" "${repo_args[@]}" \
    --json number,title,url,body,files,comments,mergeStateStatus,reviewDecision,autoMergeRequest \
    > "${details_path}"

  title="$(jq -r '.title' "${details_path}")"
  url="$(jq -r '.url' "${details_path}")"
  body="$(jq -r '.body // ""' "${details_path}")"
  changed_files="$(jq -r '[.files[].path] | join(", ")' "${details_path}")"
  result="$(classify_pr "${title}" "${body}" "${changed_files}")"
  classification="${result%%|*}"
  reason="${result#*|}"
  hint_reason="$(copilot_hint_reason "${number}")"

  if [ "${classification}" = "safe" ] && [ -n "${hint_reason}" ]; then
    classification="needs expert decision"
    reason="Copilot risk scan requested expert review: ${hint_reason}"
  elif [ "${classification}" = "safe" ] && [ "${copilot_hints_required}" = "true" ] && [ "${copilot_status}" != "ok" ]; then
    classification="needs expert decision"
    reason="Copilot risk scan status is ${copilot_status}; expert review required before merge"
  elif [ -n "${hint_reason}" ]; then
    echo "#${number}: Copilot risk hint: ${hint_reason}" >> "${work_dir}/notes.md"
  fi

  case "${classification}" in
    safe)
      echo "Review: #${number} safe."
      comment="Safe to merge: ${reason} Changed files: ${changed_files}."
      write_comment "${number}" "safe" "${comment}" "${details_path}"
      if comment_already_exists "${details_path}"; then
        action_taken="updated existing automation comment"
      elif [ "${dry_run}" = "true" ]; then
        action_taken="would comment"
      else
        action_taken="commented"
      fi
      try_merge_pr "${number}"
      approve_pr "${number}"
      append_decision "${number}" "safe" "${reason}" "${action_taken}" "${url}"
      printf -- '- #%s %s (%s; %s) %s\n' "${number}" "${title}" "${reason}" "${action_taken}" "${url}" >> "${work_dir}/safe.md"
      ;;
    "needs migration")
      echo "Review: #${number} needs migration."
      mention=""
      if [ -n "${human_reviewer}" ]; then
        mention=" @${human_reviewer}"
      fi
      comment="Needs migration before merge. ${reason}${mention}"
      request_human_review "${number}"
      write_comment "${number}" "needs migration" "${comment}" "${details_path}"
      if comment_already_exists "${details_path}"; then
        action_taken="updated existing automation comment"
      elif [ "${dry_run}" = "true" ]; then
        action_taken="would comment"
      else
        action_taken="commented"
      fi
      append_decision "${number}" "needs migration" "${reason}" "${action_taken}" "${url}"
      printf -- '- #%s %s (%s; %s) %s\n' "${number}" "${title}" "${reason}" "${action_taken}" "${url}" >> "${work_dir}/needs-migration.md"
      ;;
    "needs expert decision")
      echo "Review: #${number} needs expert decision."
      mention=""
      if [ -n "${human_reviewer}" ]; then
        mention=" @${human_reviewer}"
      fi
      comment="Needs expert decision before merge. ${reason}${mention}"
      request_human_review "${number}"
      write_comment "${number}" "needs expert decision" "${comment}" "${details_path}"
      if comment_already_exists "${details_path}"; then
        action_taken="updated existing automation comment"
      elif [ "${dry_run}" = "true" ]; then
        action_taken="would comment"
      else
        action_taken="commented"
      fi
      append_decision "${number}" "needs expert decision" "${reason}" "${action_taken}" "${url}"
      printf -- '- #%s %s (%s; %s) %s\n' "${number}" "${title}" "${reason}" "${action_taken}" "${url}" >> "${work_dir}/needs-expert.md"
      ;;
    skipped|*)
      echo "Review: #${number} skipped."
      append_decision "${number}" "skipped" "${reason}" "none" "${url}"
      printf -- '- #%s %s (%s) %s\n' "${number}" "${title}" "${reason}" "${url}" >> "${work_dir}/skipped.md"
      ;;
  esac
done

safe_count="$(wc -l < "${work_dir}/safe.md" | tr -d ' ')"
needs_migration_count="$(wc -l < "${work_dir}/needs-migration.md" | tr -d ' ')"
needs_expert_count="$(wc -l < "${work_dir}/needs-expert.md" | tr -d ' ')"
skipped_count="$(wc -l < "${work_dir}/skipped.md" | tr -d ' ')"

{
  echo "## GitHub Actions dependency PR review"
  echo
  echo "### At a glance"
  echo
  echo "| Metric | Value |"
  echo "| --- | ---: |"
  echo "| Reviewed | ${pr_count} |"
  echo "| Safe | ${safe_count} |"
  echo "| Needs migration | ${needs_migration_count} |"
  echo "| Needs expert decision | ${needs_expert_count} |"
  echo "| Skipped | ${skipped_count} |"
  echo
  echo "Dry run: \`${dry_run}\`"
  echo "Copilot risk scan: \`${copilot_status}\`"
  echo "Merge method: \`${merge_method}\`"
  echo
  if [ -s "${work_dir}/decisions.md" ]; then
    echo "### Decisions"
    echo
    echo "| PR | Decision | Automation action | Reason |"
    echo "| --- | --- | --- | --- |"
    cat "${work_dir}/decisions.md"
    echo
  fi
  if [ -s "${work_dir}/safe.md" ]; then
    echo "### Safe"
    cat "${work_dir}/safe.md"
    echo
  fi
  if [ -s "${work_dir}/needs-migration.md" ]; then
    echo "### Needs migration"
    cat "${work_dir}/needs-migration.md"
    echo
  fi
  if [ -s "${work_dir}/needs-expert.md" ]; then
    echo "### Needs expert decision"
    cat "${work_dir}/needs-expert.md"
    echo
  fi
  if [ -s "${work_dir}/skipped.md" ]; then
    echo "### Skipped"
    cat "${work_dir}/skipped.md"
    echo
  fi
  echo "### Notes"
  echo "- Reviewed ${pr_count} Dependabot GitHub Actions PR(s)."
  echo "- Dry run: ${dry_run}."
  echo "- Copilot risk scan status: ${copilot_status}."
  if [ -s "${work_dir}/notes.md" ]; then
    sed 's/^/- /' "${work_dir}/notes.md"
  else
    echo "- None."
  fi
} > "${report_path}"

cat "${report_path}"
