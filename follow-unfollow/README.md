# Odoo-FollowUnfollow-Override

## What it does

This extension restores a clear **Follow / Unfollow** button in Odoo's chatter.

Recent versions of Odoo removed the explicit follow/unfollow button, leaving only a followers icon that opens a dropdown. This extension watches for the followers button and injects a dedicated toggle button next to it:

- Shows **"Follow"** when you are not following the record.
- Shows **"Following"** (green) when you are already following it.
- On hover while following, the label changes to **"Unfollow"** (orange) so the action is clear before you click.

Clicking the button performs the follow or unfollow action immediately by interacting with the underlying Odoo dropdown, then refreshes the button state to reflect the new status.

**Runs on:** `https://*.odoo.com/*`

**Chrome Web Store:** [Follow/Unfollow Button Restorer](https://chromewebstore.google.com/detail/followunfollow-button-res/gdlighppgedbmlmghejngdhckglmjell)
