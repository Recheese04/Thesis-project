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
foreach ($f in $files) { 
    $p = Join-Path $basePath $f
    $count = (Select-String -Path $p -Pattern 'className' -AllMatches | Measure-Object).Count
    Write-Output "$f : $count className remaining" 
}
