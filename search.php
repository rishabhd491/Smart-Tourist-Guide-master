<?php
// Security: Move API keys to server-side configuration
require_once 'config.php'; // This file should be outside web root and contain API keys
$city = $_GET['city'] ?? '';
$query = $_GET['query'] ?? '';
$dayNo = $_GET['dayNo'] ?? '';
$stime = $_GET['stime'] ?? '09:00';
$etime = $_GET['etime'] ?? '21:00';

// Sanitize and prepare data for JavaScript
$jsData = [
    'city' => $city,
    'query' => $query,
    'defaultLocation' => [
        'lat' => 20.5937, // India center point
        'lng' => 78.9629
    ]
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Tourism - Search Results</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        #map { 
            height: 400px; 
            width: 100%; 
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .place-card {
            position: relative;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .place-card img {
            border-radius: 4px;
        }
        .position-absolute {
            z-index: 1; /* Ensure it stays on top */
        }
        .place-card:hover {
            transform: translateY(-5px);
        }
        .weather-card {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .photo-gallery img {
            height: 200px;
            object-fit: cover;
        }
        .review-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #fff;
        }
        .reviewer-photo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }
        .stars {
            color: #ffc107;
        }
        .reviews-container {
            max-height: 60vh;
            overflow-y: auto;
        }
        .weather-forecast {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
        }
        .favorite-btn {
            color: #dc3545;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .favorite-btn:hover {
            transform: scale(1.1);
        }
        .share-btn {
            color: #007bff;
            cursor: pointer;
        }
        .carousel-item img {
            height: 200px;
            object-fit: cover;
        }
        .language-selector {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        #weather {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .weather-icon {
            width: 50px;
            height: 50px;
        }
        .price-badge {
            font-size: 0.9em;
            padding: 5px 10px;
        }
        .price-info {
            font-size: 0.9em;
            padding: 8px;
            background-color: #e3f2fd;
            border-color: #90caf9;
        }
        .fa-dollar-sign {
            color: #28a745;
            margin-right: 2px;
        }
        .links-section {
            margin: 15px 0;
        }
        .links-section a {
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .links-section a:hover {
            transform: translateY(-2px);
        }
        .btn-outline-primary {
            border-color: #007bff;
            color: #007bff;
        }
        .btn-outline-primary:hover {
            background-color: #007bff;
            color: white;
        }
        .btn-outline-secondary {
            border-color: #6c757d;
            color: #6c757d;
        }
        .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white;
        }
        .btn-outline-success {
            border-color: #28a745;
            color: #28a745;
        }
        .btn-outline-success:hover {
            background-color: #28a745;
            color: white;
        }
        .marker-number {
            position: absolute;
            top: 10px;
            left: 10px;
            background: #dc3545;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 1;
        }
        .place-card {
            position: relative;
            transition: transform 0.2s;
            border: 1px solid #eee;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
            background: white;
        }
        .place-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .info-window {
            padding: 10px;
            max-width: 200px;
        }
        .info-window h5 {
            margin-bottom: 5px;
            color: #dc3545;
        }
        .info-window .rating {
            color: #ffc107;
            margin-bottom: 5px;
        }
        .info-window button {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            margin-top: 5px;
        }
        .info-window button:hover {
            background: #c82333;
        }
        .feature-buttons {
            margin-bottom: 20px;
        }
        .feature-buttons .btn {
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .route-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
        }
        .route-option {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .route-option:hover {
            background-color: #f8f9fa;
        }
        .route-steps {
            max-height: 200px;
            overflow-y: auto;
            margin-top: 10px;
        }
        .step {
            padding: 5px;
            border-bottom: 1px solid #eee;
        }
        .step:last-child {
            border-bottom: none;
        }
        .route-info {
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .route-option.selected {
            background-color: #e3f2fd;
            border-color: #90caf9;
        }
        .filters {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .filters label {
            font-weight: 500;
            margin-bottom: 5px;
            color: #666;
        }
        .filters select {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
        }
        .filters select:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        #activeFilters .badge {
            font-size: 14px;
            padding: 8px 12px;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        .card-header {
            border-bottom: 0;
        }
        .form-control:focus {
            border-color: #80bdff;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        .budget-calculator .form-group {
            margin-bottom: 1rem;
        }
        .cost-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .total-cost {
            font-weight: bold;
            color: #28a745;
        }
        .saved-place-item {
            display: flex;
            align-items: center;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .saved-place-item img {
            width: 50px;
            height: 50px;
            object-fit: cover;
            margin-right: 1rem;
            border-radius: 4px;
        }
        .top-place-item {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 15px;
            background: white;
            overflow: hidden;
        }
        .top-place-header {
            position: relative;
            padding: 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }
        .top-place-rank {
            position: absolute;
            top: 50%;
            right: 15px;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            background: #ffd700;
            color: #000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
        }
        .top-place-details {
            padding: 15px;
        }
        .top-place-stats {
            display: flex;
            gap: 15px;
            margin: 10px 0;
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .top-place-actions {
            padding: 15px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
        }
        .loading-spinner {
            text-align: center;
            padding: 30px;
        }
        .review-item {
            transition: transform 0.2s;
        }
        
        .review-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .overall-rating {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .text-warning {
            color: #ffc107 !important;
        }
        .btn-outline-danger:hover {
            transform: scale(1.1);
        }
        
        .btn-danger {
            transform: scale(1.1);
        }
        
        .toast {
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .toast-header {
            background-color: #f8f9fa;
        }
        
        #toast-container {
            z-index: 1050;
        }
        
        .favorite-btn {
            transition: all 0.3s ease;
        }
        
        .favorite-btn:hover {
            transform: scale(1.1);
        }
    </style>
</head>
<body>
<div class="header" role="banner">
    <a href="index.html" class="logo" aria-label="Travel EZ Home">Travel EZ</a>
    <div class="header-right">
        <a href="index.html" aria-label="Start a new search">New Search</a>
        <a href="aboutus/aboutus.html" aria-label="About Us page">About Us</a>
    </div>
</div>

<main role="main">
    <div class="bg-contact3" style="background-image: url('images/home_slider.jpg');">
        <div class="container">
            <!-- Sorting and Filtering Options -->
            <div class="filters card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-filter"></i> Sort & Filter Options</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label><i class="fas fa-sort"></i> Sort Places By</label>
                            <select class="form-control" id="sortSelect" onchange="sortPlaces(this.value)">
                                <option value="">Default Order</option>
                                <option value="distance">Distance: Near to Far</option>
                                <option value="rating">Rating: High to Low</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label><i class="fas fa-star"></i> Filter by Rating</label>
                            <select class="form-control" id="ratingFilter" onchange="filterByRating(this.value)">
                                <option value="">All Ratings</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="2">2+ Stars</option>
                            </select>
                        </div>
                    </div>
                    <div id="activeFilters" class="mt-2">
                        <!-- Active filters will be shown here -->
                    </div>
                </div>
            </div>

            <div id="weather"></div>
            
            <!-- Smart Features Section -->
            <div class="smart-features mb-4">
                <div class="row">
                    <!-- Local Experience Planner -->
                    <div class="col-md-6">
                        <div class="local-experience card h-100">
                            <div class="card-header bg-primary text-white">
                                <h5><i class="fas fa-compass"></i> Local Experience Planner</h5>
                            </div>
                            <div class="card-body">
                                <div class="time-slots">
                                    <h6>Best Time to Visit</h6>
                                    <div class="btn-group mb-3">
                                        <button class="btn btn-outline-primary" onclick="showTimeSlot('morning')">Morning</button>
                                        <button class="btn btn-outline-primary" onclick="showTimeSlot('afternoon')">Afternoon</button>
                                        <button class="btn btn-outline-primary" onclick="showTimeSlot('evening')">Evening</button>
                                    </div>
                                    <div id="timeSlotInfo" class="mt-2"></div>
                                </div>
                                <div class="local-tips mt-3">
                                    <h6>Local Tips</h6>
                                    <div id="localTips"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Budget Calculator -->
                    <div class="col-md-6">
                        <div class="budget-calculator card h-100">
                            <div class="card-header bg-success text-white">
                                <h5><i class="fas fa-calculator"></i> Trip Budget Calculator</h5>
                            </div>
                            <div class="card-body">
                                <div class="form-group">
                                    <label>Number of Days</label>
                                    <input type="number" class="form-control" id="days" min="1" value="1">
                                </div>
                                <div class="form-group">
                                    <label>Number of People</label>
                                    <input type="number" class="form-control" id="people" min="1" value="1">
                                </div>
                                <div class="form-check mb-3">
                                    <input type="checkbox" class="form-check-input" id="includeHotel">
                                    <label class="form-check-label">Include Hotel</label>
                                </div>
                                <button onclick="calculateBudget()" class="btn btn-success">
                                    Calculate Budget
                                </button>
                                <div id="budgetResult" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add this new filter section -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="filters">
                    <div class="btn-group" role="group">
                        <button onclick="filterPlaces('all')" class="btn btn-outline-primary active">
                            <i class="fas fa-globe"></i> All Places
                        </button>
                        <button onclick="filterPlaces('restaurant')" class="btn btn-outline-primary">
                            <i class="fas fa-utensils"></i> Restaurants
                        </button>
                        <button onclick="filterPlaces('hotel')" class="btn btn-outline-primary">
                            <i class="fas fa-hotel"></i> Hotels
                        </button>
                        <button onclick="filterPlaces('tourist_attraction')" class="btn btn-outline-primary">
                            <i class="fas fa-landmark"></i> Attractions
                        </button>
                    </div>
                </div>
                <button onclick="showFavorites()" class="btn btn-danger">
                    <i class="fas fa-heart"></i> View Favorites
                </button>
            </div>

            <!-- Add this button right next to your existing search or filter buttons -->
            <div class="mb-3">
                <button class="btn btn-info" onclick="findTopPlaces()">
                    <i class="fas fa-trophy"></i> Top 3 Popular Places
                </button>
            </div>

            <div class="container mt-4">
                <div class="row">
                    <div class="col-md-12">
                        <!-- Search Form -->
                        <form action="search.php" method="GET" class="mb-4">
                            <div class="input-group">
                                <input type="text" name="city" class="form-control" placeholder="Enter city name..." value="<?php echo htmlspecialchars($city); ?>" required>
                                <input type="text" name="query" class="form-control" placeholder="What are you looking for? (e.g., restaurants, hotels, attractions)" value="<?php echo htmlspecialchars($query); ?>" required>
                                <div class="input-group-append">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-search"></i> Search
                                    </button>
                                </div>
                            </div>
                        </form>

                        <!-- Top Places Button -->
                        <button class="btn btn-info mb-3" onclick="findTopPlaces()">
                            <i class="fas fa-trophy"></i> Top 3 Popular Places
                        </button>
                    </div>
                </div>
            </div>

            <div id="map"></div>
            <div id="results"></div>
            <div id="topPlacesContainer" class="mt-4"></div>
        </div>
    </div>
</main>

<div class="modal fade" id="favoritesModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="fas fa-heart"></i> My Favorite Places
                </h5>
                <button type="button" class="btn-close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- Favorites will be loaded here -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <!-- Add this button to clear all favorites -->
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="translatorModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Sign Translator</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <input type="file" accept="image/*" capture="camera" 
                       onchange="translateSign(this)" class="form-control">
                <small class="text-muted">Take a photo of any sign to translate</small>
                <div id="translationResult" class="mt-3"></div>
            </div>
        </div>
    </div>
</div>

<!-- Add this modal for budget calculation after your existing container div -->
<div class="modal fade" id="budgetModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title"><i class="fas fa-calculator"></i> Trip Budget Calculator</h5>
                <button type="button" class="close text-white" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="budget-calculator">
                    <div class="saved-places mb-4">
                        <h6><i class="fas fa-bookmark"></i> Saved Places</h6>
                        <div id="savedPlacesList" class="list-group">
                            <!-- Saved places will be listed here -->
                        </div>
                    </div>

                    <div class="trip-details card mb-4">
                        <div class="card-body">
                            <h6><i class="fas fa-cog"></i> Trip Settings</h6>
                            <div class="form-group">
                                <label>Number of People</label>
                                <input type="number" id="numPeople" class="form-control" value="1" min="1">
                            </div>
                            <div class="form-group">
                                <label>Number of Days</label>
                                <input type="number" id="numDays" class="form-control" value="1" min="1">
                            </div>
                            <div class="form-group">
                                <label>Travel Style</label>
                                <select id="travelStyle" class="form-control">
                                    <option value="budget">Budget</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="luxury">Luxury</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="estimated-costs card">
                        <div class="card-body">
                            <h6><i class="fas fa-receipt"></i> Estimated Costs</h6>
                            <div id="costBreakdown">
                                <!-- Cost breakdown will be shown here -->
                            </div>
                            <div class="total-cost mt-3 pt-3 border-top">
                                <h5>Total Estimated Cost: <span id="totalCost">Rs0</span></h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="saveBudgetPlan()">
                    <i class="fas fa-save"></i> Save Plan
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Add this button in your favorites section -->
<button class="btn btn-primary" onclick="calculateBudget()">
    <i class="fas fa-calculator"></i> Calculate Trip Budget
</button>

<!-- Add this modal for top places -->
<div class="modal fade" id="topPlacesModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-info text-white">
                <h5 class="modal-title">
                    <i class="fas fa-trophy"></i> Top 3 Popular Places
                </h5>
                <button type="button" class="close text-white" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div id="topPlacesContainer"></div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="reviewsModal" tabindex="-1" aria-labelledby="reviewsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="reviewsModalLabel">Reviews</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="reviewsContent"></div>
            </div>
        </div>
    </div>
</div>

<script>
// Safely pass PHP variables to JavaScript
const appData = <?php echo json_encode($jsData, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
const city = appData.city;
const query = appData.query;

let map;
let service;
let markers = [];
let directionsService;
let directionsRenderer;
let activeFeatures = {
    weather: false,
    filters: false,
    budget: false,
    crowd: false,
    virtual: false
};
let activeInfoWindow = null;
let allPlaces = []; // Store all places for filtering/sorting

function toggleFeature(feature) {
    activeFeatures[feature] = !activeFeatures[feature];
    document.getElementById(feature + 'Section').style.display = 
        activeFeatures[feature] ? 'block' : 'none';
    
    if (feature === 'weather' && activeFeatures.weather) {
        getWeather();
    }
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 13
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: {
            strokeColor: '#ff0000',
            strokeWeight: 5
        }
    });

    service = new google.maps.places.PlacesService(map);
    searchPlaces();
    getWeather();
}

function searchPlaces() {
    const request = {
        query: '<?php echo addslashes($query); ?> in <?php echo addslashes($city); ?>',
        fields: ['name', 'geometry', 'formatted_address', 'photos', 'rating', 'place_id']
    };

    service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            displayResults(results);
        } else {
            document.getElementById('results').innerHTML = 
                '<div class="alert alert-warning">No places found. Please try a different search.</div>';
        }
    });
}

function displayResults(places) {
    allPlaces = places; // Store all places
    displayFilteredPlaces(places);
    updateActiveFilters(); // Add this line
}

function displayFilteredPlaces(places) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    if (places.length === 0) {
        resultsDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No places match your filters.
                <button onclick="resetFilters()" class="btn btn-link">Reset Filters</button>
            </div>`;
        return;
    }

    places.forEach((place) => {
        // Create marker
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(40, 40),
            },
            animation: google.maps.Animation.DROP
        });
        markers.push(marker);

        // Create place card
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card position-relative';
        placeCard.innerHTML = `
            <div class="position-absolute top-0 end-0 p-2">
                <button onclick="toggleFavorite('${place.place_id}', '${place.name}', '${place.formatted_address}', ${place.geometry.location.lat()}, ${place.geometry.location.lng()}, '${place.photos ? place.photos[0].getUrl() : ''}')" 
                        class="btn ${checkIfFavorite(place.place_id) ? 'btn-danger' : 'btn-outline-danger'}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <img src="${place.photos && place.photos.length > 0 ? place.photos[0].getUrl() : 'placeholder.jpg'}" 
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
            <div class="ms-4 mt-2">
                <h4>${place.name}</h4>
                <p>${place.formatted_address}</p>
                <p>Rating: ${place.rating || 'N/A'}</p>
                <button onclick="showRoute(${place.geometry.location.lat()}, ${place.geometry.location.lng()})" class="btn btn-danger">
                    <i class="fas fa-route"></i> Show Route
                </button>
                <button onclick="showReviews('${place.place_id}', '${place.name}')" class="btn btn-info ms-2">
                    <i class="fas fa-star"></i> Reviews
                </button>
                ${place.website ? `
                    <a href="${place.website}" target="_blank" class="btn btn-outline-primary ms-2">
                        <i class="fas fa-link"></i> Website
                    </a>
                ` : ''}
            </div>
            <div class="review-section mt-3">
                <h6>Top Reviews:</h6>
                <div id="reviews-${place.place_id}" class="reviews-container">
                    <!-- Reviews will be dynamically added here -->
                </div>
            </div>
        `;

        resultsDiv.appendChild(placeCard);
    });
}

function showRouteOptions(destLat, destLng) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const request = {
                    origin: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    destination: {
                        lat: destLat,
                        lng: destLng
                    },
                    travelMode: 'DRIVING',
                    provideRouteAlternatives: true
                };

                directionsService.route(request, (response, status) => {
                    if (status === 'OK') {
                        // Clear existing route info
                        const existingRouteInfo = document.getElementById('routeInfo');
                        if (existingRouteInfo) {
                            existingRouteInfo.remove();
                        }

                        // Create route options panel
                        const routeInfo = document.createElement('div');
                        routeInfo.id = 'routeInfo';
                        routeInfo.className = 'route-info card mb-4';
                        
                        let routesHtml = `
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0"><i class="fas fa-routes"></i> Available Routes</h5>
                            </div>
                            <div class="card-body">
                                <div class="route-options mb-3">`;

                        // Add each route option
                        response.routes.forEach((route, index) => {
                            const leg = route.legs[0];
                            routesHtml += `
                                <div class="route-option mb-2 p-3 border rounded ${index === 0 ? 'bg-light' : ''}" 
                                     onclick="selectRoute(${index})">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">Route ${index + 1}</h6>
                                            <div class="text-muted">
                                                <small><i class="fas fa-clock"></i> ${leg.duration.text}</small>
                                                <small class="ml-2"><i class="fas fa-road"></i> ${leg.distance.text}</small>
                                            </div>
                                        </div>
                                        <button class="btn btn-sm btn-outline-primary">
                                            Select Route
                                        </button>
                                    </div>
                                    <div class="route-steps mt-2" style="display: none;" id="steps-${index}">
                                        ${leg.steps.map(step => `
                                            <div class="step small p-2 border-bottom">
                                                <i class="fas fa-arrow-right text-primary"></i>
                                                ${step.instructions}
                                                <small class="text-muted">(${step.distance.text})</small>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>`;
                        });

                        routesHtml += `
                                </div>
                                <button onclick="toggleAllSteps()" class="btn btn-info btn-sm">
                                    <i class="fas fa-list"></i> Toggle All Directions
                                </button>
                            </div>`;

                        routeInfo.innerHTML = routesHtml;
                        document.getElementById('results').insertBefore(routeInfo, document.getElementById('results').firstChild);

                        // Show the first route by default
                        directionsRenderer.setDirections(response);
                        directionsRenderer.setRouteIndex(0);

                        // Store routes for later use
                        window.currentRoutes = response;
                    } else {
                        alert('Could not calculate routes: ' + status);
                    }
                });
            },
            () => {
                alert('Error: The Geolocation service failed.');
            }
        );
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

function selectRoute(routeIndex) {
    if (window.currentRoutes) {
        directionsRenderer.setRouteIndex(routeIndex);
        
        // Update UI to show selected route
        document.querySelectorAll('.route-option').forEach((el, index) => {
            el.classList.toggle('bg-light', index === routeIndex);
        });

        // Scroll to the selected route on the map
        const bounds = window.currentRoutes.routes[routeIndex].bounds;
        map.fitBounds(bounds);
    }
}

function toggleAllSteps() {
    const allSteps = document.querySelectorAll('.route-steps');
    const areAllVisible = Array.from(allSteps).every(el => el.style.display !== 'none');
    
    allSteps.forEach(steps => {
        steps.style.display = areAllVisible ? 'none' : 'block';
    });
}

function showRoute(destLat, destLng) {
    showRouteOptions(destLat, destLng);
}

function getWeather() {
    const weatherDiv = document.getElementById('weather');
    weatherDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading weather...</div>';

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=441589dc67e13cd221ee6b8c8b00eba6`)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                weatherDiv.innerHTML = `
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <h3>${data.name}</h3>
                            <div class="h2 mb-0">${Math.round(data.main.temp)}°C</div>
                            <div>${data.weather[0].description}</div>
                        </div>
                        <div>
                            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
                                 alt="Weather icon" 
                                 class="weather-icon">
                        </div>
                        <div>
                            <div>Humidity: ${data.main.humidity}%</div>
                            <div>Wind: ${data.wind.speed} m/s</div>
                        </div>
                    </div>`;
            } else {
                weatherDiv.innerHTML = '<div class="alert alert-warning">Weather information unavailable</div>';
            }
        })
        .catch(error => {
            console.error('Weather fetch error:', error);
            weatherDiv.innerHTML = '<div class="alert alert-warning">Weather information unavailable</div>';
        });
}

function filterPlaces(type) {
    // Update active button
    document.querySelectorAll('.filters .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Modify search query based on type
    let searchQuery = '<?php echo addslashes($query); ?>';
    if (type !== 'all') {
        searchQuery += ' ' + type;
    }

    const request = {
        query: searchQuery + ' in <?php echo addslashes($city); ?>',
        fields: ['name', 'geometry', 'formatted_address', 'photos', 'rating']
    };

    service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Clear previous markers
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            if (results.length > 0) {
                map.setCenter(results[0].geometry.location);
            }
            displayResults(results);
        } else {
            document.getElementById('results').innerHTML = 
                '<div class="alert alert-warning">No places found. Please try a different search.</div>';
        }
    });
}

// Add favorite functionality
function toggleFavorite(placeId, name, address, lat, lng, photoUrl) {
    // Prevent the card click event from triggering
    event.stopPropagation();
    
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.findIndex(f => f.place_id === placeId);
    
    if (index === -1) {
        // Add to favorites
        const newFavorite = {
            place_id: placeId,
            name: name,
            address: address,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            photo: photoUrl || ''
        };
        
        favorites.push(newFavorite);
        showToast(`Added ${name} to favorites!`);
        
        // Update button to filled heart
        const button = event.target.closest('button');
        if (button) {
            button.className = 'btn btn-danger position-absolute';
        }
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        showToast(`Removed ${name} from favorites!`);
        
        // Update button to outlined heart
        const button = event.target.closest('button');
        if (button) {
            button.className = 'btn btn-outline-danger position-absolute';
        }
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesCount(); // Update the count if you have a counter display
}

function checkIfFavorite(placeId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.some(f => f.place_id === placeId);
}

function showToast(message) {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1050;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">
                <i class="fas fa-heart text-danger"></i> Favorites
            </strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateFavoritesCount() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const count = favorites.length;
    
    // Update the favorites button if it exists
    const favoritesBtn = document.querySelector('[onclick="showFavorites()"]');
    if (favoritesBtn) {
        favoritesBtn.innerHTML = `
            <i class="fas fa-heart"></i> 
            Favorites ${count > 0 ? `<span class="badge bg-white text-danger">${count}</span>` : ''}
        `;
    }
}

// Add sorting function
function sortPlaces(sortBy) {
    if (!allPlaces.length) return;

    let sortedPlaces = [...allPlaces];

    if (sortBy === 'distance') {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = new google.maps.LatLng(
                        position.coords.latitude,
                        position.coords.longitude
                    );

                    sortedPlaces.sort((a, b) => {
                        const distA = google.maps.geometry.spherical.computeDistanceBetween(
                            userLocation,
                            a.geometry.location
                        );
                        const distB = google.maps.geometry.spherical.computeDistanceBetween(
                            userLocation,
                            b.geometry.location
                        );
                        return distA - distB;
                    });

                    displayFilteredPlaces(sortedPlaces);
                },
                () => {
                    alert('Error: The Geolocation service failed.');
                }
            );
        }
    } else if (sortBy === 'rating') {
        sortedPlaces.sort((a, b) => {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return ratingB - ratingA;
        });
        displayFilteredPlaces(sortedPlaces);
    }
    updateActiveFilters();
}

// Add filtering function
function filterByRating(minRating) {
    if (!allPlaces.length) return;

    let filteredPlaces = [...allPlaces];

    if (minRating) {
        filteredPlaces = filteredPlaces.filter(place => 
            place.rating && place.rating >= parseFloat(minRating)
        );
    }

    displayFilteredPlaces(filteredPlaces);
    updateActiveFilters();
}

// Add function to update active filters display
function updateActiveFilters() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const sortValue = document.getElementById('sortSelect').value;
    const ratingValue = document.getElementById('ratingFilter').value;

    let filtersHtml = '';

    if (sortValue) {
        filtersHtml += `
            <span class="badge badge-primary">
                ${sortValue === 'distance' ? 'Sorted by Distance' : 'Sorted by Rating'}
                <i class="fas fa-times ml-2" onclick="resetSort()" style="cursor:pointer;"></i>
            </span>`;
    }

    if (ratingValue) {
        filtersHtml += `
            <span class="badge badge-success">
                ${ratingValue}+ Stars
                <i class="fas fa-times ml-2" onclick="resetRating()" style="cursor:pointer;"></i>
            </span>`;
    }

    activeFiltersDiv.innerHTML = filtersHtml;
}

// Add reset functions
function resetSort() {
    document.getElementById('sortSelect').value = '';
    displayFilteredPlaces(allPlaces);
    updateActiveFilters();
}

function resetRating() {
    document.getElementById('ratingFilter').value = '';
    displayFilteredPlaces(allPlaces);
    updateActiveFilters();
}

function resetFilters() {
    document.getElementById('sortSelect').value = '';
    document.getElementById('ratingFilter').value = '';
    displayFilteredPlaces(allPlaces);
    updateActiveFilters();
}

// Store favorites in localStorage if not already doing so
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function calculateBudget() {
    if (favorites.length === 0) {
        alert('Please add some places to your favorites first!');
        return;
    }

    // Display saved places
    displaySavedPlaces();
    
    // Show the budget modal
    $('#budgetModal').modal('show');
    
    // Calculate initial costs
    updateCosts();
}

function displaySavedPlaces() {
    const savedPlacesList = document.getElementById('savedPlacesList');
    savedPlacesList.innerHTML = favorites.map(place => `
        <div class="saved-place-item">
            <img src="${place.photo || 'placeholder.jpg'}" alt="${place.name}">
            <div>
                <h6>${place.name}</h6>
                <small class="text-muted">${place.address || ''}</small>
            </div>
        </div>
    `).join('');
}

function updateCosts() {
    const numPeople = parseInt(document.getElementById('numPeople').value);
    const numDays = parseInt(document.getElementById('numDays').value);
    const travelStyle = document.getElementById('travelStyle').value;

    // Base costs per person per day
    const baseCosts = {
        budget: {
            accommodation: 50,
            food: 30,
            activities: 20,
            transportation: 15
        },
        moderate: {
            accommodation: 150,
            food: 60,
            activities: 50,
            transportation: 30
        },
        luxury: {
            accommodation: 300,
            food: 100,
            activities: 100,
            transportation: 60
        }
    };

    const costs = baseCosts[travelStyle];
    const totalDays = numDays;
    const totalPeople = numPeople;

    // Calculate costs
    const accommodationCost = costs.accommodation * totalDays * totalPeople;
    const foodCost = costs.food * totalDays * totalPeople;
    const activitiesCost = costs.activities * totalDays * totalPeople;
    const transportationCost = costs.transportation * totalDays * totalPeople;

    // Calculate total
    const totalCost = accommodationCost + foodCost + activitiesCost + transportationCost;

    // Display breakdown
    document.getElementById('costBreakdown').innerHTML = `
        <div class="cost-item">
            <span><i class="fas fa-bed"></i> Accommodation</span>
            <span>$${accommodationCost}</span>
        </div>
        <div class="cost-item">
            <span><i class="fas fa-utensils"></i> Food & Dining</span>
            <span>$${foodCost}</span>
        </div>
        <div class="cost-item">
            <span><i class="fas fa-ticket-alt"></i> Activities</span>
            <span>$${activitiesCost}</span>
        </div>
        <div class="cost-item">
            <span><i class="fas fa-car"></i> Transportation</span>
            <span>$${transportationCost}</span>
        </div>
    `;

    document.getElementById('totalCost').textContent = `$${totalCost}`;
}

// Add event listeners for real-time updates
document.getElementById('numPeople')?.addEventListener('change', updateCosts);
document.getElementById('numDays')?.addEventListener('change', updateCosts);
document.getElementById('travelStyle')?.addEventListener('change', updateCosts);

function saveBudgetPlan() {
    const budgetPlan = {
        people: document.getElementById('numPeople').value,
        days: document.getElementById('numDays').value,
        style: document.getElementById('travelStyle').value,
        totalCost: document.getElementById('totalCost').textContent,
        places: favorites,
        date: new Date().toISOString()
    };

    // Save to localStorage
    const savedPlans = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    savedPlans.push(budgetPlan);
    localStorage.setItem('budgetPlans', JSON.stringify(savedPlans));

    alert('Budget plan saved successfully!');
    $('#budgetModal').modal('hide');
}

function findTopPlaces() {
    // Show loading state
    const topPlacesContainer = document.getElementById('topPlacesContainer');
    topPlacesContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    // Get the current city from the search
    const searchCity = '<?php echo addslashes($city); ?>';

    // Create the places service
    const service = new google.maps.places.PlacesService(map);

    // First, get the city's coordinates using Geocoding
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchCity }, function(results, status) {
        if (status === 'OK') {
            const cityLocation = results[0].geometry.location;

            // Now search for places near the city
            const request = {
                location: cityLocation,
                radius: '5000', // 5 km radius
                type: ['tourist_attraction', 'restaurant', 'museum'],
                rankBy: google.maps.places.RankBy.RATING
            };

            service.nearbySearch(request, function(places, searchStatus) {
                if (searchStatus === google.maps.places.PlacesServiceStatus.OK && places.length > 0) {
                    // Sort and get top 3 places
                    const topPlaces = places
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 3);

                    // Display the results
                    let html = '<div class="container">';
                    
                    topPlaces.forEach((place, index) => {
                        html += `
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h5 class="card-title">
                                        #${index + 1} - ${place.name}
                                    </h5>
                                    <p class="card-text">
                                        <i class="fas fa-star text-warning"></i> 
                                        Rating: ${place.rating} (${place.user_ratings_total} reviews)
                                    </p>
                                    <p class="card-text">
                                        <i class="fas fa-map-marker-alt text-danger"></i> 
                                        ${place.vicinity}
                                    </p>
                                    <button class="btn btn-primary btn-sm" 
                                            onclick="showOnMap(${place.geometry.location.lat()}, 
                                                            ${place.geometry.location.lng()}, 
                                                            '${place.name}')">
                                        <i class="fas fa-map"></i> Show on Map
                                    </button>
                                </div>
                            </div>
                        `;
                    });

                    html += '</div>';
                    topPlacesContainer.innerHTML = html;
                } else {
                    topPlacesContainer.innerHTML = `
                        <div class="alert alert-warning">
                            No top places found in ${searchCity}. Please try another search.
                        </div>
                    `;
                }
            });
        } else {
            topPlacesContainer.innerHTML = `
                <div class="alert alert-danger">
                    Could not find location for ${searchCity}. Please try another search.
                </div>
            `;
        }
    });
}

function showOnMap(lat, lng, placeName) {
    // Center the map on the location
    map.setCenter({ lat: lat, lng: lng });
    map.setZoom(16);
    
    // Add a marker
    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        title: placeName,
        animation: google.maps.Animation.DROP
    });
    
    // Add an info window
    const infowindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px">
                <h6>${placeName}</h6>
                <button class="btn btn-sm btn-primary" 
                        onclick="showRoute(${lat}, ${lng})">
                    Get Directions
                </button>
            </div>
        `
    });
    
    // Open the info window when clicking the marker
    marker.addListener('click', () => {
        infowindow.open(map, marker);
    });
    
    // Trigger the click event to show the info window immediately
    google.maps.event.trigger(marker, 'click');
}

function showReviews(placeId, placeName) {
    const reviewsModal = new bootstrap.Modal(document.getElementById('reviewsModal'));
    document.getElementById('reviewsModalLabel').textContent = `Reviews for ${placeName}`;
    document.getElementById('reviewsContent').innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    reviewsModal.show();

    const service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: placeId,
        fields: ['rating', 'reviews']
    }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const sortedReviews = place.reviews?.sort((a, b) => b.rating - a.rating) || [];
            const top10Reviews = sortedReviews.slice(0, 10);

            let reviewsHtml = `
                <div class="overall-rating mb-4 text-center">
                    <h4>Overall Rating: ${place.rating?.toFixed(1) || 'N/A'} ⭐</h4>
                </div>
                <div class="reviews-container">
            `;

            if (top10Reviews.length === 0) {
                reviewsHtml += `<p class="text-center">No reviews available for this place.</p>`;
            } else {
                top10Reviews.forEach(review => {
                    const date = new Date(review.time * 1000).toLocaleDateString();
                    const stars = '⭐'.repeat(review.rating);
                    reviewsHtml += `
                        <div class="review-card mb-4">
                            <div class="review-header d-flex justify-content-between align-items-center">
                                <div class="reviewer-info">
                                    <img src="${review.profile_photo_url || 'https://via.placeholder.com/40'}" 
                                         alt="Reviewer" 
                                         class="reviewer-photo rounded-circle me-2"
                                         width="40" height="40">
                                    <strong>${review.author_name}</strong>
                                </div>
                                <div class="review-meta text-end">
                                    <div class="stars">${stars}</div>
                                    <small class="text-muted">${date}</small>
                                </div>
                            </div>
                            <div class="review-text mt-2">
                                ${review.text}
                            </div>
                        </div>
                    `;
                });
            }

            reviewsHtml += `
                </div>
                <div class="text-center mt-3">
                    <a href="https://www.google.com/maps/place/?q=place_id:${placeId}" 
                       target="_blank" 
                       class="btn btn-outline-primary">
                       Read More Reviews on Google
                    </a>
                </div>
            `;

            document.getElementById('reviewsContent').innerHTML = reviewsHtml;
        } else {
            document.getElementById('reviewsContent').innerHTML = `
                <div class="alert alert-warning" role="alert">
                    Unable to fetch reviews. Please try again later.
                </div>
            `;
        }
    });
}

function showFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="favoritesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-heart"></i> My Favorite Places
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${favorites.length === 0 ? `
                            <div class="text-center py-5">
                                <i class="fas fa-heart-broken text-muted fa-3x mb-3"></i>
                                <p class="text-muted">No favorites added yet</p>
                            </div>
                        ` : `
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="favorites-list">
                                        ${favorites.map((place, index) => `
                                            <div class="card mb-3">
                                                <div class="card-body">
                                                    <h6 class="card-title">${place.name}</h6>
                                                    <p class="text-muted small mb-2">
                                                        <i class="fas fa-map-marker-alt text-danger"></i> 
                                                        ${place.address}
                                                    </p>
                                                    <div class="btn-group btn-group-sm">
                                                        <button onclick="showFavoriteLocation(${place.lat}, ${place.lng}, '${place.name}')"
                                                                class="btn btn-outline-primary">
                                                            <i class="fas fa-map-marked-alt"></i> Show Location
                                                        </button>
                                                        <button onclick="showFavoriteRoute(${place.lat}, ${place.lng}, '${place.name}')"
                                                                class="btn btn-outline-success">
                                                            <i class="fas fa-route"></i> Get Directions
                                                        </button>
                                                        <button onclick="removeFavorite('${place.place_id}')"
                                                                class="btn btn-outline-danger">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div id="favoritesMap" style="height: 400px; border-radius: 8px;"></div>
                                </div>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        ${favorites.length > 0 ? `
                            <button onclick="clearFavorites()" class="btn btn-danger">
                                <i class="fas fa-trash"></i> Clear All
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('favoritesModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize Bootstrap modal
    const modal = new bootstrap.Modal(document.getElementById('favoritesModal'));
    modal.show();

    // Initialize map if there are favorites
    if (favorites.length > 0) {
        setTimeout(() => {
            initFavoritesMap(favorites);
        }, 500);
    }
}

function initFavoritesMap(favorites) {
    const favoritesMap = new google.maps.Map(document.getElementById('favoritesMap'), {
        zoom: 12,
        center: { lat: parseFloat(favorites[0].lat), lng: parseFloat(favorites[0].lng) }
    });

    const bounds = new google.maps.LatLngBounds();
    favorites.forEach((place, index) => {
        const position = { 
            lat: parseFloat(place.lat), 
            lng: parseFloat(place.lng) 
        };
        
        const marker = new google.maps.Marker({
            position: position,
            map: favoritesMap,
            title: place.name,
            label: (index + 1).toString()
        });

        bounds.extend(position);

        // Add info window
        const infowindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px">
                    <h6 style="margin: 0 0 5px 0">${place.name}</h6>
                    <p style="margin: 0 0 5px 0">${place.address}</p>
                    <button onclick="showFavoriteRoute(${place.lat}, ${place.lng}, '${place.name}')"
                            class="btn btn-sm btn-success">
                        <i class="fas fa-route"></i> Get Directions
                    </button>
                </div>
            `
        });

        marker.addListener('click', () => {
            infowindow.open(favoritesMap, marker);
        });
    });

    favoritesMap.fitBounds(bounds);
}

function removeFavorite(placeId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const placeToRemove = favorites.find(f => f.place_id === placeId);
    
    if (placeToRemove && confirm(`Remove ${placeToRemove.name} from favorites?`)) {
        favorites = favorites.filter(f => f.place_id !== placeId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        showFavorites(); // Refresh the modal
    }
}

function clearFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        localStorage.removeItem('favorites');
        showFavorites(); // Refresh the modal
    }
}

function showFavoriteLocation(lat, lng, name) {
    // Close the favorites modal
    $('#favoritesModal').modal('hide');
    
    // Center the main map on the location
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
    map.setCenter(position);
    map.setZoom(16);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Add new marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: name,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        }
    });
    markers.push(marker);

    // Add info window
    const infowindow = new google.maps.InfoWindow({
        content: `
            <div class="info-window">
                <h5>${name}</h5>
                <button onclick="showFavoriteRoute(${lat}, ${lng}, '${name}')"
                        class="btn btn-danger btn-sm mt-2">
                    <i class="fas fa-route"></i> Get Directions
                </button>
            </div>
        `
    });

    // Open info window
    infowindow.open(map, marker);
}

function showFavoriteRoute(destLat, destLng, placeName) {
    // Close the favorites modal
    $('#favoritesModal').modal('hide');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const directionsService = new google.maps.DirectionsService();
                
                // Create new DirectionsRenderer if it doesn't exist
                if (!directionsRenderer) {
                    directionsRenderer = new google.maps.DirectionsRenderer({
                        map: map,
                        polylineOptions: {
                            strokeColor: '#FF0000',
                            strokeWeight: 5
                        }
                    });
                } else {
                    directionsRenderer.setMap(map);
                }

                const request = {
                    origin: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    destination: {
                        lat: parseFloat(destLat),
                        lng: parseFloat(destLng)
                    },
                    travelMode: google.maps.TravelMode.DRIVING
                };

                directionsService.route(request, (response, status) => {
                    if (status === 'OK') {
                        // Clear existing markers
                        markers.forEach(marker => marker.setMap(null));
                        markers = [];

                        // Display the route
                        directionsRenderer.setDirections(response);

                        // Create route info panel
                        const route = response.routes[0].legs[0];
                        createRoutePanel(route, placeName);
                    } else {
                        alert('Could not calculate route: ' + status);
                    }
                });
            },
            () => {
                alert('Error: Could not get your location. Please enable location services.');
            }
        );
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

function createRoutePanel(route, placeName) {
    // Remove existing route panel if any
    const existingPanel = document.getElementById('routePanel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Create new route panel
    const routePanel = document.createElement('div');
    routePanel.id = 'routePanel';
    routePanel.className = 'card position-fixed';
    routePanel.style.cssText = 'bottom: 20px; right: 20px; width: 300px; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.1);';
    
    routePanel.innerHTML = `
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Route to ${placeName}</h6>
            <button type="button" class="btn-close btn-close-white" onclick="closeRoutePanel()"></button>
        </div>
        <div class="card-body">
            <div class="d-flex justify-content-between mb-3">
                <div>
                    <div><i class="fas fa-clock text-primary"></i> ${route.duration.text}</div>
                    <div><i class="fas fa-road text-success"></i> ${route.distance.text}</div>
                </div>
                <button class="btn btn-outline-primary btn-sm" onclick="toggleDirections()">
                    <i class="fas fa-list"></i> Show Steps
                </button>
            </div>
            <div id="directionsSteps" class="collapse">
                <hr>
                <div class="directions-list">
                    ${route.steps.map((step, index) => `
                        <div class="direction-step mb-2">
                            <div class="d-flex">
                                <div class="me-2">
                                    <span class="badge bg-secondary">${index + 1}</span>
                                </div>
                                <div>
                                    <div>${step.instructions}</div>
                                    <small class="text-muted">${step.distance.text}</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(routePanel);
}

function toggleDirections() {
    $('#directionsSteps').collapse('toggle');
}

function closeRoutePanel() {
    const panel = document.getElementById('routePanel');
    if (panel) {
        panel.remove();
    }
    // Clear the route from map
    if (directionsRenderer) {
        directionsRenderer.setMap(null);
    }
}

// Add these styles to your CSS
const newStyles = `
    #routePanel {
        max-height: 80vh;
        overflow-y: auto;
    }

    .direction-step {
        font-size: 0.9rem;
    }

    .directions-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .btn-close-white {
        filter: brightness(0) invert(1);
    }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = newStyles;
document.head.appendChild(styleSheet);
</script>

<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCtDXKm7whftI-ZckaVw2bj4nAKWx0O7FM&libraries=places&callback=initMap" async defer></script>
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html> 
