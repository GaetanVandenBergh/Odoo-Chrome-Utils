# Odoo-Chrome-Utils

A collection of Chrome extensions that improve the day-to-day experience of working with Odoo.

---

## Extensions

### [assignme-equipment-now](assignme-equipment-now/README.md) — [Chrome Web Store](https://chromewebstore.google.com/detail/assign-me-an-equipment/pljacdemappalpigdfdlgeedadlimjdm)
Adds an **"Assign to me"** button on maintenance equipment form views. One click assigns you as the technician and sets today's date — no manual field editing required.

### [document-preview-print](document-preview-print/README.md) — [Chrome Web Store](https://chromewebstore.google.com/detail/odoopdfjs-style-override/eihddfiamgafpkbghkpodlnklbcldhkn)
Restores the **print buttons** in Odoo's embedded PDF.js viewer. Odoo hides these buttons by default; this extension overrides the stylesheet to make them visible and highlights them in goldenrod.

### [follow-unfollow](follow-unfollow/README.md) — [Chrome Web Store](https://chromewebstore.google.com/detail/followunfollow-button-res/gdlighppgedbmlmghejngdhckglmjell)
Restores a dedicated **Follow / Unfollow toggle button** in the Odoo chatter. Shows your current follow state and lets you toggle it with a single click, without navigating through the followers dropdown.

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
