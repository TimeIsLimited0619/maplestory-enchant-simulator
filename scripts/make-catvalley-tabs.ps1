Add-Type -AssemblyName System.Drawing

# 「貓谷」 as char codes to avoid script encoding issues
$label = [string]::new(@([char]0x8C93, [char]0x8C37))

function New-CatValleyTab {
  param(
    [string]$SourcePath,
    [string]$DestPath,
    [System.Drawing.Color]$TextColor,
    [bool]$Glow = $false
  )

  $src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $SourcePath))
  $bmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.DrawImage($src, 0, 0, $src.Width, $src.Height)

  # Cover icon + original text; redraw centered label
  $coverX = [int]($src.Width * 0.08)
  $coverY = [int]($src.Height * 0.16)
  $coverW = [int]($src.Width * 0.84)
  $coverH = [int]($src.Height * 0.68)

  # Sample several pixels for a more natural fill
  $colors = @()
  foreach ($sx in 0.35, 0.50, 0.65) {
    foreach ($sy in 0.40, 0.50, 0.60) {
      $px = [Math]::Min($src.Width - 1, [int]($src.Width * $sx))
      $py = [Math]::Min($src.Height - 1, [int]($src.Height * $sy))
      $colors += $src.GetPixel($px, $py)
    }
  }
  $avgR = [int](($colors | ForEach-Object { $_.R } | Measure-Object -Average).Average)
  $avgG = [int](($colors | ForEach-Object { $_.G } | Measure-Object -Average).Average)
  $avgB = [int](($colors | ForEach-Object { $_.B } | Measure-Object -Average).Average)
  $bg = [System.Drawing.Color]::FromArgb(255, $avgR, $avgG, $avgB)
  $brush = New-Object System.Drawing.SolidBrush $bg
  $g.FillRectangle($brush, $coverX, $coverY, $coverW, $coverH)
  $brush.Dispose()

  $fontSize = [Math]::Max(13.0, $src.Height * 0.42)
  $font = New-Object System.Drawing.Font 'Microsoft JhengHei UI', $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF 0, 1, $src.Width, ($src.Height - 2)

  if ($Glow) {
    $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 255, 255, 255))
    foreach ($ox in -1, 0, 1) {
      foreach ($oy in -1, 0, 1) {
        if ($ox -eq 0 -and $oy -eq 0) { continue }
        $r = New-Object System.Drawing.RectangleF ($rect.X + $ox), ($rect.Y + $oy), $rect.Width, $rect.Height
        $g.DrawString($label, $font, $glowBrush, $r, $sf)
      }
    }
    $glowBrush.Dispose()
  }

  $textBrush = New-Object System.Drawing.SolidBrush $TextColor
  $g.DrawString($label, $font, $textBrush, $rect, $sf)
  $textBrush.Dispose()
  $font.Dispose()
  $sf.Dispose()
  $g.Dispose()
  $src.Dispose()

  $dir = Split-Path $DestPath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("wrote " + $DestPath + " label=" + $label)
}

$outDir = 'images/tabbutton'
New-CatValleyTab 'images/tabbutton/exceptional_tab_normal.png'   "$outDir/catValley_tab_normal.png"   ([System.Drawing.Color]::FromArgb(255, 245, 248, 252)) $false
New-CatValleyTab 'images/tabbutton/exceptional_tab_mouseOver.png' "$outDir/catValley_tab_mouseOver.png" ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)) $true
New-CatValleyTab 'images/tabbutton/exceptional_tab_pressed.png'  "$outDir/catValley_tab_pressed.png"  ([System.Drawing.Color]::FromArgb(255, 235, 240, 245)) $false
New-CatValleyTab 'images/tabbutton/exceptional_tab_disabled.png' "$outDir/catValley_tab_disabled.png" ([System.Drawing.Color]::FromArgb(255, 150, 165, 175)) $false
