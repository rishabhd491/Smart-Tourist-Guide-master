// Declare global variables
let map;
let service;
let markers = [];
let directionsService;
let directionsRenderer;
let infowindow;
let allPlaces = [];

// Initialize the map
function initMap() {
    // Initialize the map centered on the default location (or user's location if available)
    const defaultLocation = { lat: 20.5937, lng: 78.9629 }; // Default to India center
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });
    
    // Initialize services
    service = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false
    });
    infowindow = new google.maps.InfoWindow();
    
    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                // Add marker for user's location
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new google.maps.Size(40, 40)
                    }
                });
            },
            () => {
                // If geolocation fails, use the search parameters
                if (city && query) {
                    // Use geocoding to find city coordinates
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: city }, function(results, status) {
                        if (status === 'OK') {
                            map.setCenter(results[0].geometry.location);
                        }
                    });
                }
            }
        );
    }
    
    // Perform initial search
    searchPlaces();
    
    // Request the weather
    getWeather();
}

// Search for places
function searchPlaces() {
    // Create a search request using the city and query parameters
    const request = {
        query: `${query} in ${city}`,
        fields: ['name', 'geometry', 'formatted_address', 'photos', 'rating', 'place_id', 'types', 'opening_hours', 'price_level']
    };
    
    // Show a loading indicator
    document.getElementById('results').innerHTML = 
        '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">Searching for places...</p></div>';
    
    // Send the request to the Places Service
    service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            // Debug: Log returned places and check if they have price_level
            console.log('Places found:', results.length);
            const placesWithPrice = results.filter(place => place.price_level !== undefined);
            console.log('Places with price info:', placesWithPrice.length);
            
            // Store all places for filtering/sorting
            allPlaces = results;
            
            // Display the results
            displayResults(results);
            
            // Center the map on the first result
            map.setCenter(results[0].geometry.location);
        } else {
            // Handle no results or error
            document.getElementById('results').innerHTML = 
                '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> No places found. Please try a different search.</div>';
        }
    });
}

// Display search results
function displayResults(places) {
    // Clear existing markers
    clearMarkers();
    
    // Get the results container
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    // Debug: Count places with price information
    const placesWithPrice = places.filter(place => place.price_level !== undefined);
    console.log(`Displaying ${places.length} places. ${placesWithPrice.length} have price information.`);
    
    // Create results heading
    const heading = document.createElement('h3');
    heading.className = 'mb-4';
    heading.innerHTML = `Found ${places.length} places matching your search`;
    resultsDiv.appendChild(heading);
    
    // Add sorting options
    const sortingOptions = document.createElement('div');
    sortingOptions.className = 'sorting-options mb-4';
    sortingOptions.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="price-info-msg">
                <small class="text-muted">
                    ${placesWithPrice.length > 0 ? 
                    `${placesWithPrice.length} out of ${places.length} places have price information available` : 
                    'No price information available for these places. Try searching for hotels or restaurants.'}
                </small>
            </div>
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-sort"></i> Sort By
                </button>
                <ul class="dropdown-menu" aria-labelledby="sortDropdown">
                    <li><a class="dropdown-item" href="#" onclick="sortPlaces('rating', 'desc'); return false;"><i class="fas fa-star text-warning"></i> Highest Rating</a></li>
                    <li><a class="dropdown-item" href="#" onclick="sortPlaces('price', 'asc'); return false;"><i class="fas fa-dollar-sign text-success"></i> Price: Low to High</a></li>
                    <li><a class="dropdown-item" href="#" onclick="sortPlaces('price', 'desc'); return false;"><i class="fas fa-dollar-sign text-danger"></i> Price: High to Low</a></li>
                </ul>
            </div>
        </div>
    `;
    resultsDiv.insertBefore(sortingOptions, heading.nextSibling);
    
    // Create a row for the results
    const row = document.createElement('div');
    row.className = 'row';
    
    // Add each place to the results
    places.forEach((place, index) => {
        // Create a marker for the place
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            animation: google.maps.Animation.DROP,
            label: (index + 1).toString()
        });
        
        // Add marker to the markers array
        markers.push(marker);
        
        // Add click listener to marker
        marker.addListener('click', () => {
            // Show place details in info window
            showPlaceInfo(place, marker);
        });
        
        // Create a column for the place card
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        // Format price level for display
        const priceDisplay = place.price_level !== undefined ? 
            `<div class="price-level-badge">${getPriceLevelBadge(place.price_level)}</div>` : '';
        
        // Debug price level
        console.log(`Place "${place.name}" price_level:`, place.price_level);
        
        // Create a place card
        const card = document.createElement('div');
        card.className = 'place-card';
        card.innerHTML = `
            <div class="marker-number">${index + 1}</div>
            ${priceDisplay}
            <img src="${place.photos ? place.photos[0].getUrl() : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                alt="${place.name}" class="img-fluid mb-3 w-100">
            <h4 class="place-title">${place.name}</h4>
            <p class="place-address"><i class="fas fa-map-marker-alt text-danger"></i> ${place.formatted_address}</p>
            <div class="place-details d-flex justify-content-between align-items-center mb-2">
                <div class="place-rating">
                    ${getRatingStars(place.rating)} <span class="text-muted">(${place.rating || 'No rating'})</span>
                </div>
                ${place.price_level !== undefined ? 
                  `<div class="place-price"><i class="fas fa-dollar-sign"></i> ${getPriceLevel(place.price_level)}</div>` : 
                  '<div class="place-price text-muted"><small>No price info</small></div>'}
            </div>
            <div class="mb-3">
                ${getPlaceType(place.types)}
            </div>
            <div class="d-flex justify-content-between mb-2">
                <button class="btn btn-outline-primary btn-sm" onclick="showRoute(${place.geometry.location.lat()}, ${place.geometry.location.lng()}, '${place.name.replace(/'/g, "\\'")}')">
                    <i class="fas fa-route"></i> Directions
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="getPlaceDetails('${place.place_id}')">
                    <i class="fas fa-info-circle"></i> More Info
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="toggleFavorite('${place.place_id}', '${place.name.replace(/'/g, "\\'")}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        `;
        
        // Make the card clickable
        card.addEventListener('click', () => {
            // Pan to marker
            map.panTo(place.geometry.location);
            // Trigger marker click
            google.maps.event.trigger(marker, 'click');
        });
        
        // Add card to column
        col.appendChild(card);
        
        // Add column to row
        row.appendChild(col);
    });
    
    // Add row to results container
    resultsDiv.appendChild(row);
    
    // If no places have price info, show message
    if (placesWithPrice.length === 0) {
        const noPriceAlert = document.createElement('div');
        noPriceAlert.className = 'alert alert-info mt-3';
        noPriceAlert.innerHTML = `
            <i class="fas fa-info-circle"></i> 
            <strong>Price Information:</strong> No price data is available for these places. 
            Price information is typically available for restaurants, hotels, and some attractions. 
            Try searching for "hotels in ${city}" or "restaurants in ${city}" to see price information.
        `;
        resultsDiv.appendChild(noPriceAlert);
    }
}

// Get place details
function getPlaceDetails(placeId) {
    console.log("Getting details for place ID:", placeId);
    
    const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'rating', 'reviews', 'photos', 'price_level', 'url']
    };
    
    service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Debug: Check if place has price information
            console.log("Place details retrieved:", place.name);
            console.log("Price level:", place.price_level);
            
            // Create and show modal with place details
            showPlaceModal(place);
        } else {
            console.error("Error getting place details:", status);
        }
    });
}

// Show place details in a modal
function showPlaceModal(place) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="placeModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${place.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div id="placeCarousel" class="carousel slide" data-bs-ride="carousel">
                                    <div class="carousel-inner">
                                        ${getPlacePhotos(place.photos)}
                                    </div>
                                    <button class="carousel-control-prev" type="button" data-bs-target="#placeCarousel" data-bs-slide="prev">
                                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                    </button>
                                    <button class="carousel-control-next" type="button" data-bs-target="#placeCarousel" data-bs-slide="next">
                                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    ${place.price_level !== undefined ? 
                                      `<div class="price-info">
                                          <span class="price-badge badge bg-${getPriceBadgeColor(place.price_level)}">${getPriceBadgeText(place.price_level)}</span>
                                       </div>` : ''}
                                    ${place.opening_hours ? 
                                      `<div>
                                          ${place.opening_hours.isOpen() ? 
                                            '<span class="badge bg-success">Open Now</span>' : 
                                            '<span class="badge bg-danger">Closed</span>'}
                                       </div>` : ''}
                                </div>
                                <p><i class="fas fa-map-marker-alt"></i> ${place.formatted_address}</p>
                                ${place.formatted_phone_number ? `<p><i class="fas fa-phone"></i> ${place.formatted_phone_number}</p>` : ''}
                                ${place.website ? `<p><i class="fas fa-globe"></i> <a href="${place.website}" target="_blank">${place.website}</a></p>` : ''}
                                ${place.price_level !== undefined ? 
                                  `<div class="price-details mb-3 p-3 bg-light rounded">
                                      <h6><i class="fas fa-dollar-sign"></i> Price Information</h6>
                                      <p class="mb-1">${getPriceLevel(place.price_level)}</p>
                                      <p class="small text-muted mb-0">${getDetailedPriceDescription(place.price_level, place.types)}</p>
                                   </div>` : ''}
                                ${place.opening_hours ? `
                                    <div class="mb-3">
                                        <h6><i class="fas fa-clock"></i> Hours</h6>
                                        <div class="small">
                                            ${getOpeningHours(place.opening_hours)}
                                        </div>
                                    </div>
                                ` : ''}
                                <div class="mb-3">
                                    <h6><i class="fas fa-star text-warning"></i> Rating</h6>
                                    <p>${getRatingStars(place.rating)} ${place.rating || 'No rating'} ${place.rating ? `(${place.user_ratings_total} reviews)` : ''}</p>
                                </div>
                                <div class="links-section">
                                    <a href="${place.url}" class="btn btn-outline-primary" target="_blank">
                                        <i class="fab fa-google"></i> View on Google Maps
                                    </a>
                                    <button class="btn btn-outline-danger" onclick="toggleFavorite('${place.place_id}', '${place.name.replace(/'/g, "\\'")}')">
                                        <i class="fas fa-heart"></i> Save
                                    </button>
                                </div>
                            </div>
                        </div>
                        ${place.reviews ? `
                            <h5 class="mt-4 mb-3"><i class="fas fa-comment-alt"></i> Reviews</h5>
                            <div class="reviews-container">
                                ${getReviews(place.reviews)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('placeModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('placeModal'));
    modal.show();
}

// Helper function to get place photos for carousel
function getPlacePhotos(photos) {
    if (!photos || photos.length === 0) {
        return '<div class="carousel-item active"><img src="https://via.placeholder.com/600x400?text=No+Photos+Available" class="d-block w-100" alt="No photos"></div>';
    }
    
    let photosHTML = '';
    photos.forEach((photo, index) => {
        photosHTML += `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${photo.getUrl()}" class="d-block w-100" alt="Place photo ${index + 1}">
            </div>
        `;
    });
    
    return photosHTML;
}

// Helper function to get opening hours
function getOpeningHours(openingHours) {
    if (!openingHours || !openingHours.weekday_text) {
        return 'Opening hours not available';
    }
    
    let hoursHTML = '<ul class="list-unstyled mb-0">';
    openingHours.weekday_text.forEach(day => {
        hoursHTML += `<li>${day}</li>`;
    });
    hoursHTML += '</ul>';
    
    return hoursHTML;
}

// Helper function to get reviews
function getReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<p>No reviews available</p>';
    }
    
    let reviewsHTML = '';
    reviews.forEach(review => {
        const date = new Date(review.time * 1000).toLocaleDateString();
        reviewsHTML += `
            <div class="review-card mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="${review.profile_photo_url}" alt="${review.author_name}" class="reviewer-photo me-2">
                        <div>
                            <strong>${review.author_name}</strong>
                            <div class="text-muted small">${date}</div>
                        </div>
                    </div>
                    <div class="stars">${getRatingStars(review.rating)}</div>
                </div>
                <p class="mt-2">${review.text}</p>
            </div>
        `;
    });
    
    return reviewsHTML;
}

// Helper function to generate rating stars
function getRatingStars(rating) {
    if (!rating) return '';
    
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }
    
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-warning"></i>';
    }
    
    return stars;
}

// Helper function to get price level
function getPriceLevel(priceLevel) {
    if (priceLevel === undefined) return 'Price not available';
    
    const levels = ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive'];
    const dollarSigns = Array(priceLevel + 1).fill('$').join('');
    
    return `${dollarSigns} - ${levels[priceLevel]}`;
}

// Helper function to get place type badges
function getPlaceType(types) {
    if (!types || types.length === 0) return '';
    
    const typeMap = {
        'restaurant': 'Restaurant',
        'cafe': 'Cafe',
        'bar': 'Bar',
        'lodging': 'Hotel',
        'hotel': 'Hotel',
        'tourist_attraction': 'Attraction',
        'museum': 'Museum',
        'park': 'Park',
        'shopping_mall': 'Shopping',
        'store': 'Store',
        'supermarket': 'Supermarket',
        'point_of_interest': 'Point of Interest'
    };
    
    let badges = '';
    types.forEach(type => {
        if (typeMap[type]) {
            badges += `<span class="category-badge">${typeMap[type]}</span>`;
        }
    });
    
    return badges;
}

// Show place info in info window
function showPlaceInfo(place, marker) {
    // Create info window content
    const content = `
        <div class="info-window">
            <h5>${place.name}</h5>
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>${getRatingStars(place.rating)} <span class="text-muted small">(${place.rating || 'No rating'})</span></div>
                ${place.price_level !== undefined ? `<span class="badge bg-${getPriceBadgeColor(place.price_level)}">${getPriceBadgeText(place.price_level)}</span>` : ''}
            </div>
            <p class="small mb-2">${place.formatted_address}</p>
            <div class="d-flex flex-wrap gap-1 mb-2">
                ${getPlaceType(place.types)}
            </div>
            <button class="btn btn-primary btn-sm mt-2 w-100" onclick="getPlaceDetails('${place.place_id}')">
                View Details
            </button>
        </div>
    `;
    
    // Set info window content
    infowindow.setContent(content);
    
    // Open info window
    infowindow.open(map, marker);
}

// Helper function to get price badge color
function getPriceBadgeColor(priceLevel) {
    switch(priceLevel) {
        case 0: return 'success';
        case 1: return 'info';
        case 2: return 'primary';
        case 3: return 'warning';
        case 4: return 'danger';
        default: return 'secondary';
    }
}

// Helper function to get price badge text
function getPriceBadgeText(priceLevel) {
    switch(priceLevel) {
        case 0: return 'Free';
        case 1: return '$';
        case 2: return '$$';
        case 3: return '$$$';
        case 4: return '$$$$';
        default: return 'Price N/A';
    }
}

// Helper function to get detailed price description
function getDetailedPriceDescription(priceLevel, types) {
    let placeType = 'venue';
    
    // Determine specific type of place for more accurate descriptions
    if (types) {
        if (types.includes('restaurant') || types.includes('cafe') || types.includes('bar')) {
            placeType = 'restaurant';
        } else if (types.includes('lodging') || types.includes('hotel')) {
            placeType = 'hotel';
        } else if (types.includes('museum') || types.includes('tourist_attraction')) {
            placeType = 'attraction';
        } else if (types.includes('store') || types.includes('shopping_mall')) {
            placeType = 'shop';
        }
    }
    
    // Descriptions based on price level and place type
    const descriptions = {
        restaurant: [
            'Free or extremely inexpensive dining option.',
            'Budget-friendly restaurant, typically less than ₹500 per person.',
            'Mid-range restaurant, typically ₹500-1500 per person.',
            'Upscale restaurant, typically ₹1500-3000 per person.',
            'Fine dining or luxury restaurant, typically over ₹3000 per person.'
        ],
        hotel: [
            'Free or extremely low-cost accommodation.',
            'Budget accommodation, typically ₹1000-2000 per night.',
            'Mid-range accommodation, typically ₹2000-5000 per night.',
            'Upscale accommodation, typically ₹5000-10000 per night.',
            'Luxury accommodation, typically over ₹10000 per night.'
        ],
        attraction: [
            'Free attraction.',
            'Low-cost attraction, typically less than ₹300 per person.',
            'Mid-range attraction, typically ₹300-800 per person.',
            'Premium attraction, typically ₹800-1500 per person.',
            'Luxury experience, typically over ₹1500 per person.'
        ],
        shop: [
            'Free or extremely inexpensive items.',
            'Budget shopping, items typically in the lower price range.',
            'Mid-range shopping, items typically in the moderate price range.',
            'Upscale shopping, items typically in the higher price range.',
            'Luxury shopping, premium or designer items.'
        ],
        venue: [
            'Free or extremely inexpensive.',
            'Budget-friendly, lower price range.',
            'Mid-range pricing, moderate costs.',
            'Upscale pricing, higher than average costs.',
            'Premium pricing, very expensive.'
        ]
    };
    
    // Return appropriate description based on place type and price level
    if (priceLevel >= 0 && priceLevel <= 4) {
        return descriptions[placeType][priceLevel];
    }
    
    return 'Price information not available.';
}

// Show route to place
function showRoute(destLat, destLng, placeName) {
    // Clear any existing directions panel
    const directionsPanel = document.getElementById('directions-panel');
    if (directionsPanel) {
        directionsPanel.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">Calculating directions...</p></div>';
    }
    
    // Show directions modal
    const directionsModal = new bootstrap.Modal(document.getElementById('directionsModal'));
    directionsModal.show();
    
    // Set the destination name in the modal title
    document.getElementById('directionsModalLabel').textContent = `Directions to ${placeName}`;
    
    // If user's location is available, use it as the origin
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const origin = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Calculate route
                calculateRoute(origin, { lat: destLat, lng: destLng }, placeName);
            },
            () => {
                // If geolocation fails, use map center as origin
                const origin = map.getCenter();
                calculateRoute(origin, { lat: destLat, lng: destLng }, placeName);
            }
        );
    } else {
        // Use map center as origin
        const origin = map.getCenter();
        calculateRoute(origin, { lat: destLat, lng: destLng }, placeName);
    }
}

// Calculate route
function calculateRoute(origin, destination, placeName) {
    // Request route with all available transportation modes
    const travelModes = [
        { mode: google.maps.TravelMode.DRIVING, icon: 'car', label: 'Driving' },
        { mode: google.maps.TravelMode.WALKING, icon: 'walking', label: 'Walking' },
        { mode: google.maps.TravelMode.TRANSIT, icon: 'bus', label: 'Transit' },
        { mode: google.maps.TravelMode.BICYCLING, icon: 'bicycle', label: 'Cycling' }
    ];
    
    // Get the directions panel
    const directionsPanel = document.getElementById('directions-panel');
    
    // Create tabs for different travel modes
    let tabsHTML = '<ul class="nav nav-tabs" id="travelModeTabs" role="tablist">';
    let tabContentsHTML = '<div class="tab-content" id="travelModeTabsContent">';
    
    travelModes.forEach((travelMode, index) => {
        const isActive = index === 0 ? 'active' : '';
        const aria = index === 0 ? 'true' : 'false';
        const tabId = `${travelMode.icon}-tab`;
        const contentId = `${travelMode.icon}-content`;
        
        tabsHTML += `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${isActive}" id="${tabId}" data-bs-toggle="tab" data-bs-target="#${contentId}" 
                        type="button" role="tab" aria-controls="${contentId}" aria-selected="${aria}">
                    <i class="fas fa-${travelMode.icon}"></i> ${travelMode.label}
                </button>
            </li>
        `;
        
        tabContentsHTML += `
            <div class="tab-pane fade show ${isActive}" id="${contentId}" role="tabpanel" aria-labelledby="${tabId}">
                <div id="${travelMode.icon}-directions" class="directions-container">
                    <div class="text-center py-4">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p class="mt-2">Calculating ${travelMode.label} directions...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Calculate route for this travel mode
        calculateRouteForMode(origin, destination, travelMode.mode, travelMode.icon);
    });
    
    tabsHTML += '</ul>';
    tabContentsHTML += '</div>';
    
    // Set the content of the directions panel
    directionsPanel.innerHTML = tabsHTML + tabContentsHTML;
}

