# Dofus live capture companion.
#
# Stay in the game. Hover one HDV listing, press Ctrl+Alt+D, and this grabs the two
# calibrated screen regions (the price and the item tooltip), posts both to the
# app, and shows the verdict over the game.
#
# It reads pixels from your own screen when you press a key. It sends nothing to
# Dofus, reads no game memory, and automates no play.
#
# The hotkey plumbing is lifted from hdv-price-capture.ps1, which proved that a
# global hotkey fires while Dofus holds focus. What changed: it captures two
# regions instead of one, and it posts *images* rather than an OCR'd number, so
# the app's French model and constrained matcher do the reading.

param(
  # Left blank, the app is discovered by probing the usual dev ports. Nuxt moves
  # to another port when 3001 is busy, and a hardcoded URL turns that into a
  # baffling "could not reach the app".
  [string]$AppUrl = "",
  [int[]]$ProbePorts = @(3001, 3000, 3002, 3003, 3004),
  # Grabs one full-screen frame, hands it to the app's calibration UI, exits.
  [switch]$Calibrate,
  # Seconds to wait before the calibration shot, so you can alt-tab back to
  # Dofus and hover a listing first. Running it immediately would only ever
  # photograph this terminal.
  [int]$Delay = 8,
  # Capture key, combined with Ctrl+Alt. If it is already taken - by another
  # app, or by a companion window you left open - the next one in the list is
  # tried automatically.
  [string[]]$CaptureKeys = @('D', 'G', 'J', 'B', 'K'),
  # Prints the raw verdict payload for each capture.
  [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class DofusHotkey {
  [DllImport("user32.dll")]
  public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

  [DllImport("user32.dll")]
  public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

  [DllImport("user32.dll")]
  public static extern bool GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

  // PeekMessage rather than GetMessage, because GetMessage blocks inside native
  // code where PowerShell cannot deliver Ctrl+C — which left every stopped run
  // alive in the background, still holding its hotkey. That is why the capture
  // key kept sliding down the fallback list.
  [DllImport("user32.dll")]
  public static extern bool PeekMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax, uint wRemoveMsg);

  [DllImport("user32.dll")]
  public static extern bool TranslateMessage(ref MSG lpMsg);

  [DllImport("user32.dll")]
  public static extern IntPtr DispatchMessage(ref MSG lpMsg);

  [StructLayout(LayoutKind.Sequential)]
  public struct MSG {
    public IntPtr hwnd;
    public uint message;
    public UIntPtr wParam;
    public IntPtr lParam;
    public uint time;
    public int pt_x;
    public int pt_y;
  }
}
"@

# A toast that refuses activation at the Win32 level. Setting Enabled=false is
# not enough (and breaks ShowDialog outright) — the window has to tell Windows
# it does not want focus, or clicking near it would pull the user out of Dofus.
Add-Type -ReferencedAssemblies System.Windows.Forms, System.Drawing, System.ComponentModel.Primitives, System.Runtime @"
using System;
using System.Windows.Forms;

public class NoActivateToast : Form {
  private const int WS_EX_NOACTIVATE = 0x08000000;
  private const int WS_EX_TOOLWINDOW = 0x00000080;
  private const int WS_EX_TRANSPARENT = 0x00000020;

  protected override bool ShowWithoutActivation { get { return true; } }

  protected override CreateParams CreateParams {
    get {
      CreateParams cp = base.CreateParams;
      // NOACTIVATE keeps focus in the game, TRANSPARENT lets clicks fall
      // through to it, TOOLWINDOW keeps this out of Alt+Tab.
      cp.ExStyle |= WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW | WS_EX_TRANSPARENT;
      return cp;
    }
  }
}
"@

$CaptureHotkeyId = 9418
$QuitHotkeyId = 9419
$ModAlt = 0x0001
$ModControl = 0x0002
$VkD = 0x44
$VkQ = 0x51
$WmHotkey = 0x0312

function Convert-ImageToDataUrl {
  param([System.Drawing.Bitmap]$Bitmap)

  $stream = New-Object System.IO.MemoryStream
  try {
    $Bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $base64 = [Convert]::ToBase64String($stream.ToArray())
    return "data:image/png;base64,$base64"
  }
  finally {
    $stream.Dispose()
  }
}

function Capture-Rect {
  param([int]$Left, [int]$Top, [int]$W, [int]$H)

  if ($W -le 0 -or $H -le 0) {
    throw "Invalid capture region ($W x $H). Re-run with -Calibrate."
  }

  $bitmap = New-Object System.Drawing.Bitmap($W, $H)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    # GDI reads the composited desktop, so Dofus keeps focus. This is the step
    # that breaks under exclusive fullscreen - use borderless windowed.
    $graphics.CopyFromScreen($Left, $Top, 0, 0, $bitmap.Size)
    return $bitmap
  }
  finally {
    $graphics.Dispose()
  }
}

