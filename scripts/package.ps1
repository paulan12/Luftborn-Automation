param([string]$RepositoryUrl = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$output = Join-Path $projectRoot 'deliverables'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$archive = Join-Path $output 'Luftborn-Automation.zip'
$items = @('src', 'tests', 'checks', 'playwright.checks.config.ts', 'test-data', 'scripts', 'package.json', 'package-lock.json', 'playwright.config.ts', 'tsconfig.json', 'README.md', '.gitignore') | ForEach-Object { Join-Path $projectRoot $_ }
if (Test-Path (Join-Path $projectRoot 'reports')) { $items += Join-Path $projectRoot 'reports' }
$status = if ($RepositoryUrl) { "Repository: $RepositoryUrl" } else { 'Repository URL: pending publication.' }
$status += "`r`nConsult reports/junit/results.xml for the actual run status. A failed-run video is diagnostic evidence, not proof of successful completion."
$statusPath = Join-Path $output 'SUBMISSION-STATUS.txt'
Set-Content -LiteralPath $statusPath -Value $status -Encoding UTF8
$items += $statusPath
Compress-Archive -LiteralPath $items -DestinationPath $archive -Force
Write-Output "Created $archive"
