#!/bin/bash
#
# bump-package-and-install.sh — Bump version → push → build & install
#
# Chains bump-package-version.sh (which prompts for version + commits),
# then pushes the commit, then runs the install script.
#
# Usage:
#   ./user-scripts/bump-package-and-install.sh           # interactive — prompts for version
#   ./user-scripts/bump-package-and-install.sh 0.2.0     # explicit version, non-interactive
#

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# -- Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
die()   { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

echo -e "${CYAN}━━━ Bump → Push → Install ━━━${NC}"
echo

# ── Step 1: Bump version (handles its own prompt + commit) ──────
info "Step 1/3 — Bumping version..."
"$REPO_DIR/user-scripts/bump-package-version.sh" "${1:-}"
echo

# ── Step 2: Push the commit ─────────────────────────────────────
info "Step 2/3 — Pushing to origin..."
cd "$REPO_DIR"
CURRENT_BRANCH="$(git branch --show-current)"
git push origin "$CURRENT_BRANCH"
echo

# ── Step 3: Build and install ───────────────────────────────────
info "Step 3/3 — Installing locally..."
"$REPO_DIR/user-scripts/install-local.sh"

echo
echo -e "${GREEN}━━━ All done — version bumped, pushed, and installed. ━━━${NC}"
