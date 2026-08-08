# HDV Price Capture

This is an experimental helper for the `/kamas` page.

The app chooses the item. The PowerShell companion captures the visible HDV price with `Ctrl+Alt+P`, OCRs the screenshot through the app, and sends the detected price back to the `/kamas` inbox.

## Start

1. Start the app:

```powershell
pnpm run dev
```

2. Open:

```text
http://localhost:3001/kamas
```

3. In the HDV scanner queue panel, click `Build queue`.

4. Copy/search the current item in Dofus.

5. Start the companion script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\hdv-price-capture.ps1 -X 1200 -Y 420 -Width 220 -Height 80
```

6. When the HDV price is visible, press:

```text
Ctrl + Alt + P
```

7. Go back to `/kamas`, accept the detected price, and the queue moves to the next item.

## Calibration

The script needs a screen rectangle around the HDV price number.

The parameters are:

```text
-X      left edge of the screenshot rectangle
-Y      top edge of the screenshot rectangle
-Width  screenshot width
-Height screenshot height
```

Start with a wider crop around the price, then make it tighter if OCR is noisy.

Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\hdv-price-capture.ps1 -X 1100 -Y 350 -Width 360 -Height 180
```

If you are unsure, try full-screen once:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\hdv-price-capture.ps1 -CaptureFullScreen
```

Full-screen is slower and less accurate, but it can prove the connection works.

## Notes

- The app must be running because the script calls `http://localhost:3001/api/ocr/hdv-prices`.
- The current item must be armed from `/kamas`; otherwise the script does not know which item the price belongs to.
- Accepted prices are saved into the existing familiar/resource price stores.
- This does not read Dofus memory, automate clicks, or interact with the game client. It only screenshots your screen when you press the hotkey.

