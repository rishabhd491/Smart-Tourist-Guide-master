<?php
require_once 'config.php';

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

// Input validation
$city = $_GET['city'] ?? '';
if (empty($city) || !preg_match('/^[a-zA-Z\s\-]+$/', $city)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid city name']);
    exit;
}

// Make the API request
$url = sprintf(
    'https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric',
    urlencode($city),
    WEATHER_API_KEY
);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Forward the response
http_response_code($status);
echo $response; 