#!/usr/bin/env bash
set -euo pipefail

parse_build_args() {
  local build_args_input=$1
  local release_version=$2
  local branch_name=$3
  local github_output=$4
  local build_args_temp
  local line
  local -a build_args_lines=()

  shopt -u patsub_replacement 2>/dev/null || true
  build_args_temp=$(printf '%s' "${build_args_input}" | tr ',' '\n')

  while IFS= read -r line; do
    line=${line//\{\{version\}\}/${release_version}}
    line=${line//\{\{branch\}\}/${branch_name}}
    build_args_lines+=("$line")
  done <<< "$build_args_temp"

  {
    printf 'build_args<<EOF\n'
    printf '%s\n' "${build_args_lines[@]}"
    printf 'EOF\n'
  } >> "$github_output"
}

assert_branch_placeholders() {
  local branch_name=$1
  local output_file
  local expected_file

  output_file=$(mktemp)
  expected_file=$(mktemp)
  trap 'rm -f "$output_file" "$expected_file"' RETURN

  parse_build_args \
    'VERSION={{version}},BRANCH={{branch}},MIX={{branch}}-{{version}}' \
    '1.2.3' \
    "$branch_name" \
    "$output_file"

  {
    printf 'build_args<<EOF\n'
    printf 'VERSION=1.2.3\n'
    printf 'BRANCH=%s\n' "$branch_name"
    printf 'MIX=%s-1.2.3\n' "$branch_name"
    printf 'EOF\n'
  } > "$expected_file"

  diff -u "$expected_file" "$output_file"
}

assert_branch_placeholders 'fix/foo'
assert_branch_placeholders 'feature/abc-123'
assert_branch_placeholders 'dependabot/npm_and_yarn/lib/firebase/axios-1.16.0'
assert_branch_placeholders 'release/foo&bar'

echo "docker-ops build arg placeholder tests passed"