// Calculate route for a specific travel mode
function calculateRouteForMode(origin, destination, travelMode, modeId) {
    const request = {
        origin: origin,
        destination: destination,
        travelMode: travelMode,
        provideRouteAlternatives: true,
        unitSystem: google.maps.UnitSystem.METRIC
    };
    
    // Add traffic information for driving routes
    if (travelMode === google.maps.TravelMode.DRIVING) {
        request.drivingOptions = {
            departureTime: new Date(), // Current time
            trafficModel: google.maps.TrafficModel.BEST_GUESS
        };
    }
    
    // If transit mode, add transit options
    if (travelMode === google.maps.TravelMode.TRANSIT) {
        request.transitOptions = {
            departureTime: new Date(),
            modes: [
                google.maps.TransitMode.BUS,
                google.maps.TransitMode.RAIL,
                google.maps.TransitMode.SUBWAY,
                google.maps.TransitMode.TRAIN,
                google.maps.TransitMode.TRAM
            ],
            routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
        };
    }
    
    // Create a new DirectionsRenderer for this mode
    const renderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        preserveViewport: false
    });
    
    directionsService.route(request, (response, status) => {
        const directionsContainer = document.getElementById(`${modeId}-directions`);
        
        if (status === 'OK') {
            // Display route on map (only for the active tab)
            if (document.getElementById(`${modeId}-tab`).classList.contains('active')) {
                renderer.setDirections(response);
                directionsRenderer = renderer;
            }
            
            // Store the renderer on the container element for future reference
            directionsContainer.__directionsRenderer = renderer;
            
            // Create directions panel content
            directionsContainer.innerHTML = '';
            
            // Create wrapper for directions
            const directionsWrapper = document.createElement('div');
            directionsWrapper.className = 'directions-wrapper';
            
            // Get all routes for comparison
            const routes = response.routes;
            
            // Data for comparing routes by traffic
            let bestTrafficRoute = 0;
            let bestTrafficDuration = Infinity;
            let hasTrafficInfo = false;
            
            // Find the route with the least traffic if this is driving mode
            if (travelMode === google.maps.TravelMode.DRIVING && routes.length > 1) {
                routes.forEach((route, idx) => {
                    const leg = route.legs[0];
                    // Check if duration_in_traffic is available
                    if (leg.duration_in_traffic) {
                        hasTrafficInfo = true;
                        if (leg.duration_in_traffic.value < bestTrafficDuration) {
                            bestTrafficDuration = leg.duration_in_traffic.value;
                            bestTrafficRoute = idx;
                        }
                    }
                });
            }
            
            // Use the best traffic route for driving, otherwise use the first route
            const routeIndex = (travelMode === google.maps.TravelMode.DRIVING && hasTrafficInfo) ? bestTrafficRoute : 0;
            const route = routes[routeIndex];
            const leg = route.legs[0];

            // Show traffic layer if this is driving mode
            if (travelMode === google.maps.TravelMode.DRIVING) {
                // Add traffic layer to map
                const trafficLayer = new google.maps.TrafficLayer();
                trafficLayer.setMap(map);
            }
            
            // Create summary panel
            const summaryPanel = document.createElement('div');
            summaryPanel.className = 'directions-summary';
            
            // Add traffic information if available for driving mode
            let trafficInfoHTML = '';
            if (travelMode === google.maps.TravelMode.DRIVING && leg.duration_in_traffic) {
                const normalDuration = leg.duration.value;
                const trafficDuration = leg.duration_in_traffic.value;
                const trafficRatio = trafficDuration / normalDuration;
                
                let trafficSeverity = 'Low';
                let trafficColor = 'text-success';
                
                if (trafficRatio > 1.5) {
                    trafficSeverity = 'High';
                    trafficColor = 'text-danger';
                } else if (trafficRatio > 1.2) {
                    trafficSeverity = 'Medium';
                    trafficColor = 'text-warning';
                }
                
                trafficInfoHTML = `
                    <div class="traffic-info mt-2 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="h5 ${trafficColor} mb-0">
                                    <i class="fas fa-car"></i> Traffic: ${trafficSeverity}
                                </div>
                                <div class="text-muted">Normal duration: ${leg.duration.text}</div>
                                <div class="text-muted">With traffic: ${leg.duration_in_traffic.text}</div>
                            </div>
                            ${routes.length > 1 ? 
                              `<div class="best-route-badge bg-success text-white px-2 py-1 rounded-pill">
                                  <i class="fas fa-check-circle"></i> Recommended Route
                               </div>` : ''}
                        </div>
                    </div>
                `;
                
                // If we have alternative routes, add a comparison
                if (routes.length > 1) {
                    trafficInfoHTML += `<div class="route-alternatives mb-3">`;
                    
                    routes.forEach((altRoute, idx) => {
                        if (idx !== routeIndex) { // Skip the current route
                            const altLeg = altRoute.legs[0];
                            const altTrafficDuration = altLeg.duration_in_traffic ? altLeg.duration_in_traffic.text : altLeg.duration.text;
                            const isLonger = altLeg.duration_in_traffic && altLeg.duration_in_traffic.value > trafficDuration;
                            const timeDiff = altLeg.duration_in_traffic ? 
                                Math.abs(altLeg.duration_in_traffic.value - trafficDuration) / 60 : 0;
                            
                            trafficInfoHTML += `
                                <div class="alternative-route d-flex justify-content-between align-items-center py-1 border-bottom">
                                    <div>Alternative route ${idx + 1}</div>
                                    <div class="${isLonger ? 'text-danger' : 'text-success'}">
                                        ${altTrafficDuration} 
                                        <span class="ms-1">
                                            (${isLonger ? '+' : '-'}${Math.round(timeDiff)} min)
                                        </span>
                                    </div>
                                    <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="switchRoute(${idx}, '${modeId}')">
                                        View
                                    </button>
                                </div>
                            `;
                        }
                    });
                    
                    trafficInfoHTML += `</div>`;
                }
            }
            
            summaryPanel.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <div class="h5 mb-0">${leg.distance.text}</div>
                        <div class="text-muted">Distance</div>
                    </div>
                    <div>
                        <div class="h5 mb-0">
                            ${travelMode === google.maps.TravelMode.DRIVING && leg.duration_in_traffic ? 
                              leg.duration_in_traffic.text : leg.duration.text}
                        </div>
                        <div class="text-muted">Duration</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="toggleRouteDetails('${modeId}-steps')">
                            <i class="fas fa-list"></i> Details
                        </button>
                    </div>
                </div>
                ${trafficInfoHTML}
                <div class="d-flex mb-3">
                    <div class="route-start">
                        <i class="fas fa-map-marker-alt text-success"></i>
                        <span class="ms-2">${leg.start_address}</span>
                    </div>
                </div>
                <div class="d-flex">
                    <div class="route-end">
                        <i class="fas fa-map-marker-alt text-danger"></i>
                        <span class="ms-2">${leg.end_address}</span>
                    </div>
                </div>
            `;
            
            // Create steps panel
            const stepsPanel = document.createElement('div');
            stepsPanel.id = `${modeId}-steps`;
            stepsPanel.className = 'directions-steps collapse mt-3';
            
            // Add each step
            const steps = leg.steps;
            let stepsHTML = '<h6 class="mb-3">Step-by-Step Directions</h6>';
            stepsHTML += '<div class="list-group">';
            
            steps.forEach((step, index) => {
                let stepIcon = 'arrow-right';
                let stepClass = '';
                
                // Determine step icon based on travel mode and instructions
                if (step.travel_mode === 'WALKING') {
                    stepIcon = 'walking';
                } else if (step.travel_mode === 'TRANSIT') {
                    stepIcon = step.transit?.line?.vehicle?.type?.toLowerCase() === 'bus' ? 'bus' : 'subway';
                    stepClass = 'transit-step';
                    
                    // Add transit details
                    stepsHTML += `
                        <div class="list-group-item transit-header ${stepClass}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="fas fa-${stepIcon} transit-icon"></i>
                                    ${step.transit?.line?.short_name ? 
                                      `<span class="transit-line-name">${step.transit.line.short_name}</span>` : ''}
                                    ${step.transit?.line?.name ? 
                                      `<span class="ms-2">${step.transit.line.name}</span>` : ''}
                                </div>
                                <div class="text-muted">${step.duration.text}</div>
                            </div>
                            <div class="mt-2">
                                <div class="small">
                                    <strong>From:</strong> ${step.transit?.departure_stop?.name || 'N/A'}
                                </div>
                                <div class="small">
                                    <strong>To:</strong> ${step.transit?.arrival_stop?.name || 'N/A'}
                                </div>
                                <div class="small">
                                    <strong>Departure:</strong> 
                                    ${step.transit?.departure_time ? new Date(step.transit.departure_time.value).toLocaleTimeString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Add regular step with instructions
                stepsHTML += `
                    <div class="list-group-item ${stepClass}" data-step="${index}">
                        <div class="d-flex">
                            <div class="step-number">${index + 1}</div>
                            <div class="step-content">
                                <div class="step-instruction">${step.instructions}</div>
                                <div class="step-distance text-muted small">${step.distance.text} · ${step.duration.text}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            stepsHTML += '</div>';
            stepsPanel.innerHTML = stepsHTML;
            
            // Add summary and steps to wrapper
            directionsWrapper.appendChild(summaryPanel);
            directionsWrapper.appendChild(stepsPanel);
            
            // Add wrapper to container
            directionsContainer.appendChild(directionsWrapper);
            
            // Add click handlers for steps to highlight on map
            steps.forEach((step, index) => {
                const stepElement = directionsContainer.querySelector(`[data-step="${index}"]`);
                if (stepElement) {
                    stepElement.addEventListener('click', () => {
                        // Highlight the step on the map
                        renderer.setOptions({
                            polylineOptions: {
                                strokeColor: '#1e3c72',
                                strokeWeight: 5
                            }
                        });
                        renderer.setRouteIndex(0);
                        
                        // Center the map on this step
                        const stepLatLng = step.start_location;
                        map.setCenter(stepLatLng);
                        map.setZoom(16);
                    });
                }
            });
            
            // Add event listener to the tab to show the route on tab change
            document.getElementById(`${modeId}-tab`).addEventListener('shown.bs.tab', function() {
                renderer.setDirections(response);
            });
        } else {
            // Show error message
            directionsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Could not calculate ${modeId} directions: ${status}
                </div>
            `;
        }
    });
}

