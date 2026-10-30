# FIXED v7 — Open provider as a browser tab

Changed the Enable remote channel tab action to use `window.open` without popup window features. This asks the browser to create a normal tab (usually next to the current tab) instead of a separate popup window. The browser still controls exact tab placement and may reuse an existing tab with the same target name.