function Resolve-Region {
  param($Region, $Cursor)

  # Each axis independently. The HDV price lives in a fixed column on a moving
  # row, so X is absolute and Y follows the pointer - anchoring both to the
  # cursor slid the box off the price whenever you hovered the left of a row.
  $anchorX = if ($Region.PSObject.Properties.Name -contains 'anchorX') { $Region.anchorX } else { 'screen' }
  $anchorY = if ($Region.PSObject.Properties.Name -contains 'anchorY') { $Region.anchorY } else { 'cursor' }

  $left = if ($anchorX -eq 'cursor') { [int]$Cursor.X + [int]$Region.x } else { [int]$Region.x }
  $top = if ($anchorY -eq 'cursor') { [int]$Cursor.Y + [int]$Region.y } else { [int]$Region.y }

  # Clamp inside the desktop, or CopyFromScreen throws on a listing near an edge.
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $w = [int]$Region.width
  $h = [int]$Region.height
  $left = [Math]::Min([Math]::Max($left, $bounds.Left), $bounds.Right - $w)
  $top = [Math]::Min([Math]::Max($top, $bounds.Top), $bounds.Bottom - $h)

  return @{ Left = $left; Top = $top; W = $w; H = $h }
}

function Capture-FullScreen {
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  return Capture-Rect -Left $bounds.Left -Top $bounds.Top -W $bounds.Width -H $bounds.Height
}

function Find-AppUrl {
  # Probe for the capture endpoint specifically, not just an open socket: some
  # other dev server answering on 3000 must not be mistaken for this app.
  foreach ($port in $ProbePorts) {
    $candidate = "http://localhost:$port"
    try {
      Invoke-RestMethod -Uri "$candidate/api/capture/regions" -Method Get -TimeoutSec 3 | Out-Null
      return $candidate
    }
    catch {
      continue
    }
  }

  throw ("Could not find the app on ports {0}. Is 'pnpm dev' running? Pass -AppUrl http://localhost:PORT if it is elsewhere." -f ($ProbePorts -join ', '))
}

function Get-Regions {
  try {
    return Invoke-RestMethod -Uri "$AppUrl/api/capture/regions" -Method Get -TimeoutSec 10
  }
  catch {
    throw "Could not reach the app at $AppUrl. Is 'pnpm dev' still running?"
  }
}

function Invoke-Calibration {
  Write-Host ""
  Write-Host "Calibration" -ForegroundColor Cyan
  Write-Host "Switch to Dofus now, open the HDV and hover ONE listing so its tooltip shows."
  Write-Host ""

  for ($i = $Delay; $i -gt 0; $i--) {
    Write-Host ("`r  Capturing in {0}... " -f $i) -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 1
  }
  Write-Host "`r  Capturing now.        " -ForegroundColor Green

  # Record where the pointer was, so the boxes drawn over this frame become
  # offsets from the cursor rather than fixed screen coordinates.
  $cursor = [System.Windows.Forms.Cursor]::Position

  $bitmap = Capture-FullScreen
  try {
    $frame = Convert-ImageToDataUrl -Bitmap $bitmap
  }
  finally {
    $bitmap.Dispose()
  }

  $body = @{ frame = $frame; cursorX = $cursor.X; cursorY = $cursor.Y } | ConvertTo-Json -Depth 4 -Compress
  Invoke-RestMethod -Uri "$AppUrl/api/capture/frame" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30 | Out-Null

  Write-Host ""
  Write-Host "Frame sent." -ForegroundColor Green
  Write-Host "Now open the items page, expand 'Live capture', and drag two boxes:"
  Write-Host "  1. around the listing price"
  Write-Host "  2. around the item tooltip"
  Write-Host "Then run this script again without -Calibrate."
  Write-Host ""
}

