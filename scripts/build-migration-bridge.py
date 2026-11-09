#!/usr/bin/env python3
"""Build the final legacy HACS bridge with an offline-compatible card fallback.

The original cards are intentionally frozen here. New card development is in
Manantra/ha-infuse custom_components/infuse/www/; this old plugin simply imports
that bundled module, while falling back to the old cards if it is unavailable.
"""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FALLBACK_FILES = (
    ROOT / "examples/www/infuse-now-playing-card.js",
    ROOT / "examples/www/infuse-household-card.js",
)
OUTPUT = ROOT / "dist/infuse-dashboard-cards.js"
BUNDLED_URL = "/api/infuse/cards/infuse-dashboard-cards.js"

PREAMBLE = f'''/*
 * Infuse Dashboard Cards: final legacy HACS migration bridge (v0.1.4).
 * Both cards now ship with the Infuse Now Playing integration (v0.2.11+).
 * This legacy resource dynamically loads the bundled integration version.
 * Old local cards are used ONLY if the integration's card URL is unavailable.
 * Do not register another resource, delete HACS entries or modify dashboards.
 */
try {{
  await import("{BUNDLED_URL}");
}} catch (error) {{
  console.warn("[Infuse Cards] Bundled cards unavailable; using the legacy fallback. " +
    "Update Infuse Now Playing to v0.2.11+ to receive card updates with the integration.", error);
'''
POSTAMBLE = '\n}\n'


def build() -> str:
    return PREAMBLE + ''.join(p.read_text() for p in FALLBACK_FILES) + POSTAMBLE


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail unless the distributed bundle is current")
    args = parser.parse_args()
    expected = build()
    if args.check:
        assert OUTPUT.read_text() == expected, "dist bundle is stale: rebuild the migration bridge"
        print("Legacy migration bridge matches the frozen fallback sources")
    else:
        OUTPUT.write_text(expected)
        print(f"Wrote {OUTPUT} ({len(expected)} characters)")
