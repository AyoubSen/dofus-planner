# Live capture

Snipe without leaving Dofus. Hover one listing, press `Ctrl+Alt+D`, and a verdict
appears over the game — `DEAL +420k` or `SKIP · Dommages 12/20`. The browser does
the reading and the valuing, but you never look at it during a session.

This reads pixels from your own screen when you press a key. It sends nothing to
Dofus, reads no game memory, and automates no play.

## Requirements

- **Dofus in borderless windowed**, not exclusive fullscreen. GDI screen capture
  returns black frames under exclusive fullscreen.
- The app running (`pnpm dev`) with the items page open on the item you're
  sniping.

## Setup

None. Point at a listing and press the key — the app takes the whole screen plus
where your pointer was, reads a full-width band across the row you are pointing
at to find the price, and takes the area beside the pointer for the tooltip.

There is no calibration because there is nothing to calibrate: the price is
found by looking for a price-shaped number on your row, not by remembering which
column it sat in. Move the Dofus window, change resolution, scroll the list —
none of it matters.

## Each session

```powershell
pnpm capture
```

Then in the app, click **Start capturing**. Now stay in the game:

| Key | What it does |
|---|---|
| `Ctrl+Alt+D` | Capture the listing you're pointing at, and show its verdict |
| `Ctrl+Alt+Q` | Stop the companion |

If another app already holds `Ctrl+Alt+D`, the companion falls back to the next
free key (G, J, B, K) and prints which one it took at startup — always read the
`Capture:` line rather than assuming D. Force a specific key with
`-CaptureKeys M`.

Each press captures both regions, posts them to the app, and waits for the
verdict. One press = one complete observation with price *and* stats, valued
against everything else you've captured for that item.

Switching item in the app re-arms automatically; captures follow whatever is
open.

## What the verdicts mean

| Headline | Meaning |
|---|---|
| `DEAL +420k` | Net profit after the HDV tax, and it beats the segment's own price scatter |
| `SKIP` | Either fails a stat requirement you set, or is not cheap enough to be worth it |
| `SAVED` | Recorded, but not enough comparable listings yet to value it |
| `NO ITEM` | Nothing armed — open an item in the app |
| `UNREAD` | The capture could not be read; check the region calibration |
| `NO ANSWER` | The app didn't reply — is the items page open and armed? |

Verdicts also land in the Live capture card, so one missed behind the game is
still recoverable.

## How it fits together

```
Dofus            companion (PowerShell)     app (browser)
─────            ──────────────────────     ─────────────
hover a listing
Ctrl+Alt+D  →    grab 2 regions
                 POST /api/capture     →    queued
                                            poll (500ms) drains it
                                            price OCR + stats OCR (French model)
                                            observation created and valued
                 ←──── verdict ─────────    POST verdict
toast   ←        no-focus TopMost strip
```

The companion posts **images**, not text: the French recognizer and the
constrained stat matcher live in the browser, and duplicating them in PowerShell
would mean two implementations drifting apart.

## Related

`hdv-price-capture.md` covers the older `Ctrl+Alt+P` companion for `/kamas`,
which still works and is unaffected by this.
