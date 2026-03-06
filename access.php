<?php
// IP restriction: Only allow from internal LANs (multiple networks supported)
// Add your network prefixes to the array below
$allowed_ip_prefixes = [
    '192.168.2.',    // Network 1 - update to match your first network
    '10.0.0.'        // Network 2 - update to match your second network
];

$ip_allowed = false;
foreach ($allowed_ip_prefixes as $prefix) {
    if (strpos($_SERVER['REMOTE_ADDR'], $prefix) === 0) {
        $ip_allowed = true;
        break;
    }
}

if (!$ip_allowed) {
    http_response_code(403);
    die('Access denied: Invalid IP address. Allowed networks: ' . implode(', ', $allowed_ip_prefixes));
}
        // Determine which service's credentials have been requested
        $service = isset($_GET['service']) ? $_GET['service'] : 'matterport';

        // Default CORS origin is wildcard for flexibility within LAN; adjust as needed
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');

        // Store credentials locally for each service (never commit to git)
        // ⚠️ SECURITY WARNING: Set these values locally only!
        if ($service === 'edozo') {
            $username = 'your_edozo_email@example.com';  // Replace with actual Edozo email
            $password = 'your_edozo_password';           // Replace with actual Edozo password
        } else {
            // fallback to matterport
            $username = 'your_matterport_email@example.com';
            $password = 'your_matterport_password';
        }

        // Output credentials as JSON
        echo json_encode([
            'username' => $username,
            'password' => $password
        ]);
        ?>