function Show-Toast {
  param([string]$Headline, [string]$Detail, [System.Drawing.Color]$Accent)

  # A borderless TopMost form rather than a tray balloon: Windows 11 routes
  # balloons through the notification centre, where Focus Assist can silently
  # swallow them mid-session. A verdict you might not see is worse than none.
  # Critical: never take focus. Stealing it mid-HDV would be worse than the
  # alt-tab this whole thing exists to remove — hence NoActivateToast.
  $form = New-Object NoActivateToast
  $form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
  $form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
  $form.TopMost = $true
  $form.ShowInTaskbar = $false
  $form.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
  $form.Width = 300
  $form.Height = 64
  $form.Opacity = 0.92

  $stripe = New-Object System.Windows.Forms.Panel
  $stripe.BackColor = $Accent
  $stripe.Width = 5
  $stripe.Dock = [System.Windows.Forms.DockStyle]::Left
  $form.Controls.Add($stripe)

  $title = New-Object System.Windows.Forms.Label
  $title.Text = $Headline
  $title.ForeColor = $Accent
  $title.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
  $title.SetBounds(16, 6, 275, 24)
  $form.Controls.Add($title)

  $sub = New-Object System.Windows.Forms.Label
  $sub.Text = $Detail
  $sub.ForeColor = [System.Drawing.Color]::FromArgb(190, 190, 190)
  $sub.Font = New-Object System.Drawing.Font("Segoe UI", 9)
  $sub.SetBounds(16, 32, 275, 22)
  $form.Controls.Add($sub)

  # Near the cursor, so it lands where the eye already is — but clamped to the
  # screen so a listing near the edge doesn't push it off.
  $cursor = [System.Windows.Forms.Cursor]::Position
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  $x = [Math]::Min([Math]::Max($cursor.X + 24, $bounds.Left), $bounds.Right - $form.Width)
  $y = [Math]::Min([Math]::Max($cursor.Y + 24, $bounds.Top), $bounds.Bottom - $form.Height)
  $form.Location = New-Object System.Drawing.Point($x, $y)

  # Show() rather than ShowDialog(): a modal dialog would demand activation,
  # which is exactly what must not happen. Pump messages by hand for the two
  # seconds it is up, which also stops captures from overlapping.
  $form.Show()

  $deadline = (Get-Date).AddMilliseconds(2000)
  while ((Get-Date) -lt $deadline) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 30
  }

  $form.Close()
  $form.Dispose()
}

function Show-Verdict {
  param([string]$Headline, [string]$Detail, [bool]$IsDeal, [bool]$IsError)

  $color = if ($IsError) { "Yellow" } elseif ($IsDeal) { "Green" } else { "DarkGray" }
  Write-Host ("  {0}  {1}" -f $Headline, $Detail) -ForegroundColor $color

  $accent = if ($IsError) {
    [System.Drawing.Color]::FromArgb(230, 180, 80)
  } elseif ($IsDeal) {
    [System.Drawing.Color]::FromArgb(90, 210, 130)
  } else {
    [System.Drawing.Color]::FromArgb(150, 150, 150)
  }

  try {
    Show-Toast -Headline $Headline -Detail $Detail -Accent $accent
  }
  catch {
    # The console line already carried the verdict; a toast failure must not
    # take the capture down with it.
    Write-Host "  (toast failed: $($_.Exception.Message))" -ForegroundColor DarkGray
  }
}

function Submit-Capture {
  # The whole screen plus where the pointer was. No regions, no calibration:
  # the app finds the price on the row you are pointing at and the tooltip
  # beside it, which is something it can *see* and the companion cannot.
  $cursor = [System.Windows.Forms.Cursor]::Position

  $bitmap = Capture-FullScreen
  try {
    $frame = Convert-ImageToDataUrl -Bitmap $bitmap
  }
  finally {
    $bitmap.Dispose()
  }

  $body = @{ frame = $frame; cursorX = $cursor.X; cursorY = $cursor.Y } | ConvertTo-Json -Depth 4 -Compress

  try {
    $submitted = Invoke-RestMethod -Uri "$AppUrl/api/capture" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
  }
  catch {
    # 409 means nothing is open in the app, which is worth saying plainly
    # rather than as a raw HTTP error.
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 409) {
      Show-Verdict -Headline "NO ITEM" -Detail "Open an item in the app first" -IsDeal $false -IsError $true
    }
    else {
      Show-Verdict -Headline "FAILED" -Detail $_.Exception.Message -IsDeal $false -IsError $true
    }
    return
  }

  Wait-Verdict -CaptureId $submitted.id -ItemName $submitted.itemName
}

