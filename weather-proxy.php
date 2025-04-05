<?php
// Security: Move API keys to server-side configuration
require_once 'config.php'; // This file should be outside web root and contain API keys

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS protection
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}

// Rate limiting (simple implementation)
session_start();
$current_minute = floor(time() / 60);
if (!isset($_SESSION['api_requests']) || $_SESSION['api_minute'] !== $current_minute) {
    $_SESSION['api_requests'] = 0;
    $_SESSION['api_minute'] = $current_minute;
}
$_SESSION['api_requests']++;

if ($_SESSION['api_requests'] > MAX_REQUESTS_PER_MINUTE) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please try again later.']);
    exit;
}

// Get city parameter
$city = $_GET['city'] ?? '';

// Validate input
if (empty($city)) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'City parameter is required']);
    exit;
}

// Create API URL
$apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($city) . "&units=metric&appid=" . OPENWEATHER_API_KEY;

// Make API request
$response = file_get_contents($apiUrl);

// Return response
header('Content-Type: application/json');
echo $response; 