// Toggle route details
function toggleRouteDetails(stepsId) {
    const stepsElement = document.getElementById(stepsId);
    if (stepsElement) {
        const collapse = new bootstrap.Collapse(stepsElement);
        collapse.toggle();
    }
}

// Switch to a different route
function switchRoute(routeIndex, modeId) {
    // Get the active tab's direction renderer
    const activeModeId = document.querySelector('.nav-link.active').id.split('-')[0];
    
    // Only proceed if the active tab matches the requested tab
    if (activeModeId === modeId) {
        // Get the directions container
        const directionsContainer = document.getElementById(`${modeId}-directions`);
        if (!directionsContainer) return;
        
        // Create a new renderer
        const renderer = new google.maps.DirectionsRenderer({
            map: map,
            routeIndex: routeIndex,
            suppressMarkers: false,
            preserveViewport: false
        });
        
        // Store the newly created renderer
        directionsRenderer = renderer;
        
        // Get the current direction result from the map
        const currentRenderer = document.querySelector(`.tab-pane.active .directions-container`).__directionsRenderer;
        if (!currentRenderer || !currentRenderer.getDirections()) return;
        
        const directions = currentRenderer.getDirections();
        if (directions) {
            // Set the route index to display
            renderer.setDirections(directions);
            
            // Store the renderer on the container element for future reference
            directionsContainer.__directionsRenderer = renderer;
            
            // Update the UI to show the selected route as active
            const alternatives = directionsContainer.querySelectorAll('.alternative-route');
            alternatives.forEach((alt, idx) => {
                if (idx === routeIndex - 1) { // -1 because we skip the current route in the list
                    alt.classList.add('active-alternative');
                } else {
                    alt.classList.remove('active-alternative');
                }
            });
            
            // Add a "Current Route" indicator
            const currentBadge = document.createElement('span');
            currentBadge.className = 'current-route-badge ms-2 text-primary';
            currentBadge.innerHTML = '<i class="fas fa-check"></i> Current';
            
            // Remove any existing badges
            directionsContainer.querySelectorAll('.current-route-badge').forEach(badge => badge.remove());
            
            // Add the badge to the clicked alternative
            const buttonCell = alternatives[routeIndex - 1]?.querySelector('button').parentNode;
            if (buttonCell) {
                buttonCell.appendChild(currentBadge);
            }
            
            // Update the best route indicator if this is a driving route
            const trafficInfo = directionsContainer.querySelector('.traffic-info');
            if (trafficInfo) {
                const bestRouteBadge = trafficInfo.querySelector('.best-route-badge');
                if (bestRouteBadge) {
                    // Get the currently selected route's traffic info
                    const route = directions.routes[routeIndex];
                    const leg = route.legs[0];
                    
                    // Update traffic info section
                    const normalDuration = leg.duration.value;
                    const trafficDuration = leg.duration_in_traffic ? leg.duration_in_traffic.value : normalDuration;
                    const trafficRatio = trafficDuration / normalDuration;
                    
                    let trafficSeverity = 'Low';
                    let trafficColor = 'text-success';
                    
                    if (trafficRatio > 1.5) {
                        trafficSeverity = 'High';
                        trafficColor = 'text-danger';
                    } else if (trafficRatio > 1.2) {
                        trafficSeverity = 'Medium';
                        trafficColor = 'text-warning';
                    }
                    
                    // Find the traffic heading and update it
                    const trafficHeading = trafficInfo.querySelector('.h5');
                    if (trafficHeading) {
                        trafficHeading.className = `h5 ${trafficColor} mb-0`;
                        trafficHeading.innerHTML = `<i class="fas fa-car"></i> Traffic: ${trafficSeverity}`;
                    }
                    
                    // Update duration with traffic
                    const durationInfo = trafficInfo.querySelectorAll('.text-muted');
                    if (durationInfo.length >= 2) {
                        durationInfo[0].textContent = `Normal duration: ${leg.duration.text}`;
                        durationInfo[1].textContent = `With traffic: ${leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration.text}`;
                    }
                    
                    // Check if this is the best route for traffic
                    let bestRoute = 0;
                    let bestDuration = Infinity;
                    
                    directions.routes.forEach((r, i) => {
                        const l = r.legs[0];
                        if (l.duration_in_traffic && l.duration_in_traffic.value < bestDuration) {
                            bestDuration = l.duration_in_traffic.value;
                            bestRoute = i;
                        }
                    });
                    
                    // If this is the route with best traffic, show the badge, otherwise hide it
                    if (routeIndex === bestRoute) {
                        bestRouteBadge.style.display = 'block';
                    } else {
                        bestRouteBadge.style.display = 'none';
                    }
                }
            }
            
            // Update the main duration display
            const durationDisplay = directionsContainer.querySelector('.directions-summary .h5');
            if (durationDisplay) {
                const route = directions.routes[routeIndex];
                const leg = route.legs[0];
                durationDisplay.textContent = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration.text;
            }
        }
    }
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Toggle favorite
function toggleFavorite(placeId, placeName) {
    // Get favorites from local storage
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Check if already favorited
    const index = favorites.findIndex(fav => fav.id === placeId);
    
    if (index === -1) {
        // Add to favorites
        favorites.push({
            id: placeId,
            name: placeName,
            timestamp: Date.now()
        });
        
        // Show success message
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-success text-white">
                        <i class="fas fa-heart me-2"></i>
                        <strong class="me-auto">Added to Favorites</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        "${placeName}" has been added to your favorites!
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.querySelector('.toast');
            if (toastElement) {
                const bsToast = new bootstrap.Toast(toastElement);
                bsToast.hide();
            }
        }, 3000);
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        
        // Show success message
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-secondary text-white">
                        <i class="fas fa-heart-broken me-2"></i>
                        <strong class="me-auto">Removed from Favorites</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        "${placeName}" has been removed from your favorites.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.querySelector('.toast');
            if (toastElement) {
                const bsToast = new bootstrap.Toast(toastElement);
                bsToast.hide();
            }
        }, 3000);
    }
    
    // Save to local storage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update favorites count if exists
    updateFavoritesCount();
}

// Show favorites
function showFavorites() {
    // Get favorites from local storage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Get the modal body
    const modalBody = document.querySelector('#favoritesModal .modal-body');
    
    // Clear previous content
    modalBody.innerHTML = '';
    
    if (favorites.length === 0) {
        // Show empty message
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-heart-broken fa-3x text-muted mb-3"></i>
                <h5>You haven't saved any favorites yet</h5>
                <p class="text-muted">Explore places and click the heart icon to save them here!</p>
            </div>
        `;
    } else {
        // Create container for favorites
        const container = document.createElement('div');
        container.className = 'favorites-container';
        
        // Create buttons for sorting and clearing
        const actionButtons = document.createElement('div');
        actionButtons.className = 'd-flex justify-content-end mb-3';
        actionButtons.innerHTML = `
            <button class="btn btn-outline-danger" onclick="clearAllFavorites()">
                <i class="fas fa-trash"></i> Clear All
            </button>
        `;
        container.appendChild(actionButtons);
        
        // Create list group for favorites
        const listGroup = document.createElement('div');
        listGroup.className = 'list-group';
        
        // Sort favorites by most recent first
        favorites.sort((a, b) => b.timestamp - a.timestamp);
        
        // Add each favorite to the list
        favorites.forEach(favorite => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'list-group-item d-flex justify-content-between align-items-center favorite-item';
            favoriteItem.setAttribute('data-place-id', favorite.id);
            
            // Format the date
            let dateStr = 'Invalid Date';
            try {
                dateStr = new Date(favorite.timestamp).toLocaleDateString();
            } catch (e) {
                console.error('Error formatting date:', e);
            }
            
            favoriteItem.innerHTML = `
                <div>
                    <h5 class="mb-1">${favorite.name}</h5>
                    <p class="mb-1 text-muted small">Saved on ${dateStr}</p>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary directions-btn" onclick="event.stopPropagation(); getFavoriteDirections('${favorite.id}', '${favorite.name.replace(/'/g, "\\'")}');">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); showFavoriteOnMap('${favorite.id}');">
                        <i class="fas fa-map-marker-alt"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" onclick="event.stopPropagation(); removeFavorite('${favorite.id}');">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            listGroup.appendChild(favoriteItem);
        });
        
        container.appendChild(listGroup);
        modalBody.appendChild(container);
    }
    
    // Show the modal
    const favoritesModal = new bootstrap.Modal(document.getElementById('favoritesModal'));
    favoritesModal.show();
}

// Get directions for a favorite place
function getFavoriteDirections(placeId, placeName) {
    // Add debug logging
    console.log('Getting directions for favorite place:', placeId, placeName);
    
    // Hide the favorites modal first
    const favoritesModal = bootstrap.Modal.getInstance(document.getElementById('favoritesModal'));
    if (favoritesModal) {
        favoritesModal.hide();
    }
    
    // Show loading toast
    const loadingToast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show loading-toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-info text-white">
                    <i class="fas fa-spinner fa-spin me-2"></i>
                    <strong class="me-auto">Loading Directions</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Getting directions to "${placeName}"...
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingToast);
    
    // Get place details to extract coordinates
    const request = {
        placeId: placeId,
        fields: ['name', 'geometry']
    };
    
    // Add a delay to ensure the modal has time to close
    setTimeout(() => {
        service.getDetails(request, (place, status) => {
            // Close the loading toast
            const loadingToastEl = document.querySelector('.loading-toast');
            if (loadingToastEl) {
                const bsToast = bootstrap.Toast.getInstance(loadingToastEl) || new bootstrap.Toast(loadingToastEl);
                bsToast.hide();
                setTimeout(() => loadingToastEl.remove(), 500);
            }
            
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
                // Extract location
                const destLat = place.geometry.location.lat();
                const destLng = place.geometry.location.lng();
                
                // Call the existing showRoute function
                showRoute(destLat, destLng, placeName);
            } else {
                // Show error toast
                console.error('Error getting place details:', status);
                const toast = `
                    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                            <div class="toast-header bg-danger text-white">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <strong class="me-auto">Error</strong>
                                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                            </div>
                            <div class="toast-body">
                                Could not get directions for "${placeName}". Status: ${status}
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', toast);
                
                // Auto-close the toast after 3 seconds
                setTimeout(() => {
                    const toastElement = document.querySelector('.toast');
                    if (toastElement) {
                        const bsToast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                        bsToast.hide();
                    }
                }, 3000);
            }
        });
    }, 500); // Half-second delay
}

// Remove a single favorite
function removeFavorite(placeId) {
    console.log('Removing favorite with ID:', placeId);
    
    // Get favorites from local storage
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Find the favorite by ID
    const index = favorites.findIndex(fav => fav.id === placeId);
    
    if (index !== -1) {
        // Get the name
        const placeName = favorites[index].name;
        console.log('Removing favorite:', placeName);
        
        // Remove from favorites
        favorites.splice(index, 1);
        
        // Save to local storage
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // Show notification
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show delete-toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-secondary text-white">
                        <i class="fas fa-heart-broken me-2"></i>
                        <strong class="me-auto">Removed from Favorites</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        "${placeName}" has been removed from your favorites.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.querySelector('.delete-toast');
            if (toastElement) {
                const bsToast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                bsToast.hide();
                // Remove the toast element after hiding
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        toastElement.parentNode.removeChild(toastElement);
                    }
                }, 500);
            }
        }, 3000);
        
        // Update favorites count if exists
        updateFavoritesCount();
        
        // Try to find the item directly from the event's context or using jQuery
        let favoriteItem;
        
        // Try different methods to find the item
        // Method 1: Direct DOM access
        favoriteItem = document.querySelector(`[data-place-id="${placeId}"]`);
        
        // Method 2: If event is available (we'll modify the HTML to include this info directly)
        if (!favoriteItem) {
            // Refresh the entire favorites modal
            showFavorites();
            return;
        }
        
        // If found, animate and remove
        if (favoriteItem) {
            try {
                // Animate removal
                favoriteItem.style.transition = 'all 0.3s ease';
                favoriteItem.style.opacity = '0';
                favoriteItem.style.height = '0';
                favoriteItem.style.overflow = 'hidden';
                
                // Remove the item after animation
                setTimeout(() => {
                    try {
                        if (favoriteItem.parentNode) {
                            favoriteItem.parentNode.removeChild(favoriteItem);
                        }
                        
                        // If no favorites left, update the UI
                        if (favorites.length === 0) {
                            const modalBody = document.querySelector('#favoritesModal .modal-body');
                            if (modalBody) {
                                modalBody.innerHTML = `
                                    <div class="text-center py-5">
                                        <i class="fas fa-heart-broken fa-3x text-muted mb-3"></i>
                                        <h5>You haven't saved any favorites yet</h5>
                                        <p class="text-muted">Explore places and click the heart icon to save them here!</p>
                                    </div>
                                `;
                            }
                        }
                    } catch (err) {
                        console.error('Error removing favorite item from DOM:', err);
                        // Fallback: refresh the entire modal
                        showFavorites();
                    }
                }, 300);
            } catch (err) {
                console.error('Error animating favorite item:', err);
                // Fallback: refresh the entire modal
                showFavorites();
            }
        } else {
            // If still can't find the item, refresh the whole modal
            console.log('Could not find favorite item in DOM, refreshing modal');
            showFavorites();
        }
    } else {
        console.error('Favorite not found:', placeId);
        // Show error toast
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-danger text-white">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong class="me-auto">Error</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        Could not delete favorite. Item not found.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.querySelector('.toast');
            if (toastElement) {
                const bsToast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                bsToast.hide();
            }
        }, 3000);
    }
}

// Clear all favorites
function clearAllFavorites() {
    console.log('Clearing all favorites');
    
    // Ask for confirmation
    if (confirm('Are you sure you want to clear all favorites?')) {
        // Clear favorites from local storage
        localStorage.removeItem('favorites');
        
        // Show notification
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show clear-toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-secondary text-white">
                        <i class="fas fa-broom me-2"></i>
                        <strong class="me-auto">Favorites Cleared</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        All favorites have been cleared.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.querySelector('.clear-toast');
            if (toastElement) {
                const bsToast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                bsToast.hide();
                // Remove the toast element after hiding
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        toastElement.parentNode.removeChild(toastElement);
                    }
                }, 500);
            }
        }, 3000);
        
        // Update the favorites modal directly
        const modalBody = document.querySelector('#favoritesModal .modal-body');
        if (modalBody) {
            // Add fade-out animation
            modalBody.style.transition = 'opacity 0.3s ease';
            modalBody.style.opacity = '0';
            
            // Update content after fade out
            setTimeout(() => {
                modalBody.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-heart-broken fa-3x text-muted mb-3"></i>
                        <h5>You haven't saved any favorites yet</h5>
                        <p class="text-muted">Explore places and click the heart icon to save them here!</p>
                    </div>
                `;
                modalBody.style.opacity = '1';
            }, 300);
        }
        
        // Update favorites count if exists
        updateFavoritesCount();
    }
}

