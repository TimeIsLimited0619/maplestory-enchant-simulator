# 裝備建檔互動迴圈：同一視窗可連續導入，支援一次多個 XML / 資料夾
$ErrorActionPreference = 'Stop'
chcp 65001 | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-DroppedPaths([string]$raw) {
  $raw = $raw.Trim()
  if (-not $raw) { return @() }
  $list = New-Object System.Collections.Generic.List[string]
  foreach ($m in [regex]::Matches($raw, '"([^"]+)"|([^\s]+)')) {
    $p = if ($m.Groups[1].Value) { $m.Groups[1].Value } else { $m.Groups[2].Value }
    if ($p) { [void]$list.Add($p.Trim()) }
  }
  return @($list)
}

function Get-XmlList([string[]]$inputs) {
  $xmls = New-Object System.Collections.Generic.List[string]
  foreach ($p in $inputs) {
    if (-not (Test-Path -LiteralPath $p)) {
      Write-Host "  找不到：$p" -ForegroundColor Yellow
      continue
    }
    $item = Get-Item -LiteralPath $p
    if ($item.PSIsContainer) {
      Get-ChildItem -LiteralPath $item.FullName -File -Filter '*.img.xml' |
        ForEach-Object { [void]$xmls.Add($_.FullName) }
    } else {
      [void]$xmls.Add($item.FullName)
    }
  }
  return @($xmls)
}

function Read-Optional([string]$prompt) {
  $v = Read-Host $prompt
  if ($null -eq $v) { return '' }
  return $v.Trim().Trim('"')
}

function Import-OneXml([string]$xml, [string]$name, [string]$icon) {
  $nodeArgs = @($xml, '--write', '--inventory')
  if ($name) { $nodeArgs += @('--name', $name) }
  if ($icon) { $nodeArgs += @('--icon', $icon) }
  & node 'scripts/import-equip-xml.mjs' @nodeArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  導入失敗（exit $LASTEXITCODE）" -ForegroundColor Red
    return $false
  }
  return $true
}

Write-Host ''
Write-Host '  ========================================'
Write-Host "   裝備建檔（可連續導入）"
Write-Host "   $Root"
Write-Host '  ========================================'
Write-Host ''
Write-Host '  XML 那一行直接 Enter 結束。'
Write-Host '  可一次拖多個 XML，或拖整個資料夾。'
Write-Host ''

while ($true) {
  Write-Host '  ----------------------------------------'
  $raw = Read-Host '  1. 把 XML / 資料夾拖進來'
  if ([string]::IsNullOrWhiteSpace($raw)) { break }

  $xmls = Get-XmlList (Get-DroppedPaths $raw)
  if ($xmls.Count -eq 0) {
    Write-Host '  沒有可用的 .img.xml' -ForegroundColor Yellow
    continue
  }

  Write-Host "  共 $($xmls.Count) 件"
  $ok = 0
  foreach ($xml in $xmls) {
    Write-Host ''
    Write-Host "  --- $(Split-Path $xml -Leaf) ---" -ForegroundColor Cyan
    $name = Read-Optional '  2. 裝備名稱（空白則用 ID）'
    $icon = Read-Optional '  3. 把 PNG 拖進來（可空白跳過）'
    if (Import-OneXml $xml $name $icon) { $ok++ }
  }

  Write-Host ''
  Write-Host "  本輪完成 $ok / $($xmls.Count) 件。繼續下一輪，或 Enter 結束。" -ForegroundColor Green
}

Write-Host ''
Write-Host '  已結束。'
Write-Host ''