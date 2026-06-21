# Odoo-Chrome-Utils

A collection of Chrome extensions that improve the day-to-day experience of working with Odoo.

---

## Extensions

### [assignme-equipment-now](assignme-equipment-now/README.md) — [Chrome Web Store](https://chromewebstore.google.com/detail/assign-me-an-equipment/pljacdemappalpigdfdlgeedadlimjdm)
Adds an **"Assign to me"** button on maintenance equipment form views. One click assigns you as the technician and sets today's date — no manual field editing required.

### [follow-unfollow](follow-unfollow/README.md) — [Chrome Web Store](https://chromewebstore.google.com/detail/followunfollow-button-res/gdlighppgedbmlmghejngdhckglmjell)
Restores a dedicated **Follow / Unfollow toggle button** in the Odoo chatter. Shows your current follow state and lets you toggle it with a single click, without navigating through the followers dropdown.

### [track_from_task](track_from_task/README.md) — Chrome Web Store (coming soon)
Adds a **"Create Track"** button to the `project.task` form that opens a pre-filled `event.track` creation dialog using values derived from the task.

- Project → Event mapping: map `project_id` to a default `event_id`.
- Task Tag → Event Tag mapping: map task tags to event tags when creating a track.
- Duration mapping: map task tag to a suggested duration (supports half-hour steps).
- Title regex rules: map title patterns to event tags.
- Description skip rules: patterns that blank the description when matched.
- Track-created tag: optionally add a configurable tag to the task when a track is created (also hides the button when present).

Settings are available in the extension Options page.

---

## Installing an Extension

Some extensions are published on the Chrome Web Store; use the store links above when available.

To load any extension locally from this repository:

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **"Load unpacked"**.
4. Select the folder of the extension you want to install (e.g. `assignme-equipment-now/`).
5. The extension will appear in the list and activate immediately.

To update an extension after making code changes, click the **refresh icon** on its card in `chrome://extensions`.

> Each extension must be loaded separately — repeat steps 3–4 for each folder.

---

## More Extensions

### [Joorney](https://chromewebstore.google.com/detail/joorney/mjbkdgpgjmmkmjbebpdhpcpoicbpjglb)
A broader Odoo productivity extension published on the Chrome Web Store. It bundles a wide range of features including an "Assign Me a task" button, server action code tooltips, pinned messages, context menus, Runbot utilities (automatic opening, impersonation, admin/debug mode), theme auto-switching, visual effects (stars, ambient, awesome loading), and user badge display. A good complement to the focused extensions in this repo.

## Outdated Extensions

### [document-preview-print](document-preview-print/README.md)
Fixed in Odoo standard: 17+ \
Restores the **print buttons** in Odoo's embedded PDF.js viewer. Odoo hides these buttons by default; this extension overrides the stylesheet to make them visible and highlights them in goldenrod.