// Show favorite place on map
function showFavoriteOnMap(placeId) {
    // Add debug logging
    console.log('Showing favorite place on map:', placeId);
    
    // Hide the favorites modal
    const favoritesModal = bootstrap.Modal.getInstance(document.getElementById('favoritesModal'));
    if (favoritesModal) {
        favoritesModal.hide();
    }
    
    // Show loading toast
    const placeName = document.querySelector(`[data-place-id="${placeId}"] h5`).textContent;
    const loadingToast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show loading-toast-view" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-info text-white">
                    <i class="fas fa-spinner fa-spin me-2"></i>
                    <strong class="me-auto">Loading Place</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Loading details for "${placeName}"...
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingToast);
    
    // Add a delay to ensure the modal has time to close
    setTimeout(() => {
        // Get place details and show on map
        const request = {
            placeId: placeId,
            fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'rating', 'reviews', 'photos', 'price_level', 'url', 'geometry']
        };
        
        service.getDetails(request, (place, status) => {
            // Close the loading toast
            const loadingToastEl = document.querySelector('.loading-toast-view');
            if (loadingToastEl) {
                const bsToast = bootstrap.Toast.getInstance(loadingToastEl) || new bootstrap.Toast(loadingToastEl);
                bsToast.hide();
                setTimeout(() => loadingToastEl.remove(), 500);
            }
            
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                // First center the map on the place location
                if (place.geometry && place.geometry.location) {
                    map.setCenter(place.geometry.location);
                    map.setZoom(15);
                    
                    // Add a marker if needed
                    new google.maps.Marker({
                        position: place.geometry.location,
                        map: map,
                        title: place.name,
                        animation: google.maps.Animation.DROP
                    });
                }
                
                // Show place modal
                showPlaceModal(place);
            } else {
                // Show error toast
                console.error('Error getting place details for view:', status);
                const toast = `
                    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                            <div class="toast-header bg-danger text-white">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <strong class="me-auto">Error</strong>
                                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                            </div>
                            <div class="toast-body">
                                Could not load details for "${placeName}". Status: ${status}
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', toast);
                
                // Auto-close the toast after 3 seconds
                setTimeout(() => {
                    const toastElement = document.querySelector('.toast');
                    if (toastElement) {
                        const bsToast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                        bsToast.hide();
                    }
                }, 3000);
            }
        });
    }, 500); // Half-second delay
}

// Update favorites count
function updateFavoritesCount() {
    // Get the count badge
    const countBadge = document.querySelector('.favorites-count');
    
    if (countBadge) {
        // Get the current count of favorites
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        // Update the badge
        countBadge.textContent = favorites.length.toString();
        
        // Toggle visibility
        if (favorites.length === 0) {
            countBadge.classList.add('d-none');
        } else {
            countBadge.classList.remove('d-none');
        }
    }
}

// Get weather data
function getWeather() {
    // Get weather container
    const weatherDiv = document.getElementById('weather');
    if (!weatherDiv) return;
    
    // Show loading indicator
    weatherDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading weather data...</div>';
    
    // Check if city is available
    if (!city) {
        weatherDiv.innerHTML = '<div class="alert alert-warning">Please enter a city to see weather information.</div>';
        return;
    }
    
    // Get the PHP proxy URL for weather
    const apiUrl = `weather-proxy.php?city=${encodeURIComponent(city)}`;
    
    // Fetch weather data
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Check if data is valid
            if (data.cod === 200) {
                // Format weather data
                const temperature = Math.round(data.main.temp);
                const description = data.weather[0].description;
                const icon = data.weather[0].icon;
                const humidity = data.main.humidity;
                const windSpeed = data.wind.speed;
                
                // Update weather container
                weatherDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>${data.name}</h3>
                            <div class="d-flex align-items-center">
                                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="weather-icon">
                                <div class="ms-2">
                                    <div class="h2 mb-0">${temperature}°C</div>
                                    <div>${description}</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="mb-2"><i class="fas fa-tint text-primary"></i> Humidity: ${humidity}%</div>
                            <div><i class="fas fa-wind text-secondary"></i> Wind: ${windSpeed} m/s</div>
                        </div>
                    </div>
                `;
            } else {
                // Show error message
                weatherDiv.innerHTML = '<div class="alert alert-warning">Weather information unavailable</div>';
            }
        })
        .catch(error => {
            console.error('Weather fetch error:', error);
            weatherDiv.innerHTML = '<div class="alert alert-warning">Weather information unavailable</div>';
        });
}

// Print directions
function printDirections() {
    // Get the active tab content
    const activeTabContent = document.querySelector('.tab-pane.active');
    if (!activeTabContent) return;
    
    // Get the place name from the modal title
    const placeName = document.getElementById('directionsModalLabel').textContent.replace('Directions to ', '');
    
    // Create a new window
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    
    // Create the print content
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Directions to ${placeName}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    font-size: 14px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #ddd;
                }
                .directions-summary {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .directions-steps {
                    margin-top: 20px;
                }
                .step-number {
                    background-color: #1e3c72;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                    flex-shrink: 0;
                }
                .step-content {
                    flex-grow: 1;
                }
                .list-group-item {
                    display: flex;
                    align-items: flex-start;
                    padding: 10px 15px;
                    border-left: none;
                    border-right: none;
                    margin-bottom: 1px;
                }
                .transit-header {
                    background-color: #e9ecef;
                }
                .transit-icon {
                    margin-right: 5px;
                }
                .transit-line-name {
                    background-color: #1e3c72;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 12px;
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                    a[href]:after {
                        content: none !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Directions to ${placeName}</h2>
                <p>Generated by Travel EZ on ${new Date().toLocaleDateString()}</p>
                <button class="btn btn-primary no-print" onclick="window.print()">Print Directions</button>
            </div>
            <div class="container">
                ${activeTabContent.innerHTML}
            </div>
            <div class="footer">
                <p>Powered by Travel EZ - Smart Tourist Guide</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Focus the new window
    printWindow.focus();
}

// Calculate budget for trip
function calculateBudget() {
    // Show the budget modal
    const budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
    budgetModal.show();
    
    // Update saved places list
    updateSavedPlacesList();
    
    // Update cost breakdown based on initial values
    updateCostBreakdown();
    
    // Add event listeners to update costs when values change
    document.getElementById('numPeople').addEventListener('change', updateCostBreakdown);
    document.getElementById('numDays').addEventListener('change', updateCostBreakdown);
    document.getElementById('travelStyle').addEventListener('change', updateCostBreakdown);
}

// Update saved places list in budget calculator
function updateSavedPlacesList() {
    // Get the saved places container
    const savedPlacesContainer = document.getElementById('savedPlacesList');
    
    // Get favorites from local storage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Clear previous content
    savedPlacesContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        // Show empty message
        savedPlacesContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 
                You haven't saved any places yet. Add places to your favorites to include them in your budget calculation.
            </div>
        `;
    } else {
        // Add each favorite to the list
        favorites.forEach(favorite => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            favoriteItem.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input include-in-budget" type="checkbox" value="${favorite.id}" id="place-${favorite.id}" checked>
                    <label class="form-check-label" for="place-${favorite.id}">
                        ${favorite.name}
                    </label>
                </div>
            `;
            
            savedPlacesContainer.appendChild(favoriteItem);
        });
        
        // Add event listeners for checkboxes
        document.querySelectorAll('.include-in-budget').forEach(checkbox => {
            checkbox.addEventListener('change', updateCostBreakdown);
        });
    }
}

