# Odoo-PDFJS-Override

## What it does

This extension restores the **print buttons** in Odoo's embedded PDF.js document viewer.

Odoo's default stylesheet hides the native PDF.js print buttons (`#printButton`, `#secondaryPrint`). This extension detects that style tag and injects a CSS override that forces the buttons to be visible and colors them **goldenrod** so they stand out. The override is applied on page load and re-applied dynamically whenever new style tags are added to the page.

**Runs on:** `https://*.odoo.com/*` (all frames, including embedded iframes)

**Chrome Web Store:** [Odoo/PDF.js Style Override](https://chromewebstore.google.com/detail/odoopdfjs-style-override/eihddfiamgafpkbghkpodlnklbcldhkn)
