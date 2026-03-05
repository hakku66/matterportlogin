<?php
// IP restriction: Only allow from internal LAN (192.168.1.0/24)
$allowed_ip_prefix = '192.168.1.';
if (strpos($_SERVER['REMOTE_ADDR'], $allowed_ip_prefix) !== 0) {
    http_response_code(403);
    die('Access denied: Invalid IP address');
}

// CORS: Allow only from Matterport domain to prevent unauthorized access
header('Access-Control-Allow-Origin: https://my.matterport.com');
header('Content-Type: application/json');

// Store credentials in server-side variables (never in HTML)
$username = 'your_matterport_username';  // Replace with actual username
$password = 'your_matterport_password';  // Replace with actual password

// Output as JSON
echo json_encode([
    'username' => $username,
    'password' => $password
]);
?>