<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=org_attendance_system', 'root', '');
// Show actual columns of designations
$cols = $pdo->query("SHOW COLUMNS FROM designations")->fetchAll(PDO::FETCH_ASSOC);
echo "=== COLUMNS ===\n";
foreach ($cols as $c) echo $c['Field'] . " (" . $c['Type'] . ")\n";

// Show all rows
echo "\n=== ROWS ===\n";
$rows = $pdo->query("SELECT * FROM designations")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "id={$r['id']} user_id=" . ($r['user_id'] ?? 'N/A') . " org_id=" . ($r['organization_id'] ?? 'N/A') . " desig=" . ($r['designation'] ?? 'N/A') . " status=" . ($r['status'] ?? 'N/A') . "\n";
}