// Update cost breakdown based on user inputs
function updateCostBreakdown() {
    // Get user inputs
    const numPeople = parseInt(document.getElementById('numPeople').value) || 1;
    const numDays = parseInt(document.getElementById('numDays').value) || 1;
    const travelStyle = document.getElementById('travelStyle').value;
    
    // Get selected places
    const selectedPlaces = Array.from(document.querySelectorAll('.include-in-budget:checked')).length;
    
    // Base costs per person per day in rupees
    let costs = {
        accommodation: 0,
        food: 0,
        transportation: 0,
        activities: 0,
        misc: 0
    };
    
    // Set costs based on travel style
    switch (travelStyle) {
        case 'budget':
            costs.accommodation = 1000; // Budget hostel/guesthouse
            costs.food = 500; // Street food and budget meals
            costs.transportation = 300; // Public transport
            costs.activities = 500; // Free/budget attractions
            costs.misc = 200; // Minimal miscellaneous expenses
            break;
        
        case 'moderate':
            costs.accommodation = 3000; // 3-star hotel
            costs.food = 1200; // Mix of restaurant meals
            costs.transportation = 800; // Mix of public transit and cab
            costs.activities = 1000; // Paid attractions
            costs.misc = 500; // Moderate miscellaneous expenses
            break;
        
        case 'luxury':
            costs.accommodation = 8000; // 4/5-star hotel
            costs.food = 2500; // Upscale restaurants
            costs.transportation = 2000; // Private cab/car
            costs.activities = 2000; // Premium attractions and experiences
            costs.misc = 1500; // Luxury miscellaneous expenses
            break;
    }
    
    // Additional cost per place visited (for activities)
    const placeVisitCost = selectedPlaces * (travelStyle === 'luxury' ? 1500 : (travelStyle === 'moderate' ? 800 : 300));
    
    // Calculate total costs
    const totalAccommodation = costs.accommodation * numPeople * numDays;
    const totalFood = costs.food * numPeople * numDays;
    const totalTransportation = costs.transportation * numPeople * numDays;
    const totalActivities = costs.activities * numPeople * numDays + placeVisitCost;
    const totalMisc = costs.misc * numPeople * numDays;
    
    // Calculate grand total
    const grandTotal = totalAccommodation + totalFood + totalTransportation + totalActivities + totalMisc;
    
    // Update cost breakdown
    const costBreakdown = document.getElementById('costBreakdown');
    costBreakdown.innerHTML = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead class="table-light">
                    <tr>
                        <th>Category</th>
                        <th>Details</th>
                        <th class="text-end">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><i class="fas fa-hotel text-primary"></i> Accommodation</td>
                        <td>${numPeople} person(s) × ${numDays} day(s) × ₹${costs.accommodation}/day</td>
                        <td class="text-end">₹${totalAccommodation.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-utensils text-success"></i> Food</td>
                        <td>${numPeople} person(s) × ${numDays} day(s) × ₹${costs.food}/day</td>
                        <td class="text-end">₹${totalFood.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-bus text-info"></i> Transportation</td>
                        <td>${numPeople} person(s) × ${numDays} day(s) × ₹${costs.transportation}/day</td>
                        <td class="text-end">₹${totalTransportation.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-camera text-warning"></i> Activities</td>
                        <td>${numPeople} person(s) × ${numDays} day(s) × ₹${costs.activities}/day + ${selectedPlaces} place(s)</td>
                        <td class="text-end">₹${totalActivities.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-shopping-bag text-secondary"></i> Miscellaneous</td>
                        <td>${numPeople} person(s) × ${numDays} day(s) × ₹${costs.misc}/day</td>
                        <td class="text-end">₹${totalMisc.toLocaleString()}</td>
                    </tr>
                </tbody>
                <tfoot class="table-primary">
                    <tr>
                        <th colspan="2">Total Estimated Budget</th>
                        <th class="text-end">₹${grandTotal.toLocaleString()}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle"></i> This is an estimate based on average prices. Actual costs may vary based on seasonal factors, specific accommodation choices, and personal preferences.
        </div>
    `;
    
    // Update total cost
    document.getElementById('totalCost').textContent = `₹${grandTotal.toLocaleString()}`;
}

// Save budget plan
function saveBudgetPlan() {
    // Get the budget details
    const numPeople = document.getElementById('numPeople').value;
    const numDays = document.getElementById('numDays').value;
    const travelStyle = document.getElementById('travelStyle').value;
    const totalCost = document.getElementById('totalCost').textContent;
    
    // Get selected places
    const selectedPlaces = Array.from(document.querySelectorAll('.include-in-budget:checked')).map(checkbox => {
        const id = checkbox.value;
        const name = checkbox.nextElementSibling.textContent.trim();
        return { id, name };
    });
    
    // Create budget plan object
    const budgetPlan = {
        city: city,
        query: query,
        numPeople: numPeople,
        numDays: numDays,
        travelStyle: travelStyle,
        totalCost: totalCost,
        selectedPlaces: selectedPlaces,
        createdAt: Date.now()
    };
    
    // Get saved plans from local storage
    let savedPlans = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    
    // Add new plan
    savedPlans.push(budgetPlan);
    
    // Save to local storage
    localStorage.setItem('budgetPlans', JSON.stringify(savedPlans));
    
    // Show success message
    const toast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-save me-2"></i>
                    <strong class="me-auto">Budget Plan Saved</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Your budget plan for ${city} has been saved successfully. You can access it later from My Budget Plans.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.querySelector('.toast');
        if (toastElement) {
            const bsToast = new bootstrap.Toast(toastElement);
            bsToast.hide();
        }
    }, 3000);
    
    // Close the modal
    const budgetModal = bootstrap.Modal.getInstance(document.getElementById('budgetModal'));
    budgetModal.hide();
}

// Find top places based on ratings and reviews
function findTopPlaces() {
    // Check if we have places
    if (!allPlaces || allPlaces.length === 0) {
        alert('Please search for places first.');
        return;
    }
    
    // Sort places by rating (highest first)
    const sortedPlaces = [...allPlaces].sort((a, b) => {
        // If rating is the same, sort by number of user ratings
        if (b.rating === a.rating) {
            return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
        }
        return b.rating - a.rating;
    });
    
    // Get top 3 places (or all if less than 3)
    const topPlaces = sortedPlaces.slice(0, Math.min(3, sortedPlaces.length));
    
    // Get the container
    const topPlacesContainer = document.getElementById('topPlacesContainer');
    
    // Clear previous content
    topPlacesContainer.innerHTML = '';
    
    // Create a card for top places
    const topPlacesCard = document.createElement('div');
    topPlacesCard.className = 'card mb-4';
    
    // Add card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header bg-warning text-dark';
    cardHeader.innerHTML = `
        <h5 class="mb-0">
            <i class="fas fa-trophy"></i> Top 3 Popular Places in ${city}
        </h5>
    `;
    topPlacesCard.appendChild(cardHeader);
    
    // Add card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Create row for top places
    const row = document.createElement('div');
    row.className = 'row';
    
    // Add each top place
    topPlaces.forEach((place, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-4';
        
        // Create icon based on ranking
        let icon, badgeClass;
        switch (index) {
            case 0:
                icon = 'fa-trophy text-warning';
                badgeClass = 'bg-warning text-dark';
                break;
            case 1:
                icon = 'fa-medal text-secondary';
                badgeClass = 'bg-secondary text-white';
                break;
            case 2:
                icon = 'fa-award text-danger';
                badgeClass = 'bg-danger text-white';
                break;
        }
        
        col.innerHTML = `
            <div class="card place-card h-100">
                <div class="position-absolute top-0 start-0 p-2">
                    <span class="badge ${badgeClass}"><i class="fas ${icon}"></i> #${index + 1}</span>
                </div>
                <img src="${place.photos ? place.photos[0].getUrl() : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${place.name}" class="card-img-top">
                <div class="card-body">
                    <h5 class="card-title">${place.name}</h5>
                    <div class="mb-2">${getRatingStars(place.rating)} <span class="text-muted">(${place.user_ratings_total || 0})</span></div>
                    <p class="card-text small text-muted">${place.formatted_address}</p>
                    <div class="d-grid gap-2 mt-3">
                        <button class="btn btn-outline-primary btn-sm" onclick="showRoute(${place.geometry.location.lat()}, ${place.geometry.location.lng()}, '${place.name.replace(/'/g, "\\'")}')">
                            <i class="fas fa-directions"></i> Directions
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="getPlaceDetails('${place.place_id}')">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    cardBody.appendChild(row);
    topPlacesCard.appendChild(cardBody);
    
    // Add to container
    topPlacesContainer.appendChild(topPlacesCard);
    
    // Scroll to the top places container
    topPlacesContainer.scrollIntoView({ behavior: 'smooth' });
}

// Filter places by type
function filterPlaces(type) {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filters .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const clickedButton = document.querySelector(`.filters .btn[onclick*="${type}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // If we don't have places, do nothing
    if (!allPlaces || allPlaces.length === 0) {
        return;
    }
    
    // Filter the places
    let filteredPlaces;
    if (type === 'all') {
        filteredPlaces = allPlaces;
    } else {
        filteredPlaces = allPlaces.filter(place => {
            if (!place.types) return false;
            return place.types.includes(type);
        });
    }
    
    // Display the filtered results
    displayResults(filteredPlaces);
    
    // Show notification for number of filtered places
    const toast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-primary text-white">
                    <i class="fas fa-filter me-2"></i>
                    <strong class="me-auto">Places Filtered</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Showing ${filteredPlaces.length} ${type === 'all' ? 'places' : type.replace('_', ' ') + 's'} in ${city}.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.querySelector('.toast');
        if (toastElement) {
            const bsToast = new bootstrap.Toast(toastElement);
            bsToast.hide();
        }
    }, 3000);
}

// Helper function to get price level badge
function getPriceLevelBadge(priceLevel) {
    if (priceLevel === undefined) return '';
    
    let badgeClass = '';
    let dollarSigns = '';
    
    // Determine badge class based on price level
    switch(priceLevel) {
        case 0:
            badgeClass = 'bg-success';
            dollarSigns = 'Free';
            break;
        case 1:
            badgeClass = 'bg-info';
            dollarSigns = '$';
            break;
        case 2:
            badgeClass = 'bg-primary';
            dollarSigns = '$$';
            break;
        case 3:
            badgeClass = 'bg-warning';
            dollarSigns = '$$$';
            break;
        case 4:
            badgeClass = 'bg-danger';
            dollarSigns = '$$$$';
            break;
    }
    
    return `<span class="badge ${badgeClass}">${dollarSigns}</span>`;
}

// Sort places based on criteria
function sortPlaces(criteria, order) {
    if (!allPlaces || allPlaces.length === 0) return;
    
    // Create a shallow copy to avoid modifying the original array
    let sortedPlaces = [...allPlaces];
    
    if (criteria === 'rating') {
        sortedPlaces.sort((a, b) => {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return order === 'desc' ? ratingB - ratingA : ratingA - ratingB;
        });
    } 
    else if (criteria === 'price') {
        sortedPlaces.sort((a, b) => {
            const priceA = a.price_level !== undefined ? a.price_level : (order === 'desc' ? -1 : 999);
            const priceB = b.price_level !== undefined ? b.price_level : (order === 'desc' ? -1 : 999);
            return order === 'desc' ? priceB - priceA : priceA - priceB;
        });
    }
    
    // Show sorted places
    displayResults(sortedPlaces);
    
    // Show notification
    const criteriaText = criteria === 'rating' ? 'rating' : 'price';
    const orderText = order === 'desc' ? 'descending' : 'ascending';
    
    const toast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-primary text-white">
                    <i class="fas fa-sort me-2"></i>
                    <strong class="me-auto">Places Sorted</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Places sorted by ${criteriaText} in ${orderText} order.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.querySelector('.toast');
        if (toastElement) {
            const bsToast = new bootstrap.Toast(toastElement);
            bsToast.hide();
        }
    }, 3000);
}

// Initialize favorites count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateFavoritesCount();
});

// Function to compare price levels of selected places
function comparePrices() {
    // Check if we have places
    if (!allPlaces || allPlaces.length === 0) {
        alert('Please search for places first.');
        return;
    }
    
    // Filter places with price level information
    const placesWithPrice = allPlaces.filter(place => place.price_level !== undefined);
    
    if (placesWithPrice.length === 0) {
        // Show notification if no places have price info
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-warning text-dark">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong class="me-auto">No Price Information</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        None of the places have price information available.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.querySelector('.toast');
            if (toastElement) {
                const bsToast = new bootstrap.Toast(toastElement);
                bsToast.hide();
            }
        }, 3000);
        return;
    }
    
    // Sort places by price level
    const sortedPlaces = [...placesWithPrice].sort((a, b) => {
        // Sort by price level
        if (a.price_level !== b.price_level) {
            return a.price_level - b.price_level;
        }
        // If price level is the same, sort by rating
        return (b.rating || 0) - (a.rating || 0);
    });
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="priceComparisonModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-dollar-sign"></i> Price Comparison</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="price-comparison-info mb-3">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i> 
                                Comparing prices for ${sortedPlaces.length} places in ${city}. 
                                Prices are based on Google's price level ratings from $ (inexpensive) to $$$$ (very expensive).
                            </div>
                        </div>
                        <div class="price-comparison-table table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Place</th>
                                        <th>Type</th>
                                        <th>Price Level</th>
                                        <th>Rating</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedPlaces.map(place => `
                                        <tr>
                                            <td>${place.name}</td>
                                            <td>${getPrimaryPlaceType(place.types)}</td>
                                            <td>
                                                <span class="badge bg-${getPriceBadgeColor(place.price_level)} price-badge-lg">
                                                    ${getPriceLevel(place.price_level)}
                                                </span>
                                            </td>
                                            <td>${place.rating ? `${place.rating} <small class="text-muted">(${place.user_ratings_total})</small>` : 'N/A'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="getPlaceDetails('${place.place_id}')">
                                                    <i class="fas fa-info-circle"></i> Details
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="price-distribution mt-4">
                            <h6>Price Distribution</h6>
                            <div class="price-chart">
                                ${generatePriceDistributionChart(sortedPlaces)}
                            </div>
                        </div>
                        
                        <div class="price-summary mt-4">
                            <h6>Price Summary</h6>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="price-stat p-3 border rounded text-center">
                                        <h5>${calculateCheapestPlace(sortedPlaces).name}</h5>
                                        <div class="badge bg-success">Most Affordable</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="price-stat p-3 border rounded text-center">
                                        <h5>${calculateExpensivePlace(sortedPlaces).name}</h5>
                                        <div class="badge bg-danger">Most Expensive</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="price-stat p-3 border rounded text-center">
                                        <h5>${calculateAveragePrice(sortedPlaces)}</h5>
                                        <div class="badge bg-info">Average Price Level</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="price-stat p-3 border rounded text-center">
                                        <h5>${calculateBestValuePlace(sortedPlaces).name}</h5>
                                        <div class="badge bg-warning text-dark">Best Value</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('priceComparisonModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Apply necessary CSS
    applyPriceComparisonStyles();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('priceComparisonModal'));
    modal.show();
}

// Helper function to get the primary place type
function getPrimaryPlaceType(types) {
    if (!types || types.length === 0) return 'Unknown';
    
    const typeMap = {
        'restaurant': 'Restaurant',
        'cafe': 'Cafe',
        'bar': 'Bar',
        'lodging': 'Hotel',
        'hotel': 'Hotel',
        'tourist_attraction': 'Attraction',
        'museum': 'Museum',
        'park': 'Park',
        'shopping_mall': 'Shopping',
        'store': 'Store',
        'supermarket': 'Supermarket'
    };
    
    // Find the first recognized type
    for (const type of types) {
        if (typeMap[type]) {
            return typeMap[type];
        }
    }
    
    return 'Other';
}

// Helper function to generate price distribution chart
function generatePriceDistributionChart(places) {
    // Count places for each price level
    const priceCounts = [0, 0, 0, 0, 0]; // for price levels 0-4
    
    places.forEach(place => {
        if (place.price_level !== undefined && place.price_level >= 0 && place.price_level <= 4) {
            priceCounts[place.price_level]++;
        }
    });
    
    // Calculate percentages
    const total = places.length;
    const percentages = priceCounts.map(count => Math.round((count / total) * 100));
    
    // Generate chart HTML
    let chartHTML = '<div class="price-bars d-flex align-items-end" style="height: 150px;">';
    
    // Colors for each price level
    const colors = ['success', 'info', 'primary', 'warning', 'danger'];
    
    // Generate bars
    priceCounts.forEach((count, index) => {
        if (count > 0) {
            const percentage = percentages[index];
            const height = Math.max(percentage, 10); // Minimum 10% height for visibility
            
            chartHTML += `
                <div class="price-bar-container mx-1 text-center" style="flex: 1;">
                    <div class="price-bar bg-${colors[index]}" style="height: ${height}%; min-height: 20px;">
                        <span class="price-count">${count}</span>
                    </div>
                    <div class="price-label mt-2">
                        <span class="badge bg-${colors[index]}">${getPriceBadgeText(index)}</span>
                        <small class="d-block">${percentage}%</small>
                    </div>
                </div>
            `;
        }
    });
    
    chartHTML += '</div>';
    return chartHTML;
}

// Helper functions for price statistics
function calculateCheapestPlace(places) {
    // Find the place with the lowest price level
    return places.reduce((cheapest, place) => {
        if (place.price_level < cheapest.price_level) {
            return place;
        }
        return cheapest;
    }, places[0]);
}

function calculateExpensivePlace(places) {
    // Find the place with the highest price level
    return places.reduce((expensive, place) => {
        if (place.price_level > expensive.price_level) {
            return place;
        }
        return expensive;
    }, places[0]);
}

function calculateAveragePrice(places) {
    // Calculate the average price level
    const sum = places.reduce((total, place) => total + place.price_level, 0);
    const average = sum / places.length;
    // Convert to dollar signs
    const dollarSigns = '$'.repeat(Math.round(average));
    return dollarSigns;
}

function calculateBestValuePlace(places) {
    // Find the place with the best rating-to-price ratio
    return places.reduce((bestValue, place) => {
        const currentRatio = (place.rating || 0) / (place.price_level || 1);
        const bestRatio = (bestValue.rating || 0) / (bestValue.price_level || 1);
        
        if (currentRatio > bestRatio) {
            return place;
        }
        return bestValue;
    }, places[0]);
}

// Apply CSS styles for price comparison
function applyPriceComparisonStyles() {
    // Check if styles already exist
    if (document.getElementById('price-comparison-styles')) {
        return;
    }
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'price-comparison-styles';
    
    // Add CSS rules
    styleElement.textContent = `
        .price-badge-lg {
            font-size: 1rem;
            padding: 5px 10px;
        }
        
        .price-bars {
            margin: 0 auto;
            width: 100%;
        }
        
        .price-bar {
            position: relative;
            border-radius: 4px 4px 0 0;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .price-bar:hover {
            opacity: 0.9;
            transform: scaleY(1.05);
        }
        
        .price-level-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 2;
        }
        
        .price-details {
            border-left: 4px solid #0d6efd;
        }
        
        .place-price {
            font-weight: bold;
        }
    `;
    
    // Add to document head
    document.head.appendChild(styleElement);
}

// Add price comparison button to the filter buttons
document.addEventListener('DOMContentLoaded', function() {
    // Update favorites count
    updateFavoritesCount();
    
    // Add price comparison button after the filters are created
    setTimeout(() => {
        const filtersElement = document.querySelector('.filters');
        if (filtersElement) {
            const priceButton = document.createElement('button');
            priceButton.className = 'btn btn-outline-info ms-2';
            priceButton.innerHTML = '<i class="fas fa-dollar-sign"></i> Compare Prices';
            priceButton.onclick = comparePrices;
            
            filtersElement.appendChild(priceButton);
        }
    }, 1000);
});

// Function to plan local experiences
function planLocalExperience() {
    // Check if we have places
    if (!allPlaces || allPlaces.length === 0) {
        alert('Please search for places first.');
        return;
    }
    
    console.log("Opening Local Experience Planner");
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="localExperienceModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title"><i class="fas fa-globe-asia"></i> Local Experience Planner</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            Discover authentic local experiences in ${city}. Plan cultural activities, food tours, and interact with locals.
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-4">
                                <div class="form-group mb-3">
                                    <label for="experienceType" class="form-label">Experience Type</label>
                                    <select class="form-select" id="experienceType" onchange="filterExperiences()">
                                        <option value="all">All Experiences</option>
                                        <option value="food">Food & Culinary</option>
                                        <option value="cultural">Cultural & Heritage</option>
                                        <option value="adventure">Adventure & Outdoors</option>
                                        <option value="wellness">Wellness & Relaxation</option>
                                        <option value="shopping">Shopping & Crafts</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group mb-3">
                                    <label for="experienceDuration" class="form-label">Duration</label>
                                    <select class="form-select" id="experienceDuration" onchange="filterExperiences()">
                                        <option value="all">Any Duration</option>
                                        <option value="short">Short (1-2 hours)</option>
                                        <option value="medium">Medium (Half-day)</option>
                                        <option value="long">Long (Full-day)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group mb-3">
                                    <label for="experienceBudget" class="form-label">Budget</label>
                                    <select class="form-select" id="experienceBudget" onchange="filterExperiences()">
                                        <option value="all">Any Budget</option>
                                        <option value="free">Free</option>
                                        <option value="low">Budget-Friendly</option>
                                        <option value="medium">Moderate</option>
                                        <option value="high">Premium</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div id="experiencesList" class="mb-4">
                            <div class="text-center py-4">
                                <i class="fas fa-spinner fa-spin fa-2x"></i>
                                <p class="mt-2">Generating local experiences...</p>
                            </div>
                        </div>
                        
                        <div id="selectedExperiences" class="mt-4">
                            <h5><i class="fas fa-clipboard-list"></i> My Experience Plan</h5>
                            <div id="experiencePlanItems" class="list-group mb-3">
                                <div class="text-center py-3 text-muted">
                                    <i class="fas fa-plus-circle"></i>
                                    <p>Add experiences to your plan by clicking the "Add to Plan" button</p>
                                </div>
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-success" onclick="saveExperiencePlan()">
                                    <i class="fas fa-save"></i> Save Experience Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('localExperienceModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Apply styles
    applyLocalExperienceStyles();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('localExperienceModal'));
    modal.show();
    
    // Generate experiences
    setTimeout(() => {
        generateLocalExperiences();
    }, 1000);
}

// Generate local experiences based on the city
function generateLocalExperiences() {
    console.log("Generating local experiences for", city);
    
    // Get the container
    const experiencesContainer = document.getElementById('experiencesList');
    
    // Get places with different types for recommendations
    const restaurants = allPlaces.filter(place => 
        place.types && (place.types.includes('restaurant') || place.types.includes('cafe') || place.types.includes('bar'))
    );
    
    const attractions = allPlaces.filter(place => 
        place.types && (place.types.includes('tourist_attraction') || place.types.includes('museum') || 
        place.types.includes('park') || place.types.includes('place_of_worship'))
    );
    
    const shopping = allPlaces.filter(place => 
        place.types && (place.types.includes('shopping_mall') || place.types.includes('store'))
    );
    
    console.log(`Found ${restaurants.length} restaurants, ${attractions.length} attractions, ${shopping.length} shopping places`);
    
    // Create experiences based on available places and add some creative options
    const experiences = [];
    
    // Add food experiences
    if (restaurants.length > 0) {
        restaurants.slice(0, 3).forEach(restaurant => {
            experiences.push({
                type: 'food',
                name: `Taste Local Flavors at ${restaurant.name}`,
                description: `Experience authentic local cuisine at one of the best-rated restaurants in ${city}.`,
                place: restaurant,
                duration: 'medium',
                budget: restaurant.price_level ? (restaurant.price_level > 2 ? 'high' : 'medium') : 'medium',
                image: restaurant.photos && restaurant.photos.length > 0 ? 
                       restaurant.photos[0].getUrl() : 
                       'https://via.placeholder.com/300x200?text=Food+Experience'
            });
        });
        
        // Add a food tour option
        experiences.push({
            type: 'food',
            name: `${city} Street Food Tour`,
            description: `Discover the vibrant street food scene of ${city} with a guided tour of local delicacies and hidden gems.`,
            place: null,
            duration: 'long',
            budget: 'medium',
            image: 'https://via.placeholder.com/300x200?text=Food+Tour'
        });
    }
    
    // Add cultural experiences
    if (attractions.length > 0) {
        attractions.slice(0, 3).forEach(attraction => {
            experiences.push({
                type: 'cultural',
                name: `Explore ${attraction.name}`,
                description: `Immerse yourself in local culture and history at this iconic landmark in ${city}.`,
                place: attraction,
                duration: 'medium',
                budget: 'low',
                image: attraction.photos && attraction.photos.length > 0 ? 
                       attraction.photos[0].getUrl() : 
                       'https://via.placeholder.com/300x200?text=Cultural+Experience'
            });
        });
    }
    
    // Add creative experiences that don't rely on specific places
    experiences.push({
        type: 'cultural',
        name: `Traditional Craft Workshop`,
        description: `Learn traditional crafts from local artisans and create your own souvenir to take home.`,
        place: null,
        duration: 'medium',
        budget: 'medium',
        image: 'https://via.placeholder.com/300x200?text=Craft+Workshop'
    });
    
    experiences.push({
        type: 'adventure',
        name: `Guided City Walking Tour`,
        description: `Explore the hidden corners of ${city} with a knowledgeable local guide who will share fascinating stories and secrets.`,
        place: null,
        duration: 'medium',
        budget: 'low',
        image: 'https://via.placeholder.com/300x200?text=Walking+Tour'
    });
    
    experiences.push({
        type: 'adventure',
        name: `Bicycle Tour of ${city}`,
        description: `See the city like a local on this guided bicycle tour that takes you off the beaten path.`,
        place: null,
        duration: 'long',
        budget: 'medium',
        image: 'https://via.placeholder.com/300x200?text=Bicycle+Tour'
    });
    
    experiences.push({
        type: 'wellness',
        name: `Traditional Spa Experience`,
        description: `Relax and rejuvenate with traditional wellness treatments that have been practiced in the region for generations.`,
        place: null,
        duration: 'medium',
        budget: 'high',
        image: 'https://via.placeholder.com/300x200?text=Spa+Experience'
    });
    
    if (shopping.length > 0) {
        shopping.slice(0, 2).forEach(shop => {
            experiences.push({
                type: 'shopping',
                name: `Shop at ${shop.name}`,
                description: `Find unique souvenirs and local products at this popular shopping destination.`,
                place: shop,
                duration: 'short',
                budget: 'medium',
                image: shop.photos && shop.photos.length > 0 ? 
                       shop.photos[0].getUrl() : 
                       'https://via.placeholder.com/300x200?text=Shopping+Experience'
            });
        });
    }
    
    experiences.push({
        type: 'shopping',
        name: `Local Market Exploration`,
        description: `Wander through bustling local markets and interact with vendors selling everything from fresh produce to handmade crafts.`,
        place: null,
        duration: 'medium',
        budget: 'low',
        image: 'https://via.placeholder.com/300x200?text=Local+Market'
    });
    
    // Save experiences to window object for filtering
    window.localExperiences = experiences;
    
    console.log(`Generated ${experiences.length} local experiences`);
    
    // Display experiences
    displayExperiences(experiences);
}

// Display experiences in the modal
function displayExperiences(experiences) {
    const container = document.getElementById('experiencesList');
    
    if (experiences.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                No experiences match your filters. Try different criteria.
            </div>
        `;
        return;
    }
    
    // Create row for experiences
    container.innerHTML = `<div class="row" id="experiencesRow"></div>`;
    const row = document.getElementById('experiencesRow');
    
    // Add each experience
    experiences.forEach(experience => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        
        const card = document.createElement('div');
        card.className = 'card h-100 experience-card';
        card.dataset.type = experience.type;
        card.dataset.duration = experience.duration;
        card.dataset.budget = experience.budget;
        
        // Get icon based on experience type
        let typeIcon, typeClass;
        switch (experience.type) {
            case 'food':
                typeIcon = 'utensils';
                typeClass = 'bg-danger';
                break;
            case 'cultural':
                typeIcon = 'landmark';
                typeClass = 'bg-primary';
                break;
            case 'adventure':
                typeIcon = 'hiking';
                typeClass = 'bg-success';
                break;
            case 'wellness':
                typeIcon = 'spa';
                typeClass = 'bg-info';
                break;
            case 'shopping':
                typeIcon = 'shopping-bag';
                typeClass = 'bg-warning';
                break;
            default:
                typeIcon = 'globe-asia';
                typeClass = 'bg-secondary';
        }
        
        // Get duration text
        let durationText;
        switch (experience.duration) {
            case 'short':
                durationText = '1-2 hours';
                break;
            case 'medium':
                durationText = 'Half-day';
                break;
            case 'long':
                durationText = 'Full-day';
                break;
            default:
                durationText = 'Flexible';
        }
        
        // Get budget text and icon
        let budgetText, budgetIcons;
        switch (experience.budget) {
            case 'free':
                budgetText = 'Free';
                budgetIcons = '';
                break;
            case 'low':
                budgetText = 'Budget-Friendly';
                budgetIcons = '<i class="fas fa-dollar-sign"></i>';
                break;
            case 'medium':
                budgetText = 'Moderate';
                budgetIcons = '<i class="fas fa-dollar-sign"></i><i class="fas fa-dollar-sign"></i>';
                break;
            case 'high':
                budgetText = 'Premium';
                budgetIcons = '<i class="fas fa-dollar-sign"></i><i class="fas fa-dollar-sign"></i><i class="fas fa-dollar-sign"></i>';
                break;
            default:
                budgetText = 'Varies';
                budgetIcons = '<i class="fas fa-dollar-sign"></i>';
        }
        
        card.innerHTML = `
            <div class="experience-type-badge ${typeClass}">
                <i class="fas fa-${typeIcon}"></i> ${experience.type.charAt(0).toUpperCase() + experience.type.slice(1)}
            </div>
            <img src="${experience.image}" class="card-img-top" alt="${experience.name}">
            <div class="card-body">
                <h5 class="card-title">${experience.name}</h5>
                <p class="card-text">${experience.description}</p>
                <div class="experience-details">
                    <div class="experience-detail">
                        <i class="fas fa-clock"></i> ${durationText}
                    </div>
                    <div class="experience-detail">
                        <span class="budget-icons">${budgetIcons}</span> ${budgetText}
                    </div>
                </div>
            </div>
            <div class="card-footer bg-transparent border-top-0">
                <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary btn-sm" onclick="addToPlan('${experience.name.replace(/'/g, "\\'")}', '${experience.type}', '${experience.duration}')">
                        <i class="fas fa-plus-circle"></i> Add to Plan
                    </button>
                    ${experience.place ? 
                    `<button class="btn btn-outline-info btn-sm" onclick="getPlaceDetails('${experience.place.place_id}')">
                        <i class="fas fa-info-circle"></i> View Details
                    </button>` : ''}
                </div>
            </div>
        `;
        
        col.appendChild(card);
        row.appendChild(col);
    });
}

// Filter experiences based on user selections
function filterExperiences() {
    console.log("Filtering experiences");
    const typeFilter = document.getElementById('experienceType').value;
    const durationFilter = document.getElementById('experienceDuration').value;
    const budgetFilter = document.getElementById('experienceBudget').value;
    
    let filteredExperiences = window.localExperiences;
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredExperiences = filteredExperiences.filter(exp => exp.type === typeFilter);
    }
    
    // Apply duration filter
    if (durationFilter !== 'all') {
        filteredExperiences = filteredExperiences.filter(exp => exp.duration === durationFilter);
    }
    
    // Apply budget filter
    if (budgetFilter !== 'all') {
        filteredExperiences = filteredExperiences.filter(exp => exp.budget === budgetFilter);
    }
    
    console.log(`Filtered to ${filteredExperiences.length} experiences`);
    
    // Display filtered experiences
    displayExperiences(filteredExperiences);
}

// Add experience to plan
function addToPlan(experienceName, type, duration) {
    console.log("Adding to plan:", experienceName);
    const planContainer = document.getElementById('experiencePlanItems');
    
    // Clear placeholder if it exists
    if (planContainer.querySelector('.text-center')) {
        planContainer.innerHTML = '';
    }
    
    // Check if already added
    const existingItem = Array.from(planContainer.children).find(item => 
        item.querySelector('.experience-name') && 
        item.querySelector('.experience-name').textContent === experienceName
    );
    
    if (existingItem) {
        // Show toast notification
        const toastId = 'alreadyAddedToast';
        const existingToast = document.getElementById(toastId);
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = `
            <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-warning text-dark">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong class="me-auto">Already Added</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        This experience is already in your plan.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toast);
        
        // Auto-close the toast after 3 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.remove();
            }
        }, 3000);
        
        return;
    }
    
    // Get icon based on experience type
    let typeIcon;
    switch (type) {
        case 'food':
            typeIcon = 'utensils';
            break;
        case 'cultural':
            typeIcon = 'landmark';
            break;
        case 'adventure':
            typeIcon = 'hiking';
            break;
        case 'wellness':
            typeIcon = 'spa';
            break;
        case 'shopping':
            typeIcon = 'shopping-bag';
            break;
        default:
            typeIcon = 'globe-asia';
    }
    
    // Create and add item
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `
        <div>
            <i class="fas fa-${typeIcon} me-2"></i>
            <span class="experience-name">${experienceName}</span>
        </div>
        <div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeFromPlan(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    planContainer.appendChild(item);
    
    // Show success toast
    const toastId = 'addedToPlanToast';
    const existingToast = document.getElementById(toastId);
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = `
        <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong class="me-auto">Added to Plan</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    "${experienceName}" has been added to your experience plan.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.remove();
        }
    }, 3000);
}

