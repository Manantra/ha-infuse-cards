> [!IMPORTANT]
> **Migration bridge v0.1.4 — the final update of the separate cards package.** Both cards are now included with [Infuse Now Playing](https://github.com/Manantra/ha-infuse) v0.2.11+. **Existing users should update this old cards package to v0.1.4**: its JavaScript now automatically loads the up-to-date cards from the installed integration. If the integration hasn't been upgraded yet, the bridge falls back to the original cards so existing dashboards remain functional. No dashboard YAML changes are needed. **This is not a new standalone card release**; future features and fixes are shipped through the Infuse integration only.
>
> To fully finish the transition, uninstall the separate cards plugin and remove its old dashboard resource, then reload the integration. This cleanup is deliberately not automated, because HACS/Marketplace owns the plugin and its resource registration. See [migration steps](https://github.com/Manantra/ha-infuse#migrating-from-the-former-separate-cards-repository). For **new installations**, install only `Manantra/ha-infuse` from the HACS / Marketplace integration catalog.

# Infuse Dashboard Cards

Optional, read-only custom dashboard cards for the [Infuse Now Playing Home Assistant integration](https://github.com/Manantra/ha-infuse).

## Preview

These are **screenshots of the real dashboard card JavaScript**, rendered with fictional example media and original illustrated placeholder artwork. They are not taken from a user's Home Assistant installation.

### Single-device card

<img src="https://raw.githubusercontent.com/Manantra/ha-infuse-cards/main/assets/previews/single-device.png" alt="Infuse single-device dashboard card showing a paused TV episode, series title, progress bar, remaining time and three optional status tiles" width="540">

*`custom:infuse-now-playing-card` — paused playback, artwork, title and configurable information tiles.*

### Multiple devices

<img src="https://raw.githubusercontent.com/Manantra/ha-infuse-cards/main/assets/previews/multiple-devices.png" alt="Infuse household dashboard card showing three Apple TV devices, one playing, one paused and one idle, with posters and progress bars" width="780">

*`custom:infuse-household-card` — multiple independent Infuse devices in one dashboard.*

<details>
<summary>How the preview images were created</summary>

The [HTML preview fixture](tests/preview-fixture.html) loads the actual distributed card JavaScript and supplies sample Home Assistant states. The sample series, titles and poster illustrations are fictional. The screenshots were taken in headless Chrome at 2× scale. To regenerate them, run `./scripts/generate-previews.sh` from the repository root with Chrome or Chromium installed.

</details>

### Existing users: how the bridge works

1. Update the **Infuse Now Playing integration** to v0.2.11 or newer and restart Home Assistant.
2. Update the existing separate **Infuse Dashboard Cards** plugin to **v0.1.4**. Its existing `/hacsfiles/ha-infuse-cards/...` or `/local/community/ha-infuse-cards/...` resource still loads, but the new bridge imports the up-to-date cards from `/api/infuse/cards/infuse-dashboard-cards.js`.
3. Refresh your browser/app frontend. **Your existing dashboards now run the cards shipped with the integration**, even while the old plugin is still installed. Updating the Infuse integration delivers new card features without future releases from this legacy repository.
4. **Optional but recommended cleanup:** uninstall the old cards plugin in HACS/Marketplace, remove any leftover old card resource registrations in Settings → Dashboards → Resources, then reload the Infuse integration (or restart Home Assistant). The integration will now register the bundled resource itself. Do not remove any unrelated resources.

If the integration bundle is not available (e.g. an older integration version), the bridge continues to render the original two cards from its built-in fallback. In that case, upgrade the main integration to enable continuous card updates. This compatibility fallback does **not** override any newer card elements already registered.

**Automatic uninstall isn't safe:** HACS/Marketplace manages installed repositories and their JavaScript resource entries; this plugin cannot quietly remove its own installation or rewrite Home Assistant's stored dashboard configuration. The bridge deliberately only imports the integration's JavaScript and leaves your HACS/database state untouched.

For **new users**, do not add this repository as a custom HACS plugin. Search for **Infuse Now Playing** in the integration catalog and install that repository instead.

Both components are bundled in a single JavaScript module:

- `custom:infuse-now-playing-card`: single-device cover, title, state (including Paused), progress and optional status/progress/remaining tiles. Its visual editor includes a searchable media-player entity picker and switches for each tile.
- `custom:infuse-household-card`: overview of multiple Infuse devices with a visual editor for selecting, adding, removing and reordering players, renaming the dashboard card, and assigning optional external profile sensors to individual devices.

### Single-device card

```yaml
type: custom:infuse-now-playing-card
entity: media_player.apple_tv_infuse_player
title: Apple TV Wohnzimmer
show_status: true
show_progress: false
show_remaining: false
```

All three switches default to `true`; use the **visual card editor** to choose an entity and switch the optional bottom tiles on or off.

### Multiple devices

```yaml
type: custom:infuse-household-card
entities:
  - media_player.apple_tv_infuse_player
  - media_player.infuse_schlafzimmer
```

### Household card — visual editor

You no longer need to write an `entities` YAML list to set up the Household card. In Home Assistant, add **Infuse Household** to a dashboard or edit an existing instance and use the **visual editor**:

1. Enter an optional **card heading**.
2. Choose each Infuse player from Home Assistant's searchable **Media player** picker.
3. Use **Add a device** to include additional Apple TVs. The **↑ / ↓** controls adjust display order; **×** removes a player. At least one player must remain.
4. Optionally choose an **external profile sensor** for each player. Click/tap the **?** icon (or hover over it) to see what this option means and when it can be used. The sensor must already exist in Home Assistant and have the actual profile name as its state; Infuse's local Now Playing API does not expose the active profile. An Apple TV user is not necessarily the same as an Infuse profile. Leave it blank if you do not have a suitable sensor.

Previously configured YAML remains valid. The editor preserves other options and any external profile associations when devices are reordered, added or removed. Duplicate players are prevented. Media-player entities and playback history are unaffected by editor changes.

### Manual installation

New installs should instead use the [Infuse Now Playing integration](https://github.com/Manantra/ha-infuse), which bundles and registers both cards. This legacy package and its distribution file are provided for existing users and fallback compatibility only.

**Source and final release process:** the canonical integration repository is [Manantra/ha-infuse](https://github.com/Manantra/ha-infuse). The frozen JavaScript sources under `examples/www/` exist solely as a fallback for the migration bridge; they no longer receive feature updates. `scripts/build-migration-bridge.py` generates the final `dist/infuse-dashboard-cards.js`, which imports the bundled integration card and falls back only if the import is unavailable. Both existing card element names remain unchanged.
