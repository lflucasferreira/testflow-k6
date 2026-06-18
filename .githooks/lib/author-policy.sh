#!/usr/bin/env bash

ALLOWED_EMAIL="lucasferreiras@live.com"

author_policy_error() {
  echo "Git hook blocked: $1" >&2
  echo "Only commits authored by ${ALLOWED_EMAIL} with a single author are allowed." >&2
  exit 1
}

author_policy_check_email() {
  local email="$1"
  local context="$2"

  if [ -z "$email" ]; then
    author_policy_error "${context} email is not set."
  fi

  if [ "$email" != "$ALLOWED_EMAIL" ]; then
    author_policy_error "${context} email must be ${ALLOWED_EMAIL} (found: ${email})."
  fi
}

author_policy_check_message_file() {
  local file="$1"

  if grep -qiE '^co-authored-by:' "$file"; then
    author_policy_error "Commit message must not include Co-authored-by trailers."
  fi
}

author_policy_check_message_text() {
  local message="$1"

  if echo "$message" | grep -qiE '^co-authored-by:'; then
    author_policy_error "Commit must not include Co-authored-by trailers."
  fi
}

author_policy_check_commit() {
  local sha="$1"
  local author_email committer_email message

  author_email="$(git log -1 --format='%ae' "$sha")"
  committer_email="$(git log -1 --format='%ce' "$sha")"
  message="$(git log -1 --format='%B' "$sha")"

  author_policy_check_email "$author_email" "Author"
  author_policy_check_email "$committer_email" "Committer"
  author_policy_check_message_text "$message"
}