// Remove experience from plan
function removeFromPlan(button) {
    console.log("Removing from plan");
    const item = button.closest('.list-group-item');
    item.style.animation = 'fadeOut 0.3s';
    
    setTimeout(() => {
        item.remove();
        
        // Check if plan is empty
        const planContainer = document.getElementById('experiencePlanItems');
        if (planContainer.children.length === 0) {
            planContainer.innerHTML = `
                <div class="text-center py-3 text-muted">
                    <i class="fas fa-plus-circle"></i>
                    <p>Add experiences to your plan by clicking the "Add to Plan" button</p>
                </div>
            `;
        }
    }, 300);
}

// Save experience plan
function saveExperiencePlan() {
    console.log("Saving experience plan");
    const planContainer = document.getElementById('experiencePlanItems');
    const planItems = Array.from(planContainer.querySelectorAll('.experience-name')).map(el => el.textContent);
    
    if (planItems.length === 0) {
        alert('Please add at least one experience to your plan before saving.');
        return;
    }
    
    // Create plan object
    const plan = {
        city: city,
        experiences: planItems,
        createdAt: Date.now()
    };
    
    // Get saved plans from local storage
    let savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    
    // Add new plan
    savedPlans.push(plan);
    
    // Save to local storage
    localStorage.setItem('experiencePlans', JSON.stringify(savedPlans));
    
    // Show success message with option to calculate budget
    const toastId = 'planSavedToast';
    const existingToast = document.getElementById(toastId);
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = `
        <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-save me-2"></i>
                    <strong class="me-auto">Plan Saved</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    <p>Your experience plan for ${city} has been saved successfully.</p>
                    <div class="mt-2 pt-2 border-top">
                        <button type="button" class="btn btn-info btn-sm" onclick="calculateExperienceBudget()">
                            <i class="fas fa-calculator"></i> Estimate Budget
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 6 seconds (longer to give time to click the budget button)
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.remove();
        }
    }, 6000);
    
    // Hide the experience modal
    const experienceModal = document.getElementById('localExperienceModal');
    if (experienceModal) {
        const bsModal = bootstrap.Modal.getInstance(experienceModal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

// Calculate budget for experiences
function calculateExperienceBudget() {
    console.log("Calculating budget for experiences");
    
    // Get the latest saved plan
    const savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    if (savedPlans.length === 0) {
        alert('No experience plans found. Please create a plan first.');
        return;
    }
    
    const latestPlan = savedPlans[savedPlans.length - 1];
    
    // Create a modal for the budget calculator
    const budgetModalHTML = `
        <div class="modal fade" id="experienceBudgetModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-calculator"></i> Experience Budget Calculator</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            Estimate your travel budget for ${latestPlan.city} based on your selected experiences.
                        </div>
                        
                        <h5 class="mb-3"><i class="fas fa-clipboard-list"></i> Your Experience Plan</h5>
                        <ul class="list-group mb-4" id="experienceBudgetList">
                            ${latestPlan.experiences.map((exp, index) => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="fw-bold">${index + 1}.</span> ${exp}
                                    </div>
                                    <div class="input-group" style="max-width: 200px;">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control experience-cost" 
                                            data-experience="${exp.replace(/"/g, '&quot;')}" 
                                            placeholder="Cost" min="0" step="0.01"
                                            value="${getEstimatedCost(exp)}">
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                        
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h5 class="mb-0"><i class="fas fa-plane"></i> Additional Travel Expenses</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label for="transportationCost" class="form-label">Transportation</label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" class="form-control" id="transportationCost" 
                                                    placeholder="Transportation costs" min="0" step="0.01">
                                            </div>
                                            <small class="text-muted">Flights, trains, car rentals, etc.</small>
                                        </div>
                                        <div class="mb-3">
                                            <label for="accommodationCost" class="form-label">Accommodation</label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" class="form-control" id="accommodationCost" 
                                                    placeholder="Accommodation costs" min="0" step="0.01">
                                            </div>
                                            <small class="text-muted">Hotels, Airbnb, hostels, etc.</small>
                                        </div>
                                        <div class="mb-3">
                                            <label for="foodCost" class="form-label">Food & Dining</label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" class="form-control" id="foodCost" 
                                                    placeholder="Food costs" min="0" step="0.01">
                                            </div>
                                            <small class="text-muted">Meals not included in experiences</small>
                                        </div>
                                        <div class="mb-3">
                                            <label for="miscCost" class="form-label">Miscellaneous</label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" class="form-control" id="miscCost" 
                                                    placeholder="Other costs" min="0" step="0.01">
                                            </div>
                                            <small class="text-muted">Shopping, souvenirs, emergency funds, etc.</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h5 class="mb-0"><i class="fas fa-chart-pie"></i> Budget Summary</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="budget-summary">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Experiences Total:</span>
                                                <span id="experiencesTotal">$0.00</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Transportation:</span>
                                                <span id="transportationTotal">$0.00</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Accommodation:</span>
                                                <span id="accommodationTotal">$0.00</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Food & Dining:</span>
                                                <span id="foodTotal">$0.00</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Miscellaneous:</span>
                                                <span id="miscTotal">$0.00</span>
                                            </div>
                                            <hr>
                                            <div class="d-flex justify-content-between fw-bold fs-5">
                                                <span>Total Budget:</span>
                                                <span id="totalBudget">$0.00</span>
                                            </div>
                                        </div>
                                        
                                        <div class="mt-4" id="budgetChartContainer">
                                            <canvas id="budgetChart" width="100%" height="200"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-success" onclick="saveBudgetWithExperiences()">
                                <i class="fas fa-save"></i> Save Budget Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('experienceBudgetModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', budgetModalHTML);
    
    // Set up input event listeners to calculate totals in real-time
    setupBudgetCalculator();
    
    // Initialize the chart
    initializeBudgetChart();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('experienceBudgetModal'));
    modal.show();
}

