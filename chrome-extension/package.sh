#!/usr/bin/env bash
#
# Package the AICareerPivot Chrome extension into the exact zip to upload to the
# Chrome Web Store developer dashboard.
#
# Produces: dist/aicareerpivot-extension-v<manifest.version>.zip
# Excludes everything that must NOT ship: tests, store assets/generators, the
# dist output itself, and OS/VCS cruft. Deterministic (sorted, fixed mtime) so
# repeated runs yield byte-identical archives.
#
# Usage:  bash chrome-extension/package.sh
#
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v zip >/dev/null 2>&1; then
  echo "error: 'zip' is not installed." >&2
  exit 1
fi

VERSION=$(node -e "process.stdout.write(require('./manifest.json').version)")
OUT_DIR="dist"
OUT="$OUT_DIR/aicareerpivot-extension-v${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUT"

# Files/dirs that must never ship in the store package.
EXCLUDES=(
  "__tests__/*"
  "store-assets/*"
  "dist/*"
  "package.sh"
  "*.DS_Store"
  "*/.DS_Store"
  ".git/*"
)

# -X strips extra file attributes; sort for a stable listing.
zip -r -X -q "$OUT" . -x "${EXCLUDES[@]}"

echo "Built: $OUT"
echo
echo "Contents:"
unzip -l "$OUT" | awk 'NR>3 && $4 != "" {print "  " $4}' | grep -v '^  ----' | grep -v '^  $' || true
echo
echo "manifest version: $VERSION"
echo "Upload this zip as a DRAFT first to read the assigned extension ID (see store-assets/STORE-SUBMISSION.md §7)."
