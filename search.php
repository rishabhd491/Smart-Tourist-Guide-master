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
    <title>Travel EZ - Search Results</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="css/main.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            padding-top: 80px;
            background-color: #f8f9fa;
            font-family: 'Poppins', sans-serif;
        }
        
        .navbar {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
        }
        
        #map { 
            height: 400px; 
            width: 100%; 
            margin: 20px 0;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .place-card {
            position: relative;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
            border: none;
        }
        
        .place-card img {
            border-radius: 8px;
            object-fit: cover;
            height: 180px;
        }
        
        .place-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .weather-card {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .photo-gallery img {
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .photo-gallery img:hover {
            transform: scale(1.05);
        }
        
        .review-card {
            border: none;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #fff;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .review-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .reviewer-photo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #f8f9fa;
        }
        
        .stars {
            color: #ffc107;
            font-size: 1.1rem;
        }
        
        .reviews-container {
            max-height: 70vh;
            overflow-y: auto;
            padding: 5px;
        }
        
        .weather-forecast {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .favorite-btn {
            color: #dc3545;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.2rem;
        }
        
        .favorite-btn:hover {
            transform: scale(1.2);
        }
        
        .share-btn {
            color: #007bff;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.2rem;
        }
        
        .share-btn:hover {
            transform: scale(1.2);
        }
        
        .carousel-item img {
            height: 250px;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .language-selector {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        #weather {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .weather-icon {
            width: 60px;
            height: 60px;
        }
        
        .price-badge {
            font-size: 0.9em;
            padding: 6px 12px;
            border-radius: 50px;
            background-color: #e3f2fd;
            color: #1e3c72;
            font-weight: 500;
        }
        
        .price-info {
            font-size: 0.9em;
            padding: 10px;
            border-radius: 8px;
            background-color: #e3f2fd;
            border-color: #90caf9;
        }
        
        .fa-dollar-sign {
            color: #28a745;
            margin-right: 3px;
        }
        
        .links-section {
            margin: 20px 0;
        }
        
        .links-section a {
            text-decoration: none;
            transition: all 0.3s ease;
            margin-right: 10px;
            margin-bottom: 10px;
            display: inline-block;
        }
        
        .links-section a:hover {
            transform: translateY(-3px);
        }
        
        .btn-outline-primary {
            border-color: #1e3c72;
            color: #1e3c72;
            border-radius: 50px;
            padding: 8px 20px;
        }
        
        .btn-outline-primary:hover {
            background-color: #1e3c72;
            border-color: #1e3c72;
            color: white;
        }
        
        .btn-outline-secondary {
            border-color: #6c757d;
            color: #6c757d;
            border-radius: 50px;
            padding: 8px 20px;
        }
        
        .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white;
        }
        
        .btn-outline-success {
            border-color: #28a745;
            color: #28a745;
            border-radius: 50px;
            padding: 8px 20px;
        }
        
        .btn-outline-success:hover {
            background-color: #28a745;
            color: white;
        }
        
        .marker-number {
            position: absolute;
            top: 15px;
            left: 15px;
            background: #dc3545;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 3px 6px rgba(0,0,0,0.2);
            z-index: 1;
            font-size: 0.9rem;
        }

        .place-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            font-size: 1.4rem;
        }
        
        .place-address {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        
        .place-rating {
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .place-description {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .info-window {
            padding: 15px;
            max-width: 300px;
            border-radius: 8px;
        }
        
        .info-window h5 {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .filters-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .filter-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        
        .custom-range::-webkit-slider-thumb {
            background: #1e3c72;
        }
        
        .custom-control-input:checked ~ .custom-control-label::before {
            background-color: #1e3c72;
            border-color: #1e3c72;
        }
        
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #1e3c72;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 999;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        
        .back-to-top.visible {
            opacity: 1;
        }
        
        .back-to-top:hover {
            transform: translateY(-5px);
        }
        
        .category-badge {
            background-color: #e3f2fd;
            color: #1e3c72;
            font-size: 0.8rem;
            padding: 5px 10px;
            border-radius: 50px;
            margin-right: 5px;
            margin-bottom: 5px;
            display: inline-block;
        }

        /* Traffic information styles */
        .traffic-info {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            background-color: #f8f9fa;
        }

        .best-route-badge {
            font-size: 0.8rem;
            font-weight: bold;
            padding: 4px 10px;
        }

        .route-alternatives {
            margin-top: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
        }

        .alternative-route {
            padding: 8px 10px;
            background-color: #f8f9fa;
            transition: background-color 0.2s;
        }

        .alternative-route:hover {
            background-color: #e9ecef;
        }

        .active-alternative {
            background-color: #e9ecef;
            font-weight: bold;
        }

        .current-route-badge {
            font-size: 0.8rem;
            font-weight: bold;
        }

        /* Handle traffic severity colors */
        .text-success .fa-car {
            color: #28a745;
        }
        
        .text-warning .fa-car {
            color: #ffc107;
        }
        
        .text-danger .fa-car {
            color: #dc3545;
        }
    </style>
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand" href="index.html">
                <i class="fas fa-map-marked-alt mr-2"></i>
                Travel EZ
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.html">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="aboutus/aboutus.html">About Us</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Destinations</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Sign Up</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-12">
                <h1 class="mb-4"><?php echo htmlspecialchars($query); ?> in <?php echo htmlspecialchars($city); ?></h1>
            </div>
        </div>
        
        <!-- Back to top button -->
        <button id="back-to-top" class="btn btn-primary back-to-top" title="Back to Top">
            <i class="fas fa-arrow-up"></i>
        </button>

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
                        <button onclick="showFavorites()" class="btn btn-danger position-relative">
                            <i class="fas fa-heart"></i> View Favorites
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark favorites-count d-none">
                                0
                            </span>
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
                                <form action="search.php" method="GET" class="search-form">
                                    <div class="mb-3">
                                        <label for="city" class="form-label">City</label>
                                        <input type="text" name="city" id="city" class="form-control" placeholder="Enter city name..." required value="<?php echo htmlspecialchars($city); ?>">
                                    </div>
                                    <div class="mb-3">
                                        <label for="query" class="form-label">What are you looking for?</label>
                                        <input type="text" name="query" id="query" class="form-control" placeholder="e.g., hotels, restaurants" required value="<?php echo htmlspecialchars($query); ?>">
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Search</button>
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
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Favorites will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-danger" onclick="clearAllFavorites()">
                            <i class="fas fa-trash"></i> Clear All Favorites
                        </button>
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

        <!-- Budget Modal -->
        <div class="modal fade" id="budgetModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-calculator"></i> Trip Budget Calculator</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
                                    <div class="form-group mb-3">
                                        <label>Number of People</label>
                                        <input type="number" id="numPeople" class="form-control" value="1" min="1">
                                    </div>
                                    <div class="form-group mb-3">
                                        <label>Number of Days</label>
                                        <input type="number" id="numDays" class="form-control" value="1" min="1">
                                    </div>
                                    <div class="form-group mb-3">
                                        <label>Travel Style</label>
                                        <select id="travelStyle" class="form-control">
                                            <option value="budget">Budget</option>
                                            <option value="moderate" selected>Moderate</option>
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
                                        <h5>Total Estimated Cost: <span id="totalCost">₹0</span></h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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

        <!-- Directions Modal -->
        <div class="modal fade" id="directionsModal" tabindex="-1" aria-labelledby="directionsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="directionsModalLabel">Directions</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="directions-panel"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="printDirections()">
                            <i class="fas fa-print"></i> Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- First load jQuery -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    
    <!-- Then load Bootstrap -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Initialize variables from PHP -->
    <script>
    // Safely pass PHP variables to JavaScript
    const appData = <?php echo json_encode($jsData, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
    const city = appData.city;
    const query = appData.query;

    // Back to top button functionality
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });

    $('#back-to-top').click(function() {
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });
    </script>

    <!-- Then include maps.js file -->
    <script src="js/maps.js"></script>

    <!-- Finally load Google Maps JavaScript API -->
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCtDXKm7whftI-ZckaVw2bj4nAKWx0O7FM&libraries=places&callback=initMap"></script>
</body>
</html> 