function Wait-Verdict {
  param([string]$CaptureId, [string]$ItemName)

  # The browser has to poll, OCR two crops and value the listing. A few seconds
  # is generous; past that something is wrong and saying so beats hanging.
  $deadline = (Get-Date).AddSeconds(8)

  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250

    try {
      $entry = Invoke-RestMethod -Uri "$AppUrl/api/capture/$CaptureId" -Method Get -TimeoutSec 10
    }
    catch {
      continue
    }

    if ($entry.status -eq "failed") {
      Show-Verdict -Headline "UNREAD" -Detail $entry.error -IsDeal $false -IsError $true
      return
    }

    if ($entry.verdict) {
      if ($Verbose) { Write-Host ("  raw: " + ($entry.verdict | ConvertTo-Json -Compress)) -ForegroundColor DarkGray }
      Show-Verdict -Headline $entry.verdict.headline -Detail $entry.verdict.detail -IsDeal $entry.verdict.isDeal -IsError $false
      return
    }
  }

  Show-Verdict -Headline "NO ANSWER" -Detail "Is the items page open and Live capture armed?" -IsDeal $false -IsError $true
}

if (-not $AppUrl) {
  $AppUrl = Find-AppUrl
}

if ($Calibrate) {
  Invoke-Calibration
  return
}

Write-Host ""
Write-Host "Dofus live capture companion" -ForegroundColor Cyan
Write-Host "App:      $AppUrl"
Write-Host "Aim:      point at any row - the app finds the price and the tooltip"
# Take the first key that is actually free. A hotkey can be held by another app
# or by a companion window left open from an earlier run, and making the user
# hunt for the culprit is a poor trade against simply using another key.
$captureKey = ''
foreach ($key in $CaptureKeys) {
  $vk = [int][char]::ToUpper($key[0])
  if ([DofusHotkey]::RegisterHotKey([IntPtr]::Zero, $CaptureHotkeyId, ($ModControl -bor $ModAlt), $vk)) {
    $captureKey = [char]::ToUpper($key[0])
    break
  }
}

if (-not $captureKey) {
  throw ("Every capture key is taken (tried {0}). Close any other companion window, or pass -CaptureKeys M" -f ($CaptureKeys -join ', '))
}

$quitRegistered = [DofusHotkey]::RegisterHotKey([IntPtr]::Zero, $QuitHotkeyId, ($ModControl -bor $ModAlt), $VkQ)

Write-Host ("Capture:  Ctrl+Alt+{0}" -f $captureKey) -ForegroundColor Green
if ($quitRegistered) {
  Write-Host "Quit:     Ctrl+Alt+Q (or close this window)"
}
else {
  # Not worth failing over - closing the window still stops it.
  Write-Host "Quit:     close this window (Ctrl+Alt+Q was taken)" -ForegroundColor Yellow
}
Write-Host ""

$PM_REMOVE = 0x0001
$running = $true

# Ctrl+C has to be handled rather than left to PowerShell, because the loop below
# spends its life in native calls. Treating it as input lets the loop notice it
# and fall through to the cleanup in `finally`.
[Console]::TreatControlCAsInput = $true

try {
  $count = 0
  $msg = New-Object DofusHotkey+MSG

  while ($running) {
    # Drain whatever is queued, then idle briefly. Polling rather than blocking
    # is what makes the window closeable: 30ms costs nothing and keeps Ctrl+C
    # responsive, where GetMessage would sit in native code ignoring it.
    while ([DofusHotkey]::PeekMessage([ref]$msg, [IntPtr]::Zero, 0, 0, $PM_REMOVE)) {
      if ($msg.message -eq $WmHotkey) {
        $id = $msg.wParam.ToUInt32()

        if ($id -eq $QuitHotkeyId) {
          $running = $false
          break
        }

        if ($id -eq $CaptureHotkeyId) {
          $count = $count + 1
          Write-Host ("[{0}] {1}" -f $count, (Get-Date -Format "HH:mm:ss"))

          try {
            Submit-Capture
          }
          catch {
            Show-Verdict -Headline "FAILED" -Detail $_.Exception.Message -IsDeal $false -IsError $true
          }
          continue
        }
      }

      [void][DofusHotkey]::TranslateMessage([ref]$msg)
      [void][DofusHotkey]::DispatchMessage([ref]$msg)
    }

    if (-not $running) { break }

    if ([Console]::KeyAvailable) {
      $pressed = [Console]::ReadKey($true)
      if ($pressed.Key -eq 'C' -and ($pressed.Modifiers -band [ConsoleModifiers]::Control)) {
        $running = $false
        break
      }
    }

    Start-Sleep -Milliseconds 30
  }

  Write-Host ""
  Write-Host "Stopping. $count captures this session." -ForegroundColor Cyan
}
finally {
  [Console]::TreatControlCAsInput = $false
  [void][DofusHotkey]::UnregisterHotKey([IntPtr]::Zero, $CaptureHotkeyId)
  if ($quitRegistered) {
    [void][DofusHotkey]::UnregisterHotKey([IntPtr]::Zero, $QuitHotkeyId)
  }
}
