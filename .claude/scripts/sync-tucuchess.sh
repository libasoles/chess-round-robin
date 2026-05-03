#!/usr/bin/env bash
# Syncs tucuchess branch with main after a push to main.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

CURRENT_BRANCH="$(git symbolic-ref --short HEAD)"

# Only run when on main and the push targeted main
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  exit 0
fi

echo "→ Syncing tucuchess with main..."

git fetch origin main --quiet

git checkout tucuchess --quiet
git rebase origin/main --quiet

CONFLICTS="$(git status --porcelain | grep -c '^[ADMU][ADMU]' || true)"
if [[ "$CONFLICTS" -gt 0 ]]; then
  echo "Merge conflicts detected. Aborting rebase."
  git rebase --abort
  git checkout main --quiet
  exit 1
fi

git push origin tucuchess --quiet
echo "✓ tucuchess is up to date with main."

git checkout main --quiet
