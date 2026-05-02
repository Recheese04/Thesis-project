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

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) { 
        Write-Output "SKIP: $file not found"
        continue 
    }
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # Skip if already has useTheme
    if ($content -match "useTheme") {
        Write-Output "SKIP: $file already has useTheme"
        continue
    }
    
    # 1. Add useTheme import after the last lucide import or after OfficerPageWrapper import
    if ($content -match "import OfficerPageWrapper") {
        $content = $content -replace "(import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';)", "`$1`nimport { useTheme } from '../../context/ThemeContext';"
    }
    
    # 2. Add theme hook after the component function opening
    # Find the pattern "export default function XXX() {" and add the hook after the first line
    $content = $content -replace "(export default function \w+\([^)]*\)\s*\{)", "`$1`n  const { isDark, colors } = useTheme();"
    
    # Write back
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    Write-Output "DONE: $file - added useTheme import and hook"
}

Write-Output "`nAll files processed. useTheme is now available in each component."
