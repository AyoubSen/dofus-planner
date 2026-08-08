param(
  [string]$AppUrl = "http://localhost:3001",
  [int]$X = 0,
  [int]$Y = 0,
  [int]$Width = 260,
  [int]$Height = 90,
  [switch]$CaptureFullScreen
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class HdvHotkey {
  [DllImport("user32.dll")]
  public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

  [DllImport("user32.dll")]
  public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

  [DllImport("user32.dll")]
  public static extern bool GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

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

$HotkeyId = 9417
$ModAlt = 0x0001
$ModControl = 0x0002
$VkP = 0x50
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

function Capture-Region {
  if ($CaptureFullScreen) {
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $left = $bounds.Left
    $top = $bounds.Top
    $w = $bounds.Width
    $h = $bounds.Height
  }
  else {
    $left = $X
    $top = $Y
    $w = $Width
    $h = $Height
  }

  if ($w -le 0 -or $h -le 0) {
    throw "Invalid capture region. Width and Height must be greater than 0."
  }

  $bitmap = New-Object System.Drawing.Bitmap($w, $h)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($left, $top, 0, 0, $bitmap.Size)
    return $bitmap
  }
  finally {
    $graphics.Dispose()
  }
}

function Submit-Capture {
  Write-Host "Capturing HDV price region..."
  $bitmap = Capture-Region
  try {
    $imageBase64 = Convert-ImageToDataUrl -Bitmap $bitmap
  }
  finally {
    $bitmap.Dispose()
  }

  $ocrBody = @{ imageBase64 = $imageBase64 } | ConvertTo-Json -Depth 4
  $ocr = Invoke-RestMethod -Uri "$AppUrl/api/ocr/hdv-prices" -Method Post -ContentType "application/json" -Body $ocrBody

  $candidates = @($ocr.candidates)
  if (-not $candidates -or $candidates.Count -eq 0) {
    Write-Host "No price detected. Try a tighter crop around the price number." -ForegroundColor Yellow
    return
  }

  $price = ($candidates | Sort-Object -Descending | Select-Object -First 1)
  $confidence = if ($candidates.Count -eq 1) { "high" } else { "medium" }

  $resultBody = @{
    price = [int]$price
    candidates = @($candidates | ForEach-Object { [int]$_ })
    confidence = $confidence
    source = "hotkey-region"
  } | ConvertTo-Json -Depth 4

  $result = Invoke-RestMethod -Uri "$AppUrl/api/hdv-scan/results" -Method Post -ContentType "application/json" -Body $resultBody
  Write-Host "Detected $($result.itemName): $($result.price) k" -ForegroundColor Green
}

Write-Host ""
Write-Host "HDV price capture companion"
Write-Host "App: $AppUrl"
if ($CaptureFullScreen) {
  Write-Host "Capture: full primary screen"
}
else {
  Write-Host "Capture: X=$X Y=$Y Width=$Width Height=$Height"
}
Write-Host "Hotkey: Ctrl+Alt+P"
Write-Host "Stop: close this PowerShell window or press Ctrl+C"
Write-Host ""

if (-not [HdvHotkey]::RegisterHotKey([IntPtr]::Zero, $HotkeyId, ($ModControl -bor $ModAlt), $VkP)) {
  throw "Could not register Ctrl+Alt+P. Another app may already be using it."
}

try {
  $msg = New-Object HdvHotkey+MSG
  while ([HdvHotkey]::GetMessage([ref]$msg, [IntPtr]::Zero, 0, 0)) {
    if ($msg.message -eq $WmHotkey -and $msg.wParam.ToUInt32() -eq $HotkeyId) {
      try {
        Submit-Capture
      }
      catch {
        Write-Host "Capture failed: $($_.Exception.Message)" -ForegroundColor Red
      }
      continue
    }

    [void][HdvHotkey]::TranslateMessage([ref]$msg)
    [void][HdvHotkey]::DispatchMessage([ref]$msg)
  }
}
finally {
  [void][HdvHotkey]::UnregisterHotKey([IntPtr]::Zero, $HotkeyId)
}

