$files = @(
    "events.tsx",
    "attendance.tsx", 
    "evaluations.tsx",
    "documents.tsx",
    "consequences.tsx",
    "my-checkin.tsx",
    "my-events.tsx",
    "my-attendance.tsx",
    "my-obligations.tsx"
)

$basePath = "c:\xampp_new\htdocs\student_org_management\bisu-mobile\app\(officer)"

# Common dark mode color variables block to inject
$colorBlock = @"

  // Dark mode colors
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const borderLight = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#fff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';
  const modalBg = isDark ? '#1e293b' : '#fff';
  const footerBg = isDark ? '#0f172a' : '#f8fafc';
"@

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) { continue }
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # Skip if already has color block
    if ($content -match "// Dark mode colors") {
        Write-Output "SKIP colors: $file already has color block"
        continue
    }
    
    # Add color block after useTheme hook
    $content = $content -replace "(const \{ isDark, colors \} = useTheme\(\);)", "`$1$colorBlock"
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    Write-Output "DONE colors: $file"
}

Write-Output "`nColor blocks injected."
