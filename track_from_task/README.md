# Track From Task

## What it does

A small Chrome extension that adds a "Create Track" button to the `project.task` form and helps creating `event.track` records from task data.

Features
- Project → Event mapping: map task projects to default event IDs.
- Task Tag → Event Tag mapping: create linked event tags when creating tracks.
- Duration mapping: suggest durations per task tag (supports 0, 0.5, 1, ... 4).
- Title regex rules: add event tags based on task title regular expressions.
- Description skip rules: list of regexes which, when matched, will blank the description in the created track.
- Track-created tag: optionally add a tag to the task after creating a track; when present the "Create Track" button is hidden.

## Options
Open the extension Options page to configure per-host mappings and rules. Settings are stored using `chrome.storage.sync` under the key `tft_hosts`.

**Runs on:** `https://*.odoo.com/*`
