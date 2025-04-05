<?php
/**
 * Configuration file for API keys and other sensitive data
 * In production, this file should be placed outside the web root directory
 */

// OpenWeatherMap API Key
define('OPENWEATHER_API_KEY', '441589dc67e13cd221ee6b8c8b00eba6');

// Google Maps API Key (used for server-side requests if needed)
define('GOOGLE_MAPS_API_KEY', 'AIzaSyCtDXKm7whftI-ZckaVw2bj4nAKWx0O7FM');

// Database configuration (if needed)
define('DB_HOST', 'localhost');
define('DB_NAME', 'travel_ez');
define('DB_USER', 'root');
define('DB_PASS', '');

// Set timezone
date_default_timezone_set('UTC');

// Error reporting in development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: no-referrer-when-downgrade');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://maps.googleapis.com https://code.jquery.com https://cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\' https://stackpath.bootstrapcdn.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src \'self\' data: https:; font-src \'self\' https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src \'self\' https://maps.googleapis.com https://api.openweathermap.org;');

// Additional security measures
define('ALLOWED_ORIGINS', ['http://localhost', 'https://yourdomain.com']); // Add your domains
define('MAX_REQUESTS_PER_MINUTE', 60); 