// Get estimated cost based on experience type/name
function getEstimatedCost(experienceName) {
    // Check for keywords to make smart guesses about costs
    const lowerName = experienceName.toLowerCase();
    
    // Premium experiences
    if (lowerName.includes('premium') || lowerName.includes('luxury') || lowerName.includes('spa')) {
        return '120';
    }
    
    // Food-related experiences
    if (lowerName.includes('food') || lowerName.includes('culinary') || 
        lowerName.includes('taste') || lowerName.includes('restaurant')) {
        return '45';
    }
    
    // Tours and guided activities
    if (lowerName.includes('tour') || lowerName.includes('guided')) {
        return '35';
    }
    
    // Shopping experiences
    if (lowerName.includes('shop') || lowerName.includes('market')) {
        return '30';
    }
    
    // Cultural experiences
    if (lowerName.includes('museum') || lowerName.includes('cultural') || 
        lowerName.includes('heritage') || lowerName.includes('workshop')) {
        return '25';
    }
    
    // Outdoor and adventure
    if (lowerName.includes('adventure') || lowerName.includes('outdoor') || 
        lowerName.includes('hike') || lowerName.includes('bicycle')) {
        return '40';
    }
    
    // Default value
    return '25';
}

// Set up event listeners for the budget calculator
function setupBudgetCalculator() {
    // Update totals when any input changes
    const inputs = document.querySelectorAll('#experienceBudgetModal input');
    inputs.forEach(input => {
        input.addEventListener('input', updateBudgetSummary);
    });
    
    // Initial calculation
    updateBudgetSummary();
}

// Update the budget summary
function updateBudgetSummary() {
    // Calculate experiences total
    const experienceCosts = document.querySelectorAll('.experience-cost');
    let experiencesTotal = 0;
    experienceCosts.forEach(input => {
        experiencesTotal += parseFloat(input.value || 0);
    });
    
    // Get other costs
    const transportationCost = parseFloat(document.getElementById('transportationCost').value || 0);
    const accommodationCost = parseFloat(document.getElementById('accommodationCost').value || 0);
    const foodCost = parseFloat(document.getElementById('foodCost').value || 0);
    const miscCost = parseFloat(document.getElementById('miscCost').value || 0);
    
    // Calculate total
    const totalBudget = experiencesTotal + transportationCost + accommodationCost + foodCost + miscCost;
    
    // Update display
    document.getElementById('experiencesTotal').textContent = `$${experiencesTotal.toFixed(2)}`;
    document.getElementById('transportationTotal').textContent = `$${transportationCost.toFixed(2)}`;
    document.getElementById('accommodationTotal').textContent = `$${accommodationCost.toFixed(2)}`;
    document.getElementById('foodTotal').textContent = `$${foodCost.toFixed(2)}`;
    document.getElementById('miscTotal').textContent = `$${miscCost.toFixed(2)}`;
    document.getElementById('totalBudget').textContent = `$${totalBudget.toFixed(2)}`;
    
    // Update chart
    updateBudgetChart(experiencesTotal, transportationCost, accommodationCost, foodCost, miscCost);
}

