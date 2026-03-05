<?php
// IP restriction: Only allow from internal LAN (adjust to your subnet)
// Change this prefix if your LAN uses a different range (e.g. 192.168.2. or 10.0.0.)
$allowed_ip_prefix = '192.168.2.';  // <-- update this to match your network
if (strpos($_SERVER['REMOTE_ADDR'], $allowed_ip_prefix) !== 0) {
    http_response_code(403);
        die('Access denied: Invalid IP address');
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