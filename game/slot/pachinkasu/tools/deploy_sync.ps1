# サイト用リポジトリへの同期（PowerShell）
#
#   powershell -File tools/deploy_sync.ps1 -Dest <tsukilab.jp のクローン>
#
# 【重要】robocopy /MIR は使わないこと。
#   /MIR は「宛先の余分なファイルを消す」オプションで、宛先を
#   game/slot/pachinkasu に絞っていても、実行時にリポジトリ全体の
#   ファイルを巻き込んで消す事故が起きた（2026-08-18・250ファイル）。
#   コミット前だったので git checkout で戻せたが、危険なので封印する。
#
#   ここでは /E（追加・更新のみ、削除しない）でコピーし、
#   消すべきファイルは git の差分を見て人間が判断する方針にしている。

param(
  [Parameter(Mandatory = $true)][string]$Dest
)

$src = Split-Path -Parent $PSScriptRoot
$dst = Join-Path $Dest 'game\slot\pachinkasu'

if (-not (Test-Path (Join-Path $Dest '.git'))) {
  Write-Error "同期先が git リポジトリではありません: $Dest"
  exit 1
}
if (-not (Test-Path $dst)) {
  Write-Error "同期先に game\slot\pachinkasu がありません: $dst"
  exit 1
}

# /E = サブディレクトリごとコピー（空も含む）。削除は一切しない
robocopy $src $dst /E /XD "_source" "node_modules" ".git" /NFL /NDL /NJH /NP /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) { Write-Error "robocopy 失敗 (exit $LASTEXITCODE)"; exit 1 }

Write-Host "コピー完了 (robocopy exit $LASTEXITCODE)"
Write-Host ""
Write-Host "--- 同期先の git 差分 ---"
Push-Location $Dest
git status --short -- game/slot/pachinkasu
Write-Host ""
$outside = git status --porcelain | Where-Object { $_ -notmatch 'game/slot/pachinkasu' }
if ($outside) {
  Write-Host "!! game/slot/pachinkasu の外に差分があります。コミット前に確認してください:" -ForegroundColor Red
  $outside | ForEach-Object { Write-Host "   $_" }
} else {
  Write-Host "game/slot/pachinkasu の外に差分なし" -ForegroundColor Green
}
Write-Host ""
Write-Host "※ リネーム・削除したファイルは /E では消えません。"
Write-Host "  上の差分を見て、不要になったファイルは同期先で手動 git rm してください。"
Pop-Location