// Initialize the budget chart
function initializeBudgetChart() {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    
    // Create chart with initial data
    window.budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Experiences', 'Transportation', 'Accommodation', 'Food & Dining', 'Miscellaneous'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4BC0C0', // Experiences
                    '#FF6384', // Transportation
                    '#FFCE56', // Accommodation
                    '#36A2EB', // Food
                    '#9966FF'  // Misc
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update the budget chart with new data
function updateBudgetChart(experiences, transportation, accommodation, food, misc) {
    if (window.budgetChart) {
        window.budgetChart.data.datasets[0].data = [
            experiences,
            transportation,
            accommodation,
            food,
            misc
        ];
        window.budgetChart.update();
    }
}

// Save the budget plan including experiences
function saveBudgetWithExperiences() {
    console.log("Saving budget with experiences");
    
    // Get the latest saved plan
    const savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    if (savedPlans.length === 0) {
        alert('No experience plans found. Please create a plan first.');
        return;
    }
    
    const latestPlan = savedPlans[savedPlans.length - 1];
    
    // Collect experience costs
    const experienceCosts = {};
    document.querySelectorAll('.experience-cost').forEach(input => {
        experienceCosts[input.getAttribute('data-experience')] = parseFloat(input.value || 0);
    });
    
    // Get other costs
    const transportationCost = parseFloat(document.getElementById('transportationCost').value || 0);
    const accommodationCost = parseFloat(document.getElementById('accommodationCost').value || 0);
    const foodCost = parseFloat(document.getElementById('foodCost').value || 0);
    const miscCost = parseFloat(document.getElementById('miscCost').value || 0);
    
    // Calculate total
    let experiencesTotal = 0;
    Object.values(experienceCosts).forEach(cost => {
        experiencesTotal += cost;
    });
    
    const totalBudget = experiencesTotal + transportationCost + accommodationCost + foodCost + miscCost;
    
    // Create budget object
    const budget = {
        city: latestPlan.city,
        experiences: latestPlan.experiences,
        experienceCosts: experienceCosts,
        transportation: transportationCost,
        accommodation: accommodationCost,
        food: foodCost,
        miscellaneous: miscCost,
        total: totalBudget,
        createdAt: Date.now()
    };
    
    // Get saved budgets from local storage
    let savedBudgets = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    
    // Add new budget
    savedBudgets.push(budget);
    
    // Save to local storage
    localStorage.setItem('budgetPlans', JSON.stringify(savedBudgets));
    
    // Show success message
    const toastId = 'budgetSavedToast';
    const existingToast = document.getElementById(toastId);
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = `
        <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-save me-2"></i>
                    <strong class="me-auto">Budget Plan Saved</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Your budget plan for ${latestPlan.city} has been saved successfully.
                    Total budget: $${totalBudget.toFixed(2)}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.remove();
        }
    }, 3000);
    
    // Hide the modal
    const budgetModal = document.getElementById('experienceBudgetModal');
    if (budgetModal) {
        const bsModal = bootstrap.Modal.getInstance(budgetModal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

// Apply styles for local experience planner
function applyLocalExperienceStyles() {
    // Check if styles already exist
    if (document.getElementById('local-experience-styles')) {
        return;
    }
    
    console.log("Applying Local Experience Planner styles");
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'local-experience-styles';
    
    // Add CSS rules
    styleElement.textContent = `
        .experience-card {
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
        }
        
        .experience-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .experience-type-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            border-radius: 20px;
            color: white;
            font-size: 0.8rem;
            z-index: 1;
        }
        
        .experience-details {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            color: #6c757d;
            font-size: 0.9rem;
        }
        
        .experience-detail {
            display: flex;
            align-items: center;
        }
        
        .experience-detail i {
            margin-right: 5px;
        }
        
        .budget-icons {
            color: #198754;
            margin-right: 5px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(10px); }
        }
        
        .list-group-item {
            animation: fadeIn 0.3s;
        }
    `;
    
    // Add to document head
    document.head.appendChild(styleElement);
}

// Add local experience planner button to the filter buttons
document.addEventListener('DOMContentLoaded', function() {
    // This may already exist in your code - if so, just add the part for the Experience button
    const existingDOMContentLoaded = document.getElementById('experiencePlannerAdded');
    
    if (!existingDOMContentLoaded) {
        console.log("Adding Local Experience Planner button");
        
        // Mark as added to prevent duplicate execution
        const marker = document.createElement('div');
        marker.id = 'experiencePlannerAdded';
        marker.style.display = 'none';
        document.body.appendChild(marker);
        
        // Add styles for the experience planner
        applyLocalExperienceStyles();
        
        // Add local experience planner button after the filters are created
        setTimeout(() => {
            const filtersElement = document.querySelector('.filters');
            if (filtersElement && !document.querySelector('.local-experience-btn')) {
                const experienceButton = document.createElement('button');
                experienceButton.className = 'btn btn-outline-success ms-2 local-experience-btn';
                experienceButton.innerHTML = '<i class="fas fa-globe-asia"></i> Local Experiences';
                experienceButton.onclick = planLocalExperience;
                
                filtersElement.appendChild(experienceButton);
            }
            
            // Add saved experiences button to navigation
            const navElement = document.querySelector('nav.navbar .navbar-nav');
            if (navElement && !document.querySelector('.saved-experiences-btn')) {
                const navItem = document.createElement('li');
                navItem.className = 'nav-item ms-2';
                
                const savedExperiencesButton = document.createElement('button');
                savedExperiencesButton.className = 'btn btn-info saved-experiences-btn';
                savedExperiencesButton.innerHTML = '<i class="fas fa-bookmark"></i> My Experiences';
                savedExperiencesButton.onclick = viewSavedExperiences;
                
                navItem.appendChild(savedExperiencesButton);
                navElement.appendChild(navItem);
            }
            
            // If no navbar exists, add a fixed button in the corner
            if (!navElement) {
                const cornerButton = document.createElement('button');
                cornerButton.className = 'btn btn-info position-fixed saved-experiences-btn';
                cornerButton.innerHTML = '<i class="fas fa-bookmark"></i> My Experiences';
                cornerButton.onclick = viewSavedExperiences;
                cornerButton.style.top = '70px';
                cornerButton.style.right = '20px';
                cornerButton.style.zIndex = '1000';
                
                document.body.appendChild(cornerButton);
            }
        }, 1000);
    }
});

// View saved experience plans
function viewSavedExperiences() {
    console.log("Viewing saved experience plans");
    
    // Get saved plans from local storage
    const savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    const savedBudgets = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    
    // Map budgets by city and creation time for easier lookup
    const budgetMap = {};
    savedBudgets.forEach(budget => {
        const key = `${budget.city}-${budget.createdAt}`;
        budgetMap[key] = budget;
    });
    
    // Create modal HTML
    let modalHTML = `
        <div class="modal fade" id="savedExperiencesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title"><i class="fas fa-bookmark"></i> My Saved Experiences</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
    `;
    
    if (savedPlans.length === 0) {
        modalHTML += `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 
                You haven't saved any experience plans yet. Create a plan using the Local Experience Planner!
            </div>
        `;
    } else {
        modalHTML += `
            <div class="accordion" id="savedExperiencesAccordion">
        `;
        
        savedPlans.forEach((plan, index) => {
            const planDate = new Date(plan.createdAt);
            const formattedDate = planDate.toLocaleDateString() + ' ' + planDate.toLocaleTimeString();
            
            // Check if there's a matching budget
            const budgetKey = `${plan.city}-${plan.createdAt}`;
            const hasBudget = budgetMap[budgetKey] !== undefined;
            
            modalHTML += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="experienceHeading${index}">
                        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#experienceCollapse${index}" 
                            aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="experienceCollapse${index}">
                            <div class="d-flex w-100 justify-content-between align-items-center">
                                <span><i class="fas fa-map-marker-alt me-2"></i> ${plan.city} Experience Plan</span>
                                <small class="text-muted ms-3">${formattedDate}</small>
                            </div>
                        </button>
                    </h2>
                    <div id="experienceCollapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                        aria-labelledby="experienceHeading${index}" data-bs-parent="#savedExperiencesAccordion">
                        <div class="accordion-body">
                            <h5><i class="fas fa-list-ul"></i> Planned Experiences</h5>
                            <ul class="list-group mb-3">
                                ${plan.experiences.map((exp, expIndex) => `
                                    <li class="list-group-item">
                                        <span class="fw-bold">${expIndex + 1}.</span> ${exp}
                                    </li>
                                `).join('')}
                            </ul>
                            
                            ${hasBudget ? `
                                <div class="card mt-3">
                                    <div class="card-header bg-success text-white">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h5 class="mb-0"><i class="fas fa-money-bill-wave"></i> Budget Plan</h5>
                                            <span class="badge bg-light text-dark fs-6">$${budgetMap[budgetKey].total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <button class="btn btn-outline-info w-100" 
                                            onclick="viewBudgetDetails('${plan.city}', ${plan.createdAt})">
                                            <i class="fas fa-search-dollar"></i> View Budget Details
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    No budget plan associated with this experience plan.
                                    <button class="btn btn-sm btn-outline-primary ms-2" 
                                        onclick="calculateExperienceBudgetForPlan(${index})">
                                        <i class="fas fa-calculator"></i> Create Budget
                                    </button>
                                </div>
                            `}
                            
                            <div class="d-flex justify-content-between mt-3">
                                <button class="btn btn-danger" onclick="deleteSavedPlan(${index})">
                                    <i class="fas fa-trash-alt"></i> Delete Plan
                                </button>
                                <button class="btn btn-primary" onclick="loadExperiencePlan(${index})">
                                    <i class="fas fa-map-marked-alt"></i> Load Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        modalHTML += `
            </div>
        `;
    }
    
    modalHTML += `
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('savedExperiencesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('savedExperiencesModal'));
    modal.show();
}

// Calculate budget for a specific saved plan
function calculateExperienceBudgetForPlan(planIndex) {
    console.log("Calculating budget for saved plan", planIndex);
    
    // Get saved plans
    const savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    if (planIndex < 0 || planIndex >= savedPlans.length) {
        console.error("Invalid plan index");
        return;
    }
    
    // Hide the saved experiences modal
    const savedExperiencesModal = document.getElementById('savedExperiencesModal');
    if (savedExperiencesModal) {
        const bsModal = bootstrap.Modal.getInstance(savedExperiencesModal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    // Store the selected plan as the latest plan
    localStorage.setItem('selectedExperiencePlan', JSON.stringify(savedPlans[planIndex]));
    
    // Call the budget calculator function
    setTimeout(() => {
        calculateExperienceBudget(true);
    }, 500);
}

// View budget details for a specific plan
function viewBudgetDetails(cityName, createdAt) {
    console.log("Viewing budget details for", cityName, "created at", createdAt);
    
    // Get saved budgets
    const savedBudgets = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    
    // Find the matching budget
    const budget = savedBudgets.find(b => b.city === cityName && b.createdAt === createdAt);
    
    if (!budget) {
        alert('Budget details not found.');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="budgetDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-file-invoice-dollar"></i> Budget Details: ${budget.city}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            Budget plan created on ${new Date(budget.createdAt).toLocaleDateString()} at ${new Date(budget.createdAt).toLocaleTimeString()}
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-8">
                                <h5 class="mb-3"><i class="fas fa-clipboard-list"></i> Experience Costs</h5>
                                <ul class="list-group mb-4">
                                    ${budget.experiences.map((exp, index) => `
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <span class="fw-bold">${index + 1}.</span> ${exp}
                                            </div>
                                            <span class="badge bg-primary rounded-pill">$${budget.experienceCosts[exp].toFixed(2)}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                                
                                <h5 class="mb-3"><i class="fas fa-plane"></i> Additional Expenses</h5>
                                <div class="list-group">
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>Transportation</div>
                                        <span class="badge bg-danger rounded-pill">$${budget.transportation.toFixed(2)}</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>Accommodation</div>
                                        <span class="badge bg-warning rounded-pill">$${budget.accommodation.toFixed(2)}</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>Food & Dining</div>
                                        <span class="badge bg-info rounded-pill">$${budget.food.toFixed(2)}</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>Miscellaneous</div>
                                        <span class="badge bg-secondary rounded-pill">$${budget.miscellaneous.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div class="alert alert-success mt-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h5 class="mb-0"><i class="fas fa-calculator"></i> Total Budget:</h5>
                                        <h4 class="mb-0">$${budget.total.toFixed(2)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h5 class="mb-0"><i class="fas fa-chart-pie"></i> Budget Breakdown</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="budgetDetailsChart" width="100%" height="250"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-danger" onclick="deleteBudget('${budget.city}', ${budget.createdAt})">
                            <i class="fas fa-trash-alt"></i> Delete Budget
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="printBudget()">
                            <i class="fas fa-print"></i> Print Budget
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('budgetDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('budgetDetailsModal'));
    modal.show();
    
    // Initialize chart after modal is shown
    setTimeout(() => {
        initializeBudgetDetailsChart(budget);
    }, 300);
}

// Initialize the budget details chart
function initializeBudgetDetailsChart(budget) {
    const ctx = document.getElementById('budgetDetailsChart').getContext('2d');
    
    // Calculate experiences total
    let experiencesTotal = 0;
    Object.values(budget.experienceCosts).forEach(cost => {
        experiencesTotal += cost;
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Experiences', 'Transportation', 'Accommodation', 'Food & Dining', 'Miscellaneous'],
            datasets: [{
                data: [
                    experiencesTotal,
                    budget.transportation,
                    budget.accommodation,
                    budget.food,
                    budget.miscellaneous
                ],
                backgroundColor: [
                    '#4BC0C0', // Experiences
                    '#FF6384', // Transportation
                    '#FFCE56', // Accommodation
                    '#36A2EB', // Food
                    '#9966FF'  // Misc
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

// Load an experience plan into the experience planner
function loadExperiencePlan(planIndex) {
    console.log("Loading experience plan", planIndex);
    
    // Get saved plans
    const savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    if (planIndex < 0 || planIndex >= savedPlans.length) {
        console.error("Invalid plan index");
        return;
    }
    
    const plan = savedPlans[planIndex];
    
    // Set current city
    city = plan.city;
    
    // Hide the saved experiences modal
    const savedExperiencesModal = document.getElementById('savedExperiencesModal');
    if (savedExperiencesModal) {
        const bsModal = bootstrap.Modal.getInstance(savedExperiencesModal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    // Show toast notification
    const toastId = 'planLoadedToast';
    const existingToast = document.getElementById(toastId);
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = `
        <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-info text-white">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong class="me-auto">Plan Loaded</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    <p>Experience plan for ${plan.city} has been loaded. Searching for places in ${plan.city}...</p>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.remove();
        }
    }, 3000);
    
    // Update city in the search form and trigger a search
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.value = plan.city;
        
        // Trigger a search with a generic query
        const queryInput = document.getElementById('query');
        if (queryInput) {
            queryInput.value = 'attractions';
            
            // Submit the search form
            const searchForm = document.getElementById('search-form');
            if (searchForm) {
                searchForm.submit();
            } else {
                // If form not found, call searchPlaces directly
                searchPlaces();
            }
        }
    }
}

// Delete a saved experience plan
function deleteSavedPlan(planIndex) {
    console.log("Deleting saved plan", planIndex);
    
    if (!confirm('Are you sure you want to delete this experience plan? This action cannot be undone.')) {
        return;
    }
    
    // Get saved plans
    let savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
    if (planIndex < 0 || planIndex >= savedPlans.length) {
        console.error("Invalid plan index");
        return;
    }
    
    // Get the plan to be deleted
    const planToDelete = savedPlans[planIndex];
    
    // Remove plan from array
    savedPlans.splice(planIndex, 1);
    
    // Save updated plans
    localStorage.setItem('experiencePlans', JSON.stringify(savedPlans));
    
    // Check if there's an associated budget and delete it too
    let savedBudgets = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    const budgetIndex = savedBudgets.findIndex(b => 
        b.city === planToDelete.city && b.createdAt === planToDelete.createdAt
    );
    
    if (budgetIndex !== -1) {
        savedBudgets.splice(budgetIndex, 1);
        localStorage.setItem('budgetPlans', JSON.stringify(savedBudgets));
    }
    
    // Refresh the modal
    viewSavedExperiences();
    
    // Show success toast
    const toastId = 'planDeletedToast';
    const existingToast = document.getElementById(toastId);
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = `
        <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-danger text-white">
                    <i class="fas fa-trash-alt me-2"></i>
                    <strong class="me-auto">Plan Deleted</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Experience plan for ${planToDelete.city} has been deleted.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.remove();
        }
    }, 3000);
}

// Delete a budget
function deleteBudget(cityName, createdAt) {
    console.log("Deleting budget for", cityName, "created at", createdAt);
    
    if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
        return;
    }
    
    // Get saved budgets
    let savedBudgets = JSON.parse(localStorage.getItem('budgetPlans') || '[]');
    
    // Find the budget index
    const budgetIndex = savedBudgets.findIndex(b => b.city === cityName && b.createdAt === createdAt);
    
    if (budgetIndex === -1) {
        alert('Budget not found.');
        return;
    }
    
    // Remove budget
    savedBudgets.splice(budgetIndex, 1);
    
    // Save updated budgets
    localStorage.setItem('budgetPlans', JSON.stringify(savedBudgets));
    
    // Hide the budget details modal
    const budgetDetailsModal = document.getElementById('budgetDetailsModal');
    if (budgetDetailsModal) {
        const bsModal = bootstrap.Modal.getInstance(budgetDetailsModal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    // Refresh the saved experiences modal
    setTimeout(() => {
        viewSavedExperiences();
    }, 500);
    
    // Show success toast
    const toastId = 'budgetDeletedToast';
    const existingToast = document.getElementById(toastId);
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = `
        <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 5000">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-danger text-white">
                    <i class="fas fa-trash-alt me-2"></i>
                    <strong class="me-auto">Budget Deleted</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Budget for ${cityName} has been deleted.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toast);
    
    // Auto-close the toast after 3 seconds
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.remove();
        }
    }, 3000);
}

// Print the budget
function printBudget() {
    window.print();
}

// Update calculateExperienceBudget to accept a parameter
function calculateExperienceBudget(useSelectedPlan = false) {
    console.log("Calculating budget for experiences", useSelectedPlan ? "using selected plan" : "");
    
    let latestPlan;
    
    if (useSelectedPlan) {
        // Use the selected plan from localStorage
        latestPlan = JSON.parse(localStorage.getItem('selectedExperiencePlan') || 'null');
        
        // Remove the selected plan from localStorage
        localStorage.removeItem('selectedExperiencePlan');
        
        if (!latestPlan) {
            alert('No selected experience plan found. Please create a plan first.');
            return;
        }
    } else {
        // Get the latest saved plan
        const savedPlans = JSON.parse(localStorage.getItem('experiencePlans') || '[]');
        if (savedPlans.length === 0) {
            alert('No experience plans found. Please create a plan first.');
            return;
        }
        
        latestPlan = savedPlans[savedPlans.length - 1];
    }
    
    // Rest of the existing function...
    // [The content here is identical to the existing calculateExperienceBudget function,
    // just make sure we're using latestPlan instead of savedPlans[savedPlans.length - 1]]
} 