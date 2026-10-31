<?php
/**
 * <dcouplr/> Hostinger Production Community Core Lead Registration Endpoint
 * Records interested developers and unlocks Free Community Core downloads.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    $data = $_POST;
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$company = trim($data['company'] ?? '');
$cloud_stack = trim($data['cloud_stack'] ?? 'AWS');
$interest = trim($data['interest'] ?? 'general-evaluation');
$platform = trim($data['platform'] ?? 'unknown');

if (empty($name) || strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Please enter your full name.']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Please enter a valid work email address.']);
    exit;
}

$lead_id = 'comm-lead-' . time() . '-' . mt_rand(1000, 9999);
$timestamp = gmdate('Y-m-d\TH:i:s\Z');

$record = [
    'id' => $lead_id,
    'timestamp' => $timestamp,
    'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
    'email' => htmlspecialchars($email, ENT_QUOTES, 'UTF-8'),
    'company' => htmlspecialchars($company, ENT_QUOTES, 'UTF-8'),
    'cloud_stack' => htmlspecialchars($cloud_stack, ENT_QUOTES, 'UTF-8'),
    'interest' => htmlspecialchars($interest, ENT_QUOTES, 'UTF-8'),
    'platform' => htmlspecialchars($platform, ENT_QUOTES, 'UTF-8'),
    'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 150)
];

// Persistent lead storage
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

$leadsFile = $dataDir . '/community_leads.json';
$existing = [];

if (file_exists($leadsFile)) {
    $content = @file_get_contents($leadsFile);
    if ($content) {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $existing = $decoded;
        }
    }
}

$existing[] = $record;
@file_put_contents($leadsFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

// Also append to a CSV for immediate spreadsheet download
$csvFile = $dataDir . '/community_leads.csv';
$csvExists = file_exists($csvFile);
$fp = @fopen($csvFile, 'a');
if ($fp) {
    if (!$csvExists) {
        fputcsv($fp, ['ID', 'Timestamp', 'Name', 'Email', 'Company', 'Cloud Stack', 'Interest', 'Platform', 'User Agent']);
    }
    fputcsv($fp, [$lead_id, $timestamp, $name, $email, $company, $cloud_stack, $interest, $platform, $_SERVER['HTTP_USER_AGENT'] ?? '']);
    fclose($fp);
}

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'message' => 'Community Core v1.0.0 access unlocked for ' . $name . '.',
    'lead_id' => $lead_id,
    'total_registered' => count($existing),
    'download_urls' => [
        'linux' => '/install.sh',
        'macos' => '/install.sh',
        'windows' => '/install.ps1',
        'tarball' => '/dcouplr-enterprise-v1.0.0.tar.gz'
    ]
]);
