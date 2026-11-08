#!/usr/bin/env bash
# Render real dashboard cards with fictional test data in headless Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n "${CHROME_BIN:-}" ]]; then
  chrome="$CHROME_BIN"
elif command -v google-chrome >/dev/null 2>&1; then
  chrome="$(command -v google-chrome)"
elif command -v chromium >/dev/null 2>&1; then
  chrome="$(command -v chromium)"
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
  echo "Chrome/Chromium not found. Set CHROME_BIN to the browser executable." >&2
  exit 1
fi
mkdir -p assets/previews
base="file://$PWD/tests/preview-fixture.html"
profile_dir="$(mktemp -d)"
trap 'rm -rf "$profile_dir"' EXIT
"$chrome" --headless --disable-gpu --hide-scrollbars --no-first-run \
  --no-default-browser-check --allow-file-access-from-files \
  --user-data-dir="$profile_dir/single" --window-size=540,480 \
  --force-device-scale-factor=2 --screenshot="$PWD/assets/previews/single-device.png" \
  "$base?view=single" >/dev/null 2>&1
"$chrome" --headless --disable-gpu --hide-scrollbars --no-first-run \
  --no-default-browser-check --allow-file-access-from-files \
  --user-data-dir="$profile_dir/multiple" --window-size=780,555 \
  --force-device-scale-factor=2 --screenshot="$PWD/assets/previews/multiple-devices.png" \
  "$base?view=household" >/dev/null 2>&1
printf "Previews written to assets/previews/\n"
