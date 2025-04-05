<?php
session_start();
include('connection.php');

$id = $_SESSION['id'];
$likes = $_SESSION['ulike'];
$city = $_SESSION['ucity'];
$str = "";
$_SESSION['ival'] = 1;
$lat_long="";

for($i = 1; $i < $_SESSION['index']; $i++){
	//$lat_long=$lat_long+$_SESSION['lat'][$_SESSION['ival']]." ".$_SESSION['lng'][$_SESSION['ival']]."<br>";
  if($i==$_SESSION['index']-1)
  {
     $lat_long .= $_SESSION['lat'][$_SESSION['ival']] . ','.$_SESSION['lng'][$_SESSION['ival']];
  }
  else
  {
    $lat_long .= $_SESSION['lat'][$_SESSION['ival']] . ','.$_SESSION['lng'][$_SESSION['ival']].',';
  }
	$_SESSION['ival'] = $_SESSION['ival'] + 1;
}

$str = "";
$venues = ",";
for($i = 0; $i < strlen($likes) - 1; $i++){
	if($likes[$i] == ","){
		$venues .= $_SESSION[$str].",";
		$str = "";
	}
	else{
		$str .= $likes[$i];
	}
}

$venues .= $_SESSION[$str];
$str = "";

$_SESSION['ival'] = 1;
?>
<?php
//index.php

$subject = 'smart city suggestions';
$message = '';
$gmap="https://www.google.com/maps/search/?api=1&query=";
$rest=explode(',', $venues);
for($i = 1; $i < $_SESSION['index']; $i++){
  
  $gmap="<tabel border=\"1\"><tr><th>".$rest[$i]."</th><th></th></tr><tr><td></td></tr><tr><td>"."https://www.google.com/maps/search/?api=1&query=".$_SESSION['lat'][$_SESSION['ival']].','.$_SESSION['lng'][$_SESSION['ival']].PHP_EOL.'</tabel>';
	//$gmap="hello";
  $message.=$gmap.' ';
	$_SESSION['ival'] = $_SESSION['ival'] + 1;
}



	
		require 'PHPMailerAutoload.php';
		$mail = new PHPMailer;
		$mail->SMTPDebug = 0;   
		$mail->IsSMTP();								//Sets Mailer to send message using SMTP
		$mail->Host = 'smtp.gmail.com';		//Sets the SMTP hosts of your Email hosting, this for Godaddy
		$mail->Port = '587';								//Sets the default SMTP server port
		$mail->SMTPAuth = true;							//Sets SMTP authentication. Utilizes the Username and Password variables
		$mail->Username = 'smartguide.mnnit@gmail.com';					//Sets SMTP username
		$mail->Password = '2018is10';					//Sets SMTP password
		$mail->SMTPSecure = 'tls';							//Sets connection prefix. Options are "", "ssl" or "tls"
		$mail->From ="smartguide.mnnit@gmail.com";					//Sets the From email address for the message
		$mail->FromName ='smart city travelers';				//Sets the From name of the message
		 $mail->AddAddress($_SESSION['email'],"Customer");		//Adds a "To" address
		//$mail->AddCC($email, $_POST["name"]);	//Adds a "Cc" address
		$mail->WordWrap = 50;							//Sets word wrapping on the body of the message to a given number of characters
		$mail->IsHTML(true);							//Sets message type to HTML				
		$mail->Subject = $subject;				//Sets the Subject of the message
		$mail->Body = $message;				//An HTML or plain text message body
		$mail->Send();					//Send an Email. Return true on success or false on error
		


?>
<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>Smart Guide</title>
          <style>
            #map{
              height:500px;
              width:700px;
            }
          </style>
		  <style>
			.column1 {
				float: left;
				width: 50%;
			}

			.column2 {
				float: right;
				width: 40%;
			}
		  </style>
		<!--===============================================================================================-->
		<link rel="icon" type="image/png" href="images/icons/favicon.ico"/>
		<!--===============================================================================================-->
		<link rel="stylesheet" type="text/css" href="vendor/bootstrap/css/bootstrap.min.css">
		<!--===============================================================================================-->
		<link rel="stylesheet" type="text/css" href="fonts/font-awesome-4.7.0/css/font-awesome.min.css">
		<!--===============================================================================================-->
		<link rel="stylesheet" type="text/css" href="vendor/animate/animate.css">
		<!--===============================================================================================-->
		<link rel="stylesheet" type="text/css" href="vendor/css-hamburgers/hamburgers.min.css">
		<!--===============================================================================================-->
		<link rel="stylesheet" type="text/css" href="vendor/select2/select2.min.css">
		<!--===============================================================================================-->
		<link rel="stylesheet" type="text/css" href="css/util.css">
		<link rel="stylesheet" type="text/css" href="css/main.css">
		<!--===============================================================================================-->
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
        </head>
        <body>
		
		<!-- Header -->
		<div class="header">
			<a href="home.php" class="logo">Smart City Traveller</a>
			<div class="header-right">
				<a class="active" href="home.php">Home</a>
				<a href="signout.php">signout<img src="images/icons/user_ironman.png"/></a>
				<a href="../aboutus/aboutus.html">About us</a>
			</div>
		</div>


<!-- Content -->
		
		
		<div class="bg-contact3" style="background-image: url('images/home_slider.jpg');">

			<div class="container-contact3 container-fluid">
				<div class="row">
					<div class="column1">

						<div class="split left">
								<h1><font color="Black">Your Route</font></h1>
								<div id="map"></div>
						</div>
					</div>
					<div class="column2">
						<div class="split right">
								<h1><font color="Black">Venue List</font></h1>
								<div class="wrap-contact3" id="ven"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<script>
			function initMap(){
			// Map options
			var options = {
				zoom:12,
				center:{lat:40.355048,lng:-79.835499}
			}
						
			function calcDistance(p1, p2) {
				return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
			}

			// New map
			var map = new google.maps.Map(document.getElementById('map'), options);
			var directionsService = new google.maps.DirectionsService();
			var directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);
              
            // Add traffic layer to show real-time traffic conditions
            var trafficLayer = new google.maps.TrafficLayer();
            trafficLayer.setMap(map);
              
            var request = {   
                travelMode: google.maps.TravelMode.DRIVING, 
                optimizeWaypoints: true, 
                waypoints: [],
                // Add driving options for traffic information
                drivingOptions: {
                    departureTime: new Date(Date.now()),  // Current time
                    trafficModel: google.maps.TrafficModel.BEST_GUESS // Best guess for traffic estimation
                }
            };

            // Listen for click on map
            google.maps.event.addListener(map, 'click', function(event){
                // Add marker
                addMarker({coords:event.latLng});
            });

            var noOfMarker = <?php echo $_SESSION['index'] - 1;?>;
            // Array of markers
            var markers=[
                {
                    coords:{lat:25.4920,lng:81.8639}
                }
            ];
				
			var my_lat = <?php echo $_SESSION['mylat'];?>;
			markers[0].coords.lat = parseFloat(my_lat);
			var my_lng = <?php echo $_SESSION['mylng'];?>;
			markers[0].coords.lng = parseFloat(my_lng);
			  
			var l_name = '<?php echo $venues; ?>';
			var cs = '<?php echo $lat_long?>';
			var ay = cs.split(",");
			var loc_name = l_name.split(",");
		
			var l = ay.length-1;
			var distance=new Array(l+1);
			for(var i=0; i <ay.length; i=i+2){
				//coords = new Object();
				lat = ay[i];
				lng = ay[i+1];
				lng=parseFloat(lng);
				lat=parseFloat(lat);
				temp={coords:{lat,lng}};
				markers.push(temp);
			}
			 
			  
			//calculates distance between two points in km's
			var ct=1;
			var mn=2000000;
			for(var j=1;j<markers.length;j++)
			{
				var p1 = new google.maps.LatLng(markers[0].coords.lat,markers[0].coords.lng);
				var p2 = new google.maps.LatLng(markers[j].coords.lat,markers[j].coords.lng);
				distance[ct]=calcDistance(p1, p2);
				if(mn > parseFloat(distance[ct])){
					mn = distance[ct];
				}
				ct++;
			}
			console.log("min distance="+mn);
			
			
			for(var i=1; i < ct; i++){
				var k = parseFloat(distance[i]);
				var lat1 = markers[i].coords.lat;
				var lng1 = markers[i].coords.lng;
				var name_loc = loc_name[i];
				
				var j = i - 1;
				
				while(j >= 1 && parseFloat(distance[j]) > k){
					markers[j+1].coords.lat = markers[j].coords.lat;
					markers[j+1].coords.lng = markers[j].coords.lng;
					distance[j+1] = distance[j];
					loc_name[j+1] = loc_name[j];
					j--;
				}
				
				
				markers[j+1].coords.lat = lat1;
				markers[j+1].coords.lng = lng1;
				distance[j+1] = k;
				loc_name[j+1] = name_loc;
			}
			
			for(i=1; i<markers.length; i++){
				btn = document.createElement("div");
				btn.innerHTML = loc_name[i]+" &nbsp &nbsp &nbsp Distance:"+distance[i];
		//		btn.setAttribute("class","btnsize");
				btn.setAttribute("id","btn"+i);
				btn.setAttribute("class", "class=btn btn-default btn-sm btn-block")
				btn.setAttribute("onclick", "#");
				document.getElementById("ven").appendChild(btn);
			}
			
			// Add traffic information section
			var trafficHeader = document.createElement("div");
			trafficHeader.innerHTML = "<h3>Traffic Information</h3><p>Real-time traffic data will be shown when the route is calculated</p>";
			trafficHeader.setAttribute("class", "traffic-header");
			document.getElementById("ven").appendChild(trafficHeader);

			var trafficInfo = document.createElement("div");
			trafficInfo.setAttribute("id", "traffic-info");
			document.getElementById("ven").appendChild(trafficInfo);
			
			var i;
			// Loop through markers
			for(i = 0;i < markers.length;i++){
				// Add marker
				addMarker(markers[i]);
			}

			// Add Marker Function
			function addMarker(props){
				var marker = new google.maps.Marker({
				  position:props.coords,
				  map:map,
				  icon:props.iconImage
				});

				// Check for customicon
				if(props.iconImage){
				  // Set icon image
				  marker.setIcon(props.iconImage);
				}

				// Check content
				if(props.content){
				  var infoWindow = new google.maps.InfoWindow({
					content:props.content
				  });

				  marker.addListener('click', function(){
					infoWindow.open(map, marker);
				  });
				}     
				if (i === 0) { 
					request.origin = props.coords; 
				}
				else if (i === markers.length - 1) {
					request.destination = props.coords;
					}
					else {
						if (props.coords) {
						request.waypoints.push({
						location: props.coords,
						stopover: true
							})
						}

					}
				//End of Add Marker Function
            }
            
            // Helper function to convert duration string to minutes
            function convertToMinutes(durationStr) {
                var hours = 0;
                var minutes = 0;
                
                if(durationStr.includes('hour')) {
                    var hoursPart = durationStr.split('hour')[0].trim();
                    hours = parseInt(hoursPart);
                    
                    if(durationStr.includes('min')) {
                        var minutesPart = durationStr.split('hour')[1].split('min')[0].trim();
                        minutes = parseInt(minutesPart);
                    }
                } else if(durationStr.includes('min')) {
                    var minutesPart = durationStr.split('min')[0].trim();
                    minutes = parseInt(minutesPart);
                }
                
                return hours * 60 + minutes;
            }
            
			directionsService.route(request, function(response, status){
				if (status == "OK"){
					directionsDisplay.setDirections(response);
					
					// Add traffic information
					var route = response.routes[0];
					var trafficInfoHTML = "";
					
					for(var i = 0; i < route.legs.length; i++) {
						var leg = route.legs[i];
						var start = leg.start_address.split(',')[0];
						var end = leg.end_address.split(',')[0];
						var distance = leg.distance.text;
						var duration = leg.duration.text;
						var durationInTraffic = leg.duration_in_traffic ? leg.duration_in_traffic.text : duration;
						
						trafficInfoHTML += "<div class='route-segment'>";
						trafficInfoHTML += "<p><strong>From:</strong> " + start + " <strong>To:</strong> " + end + "</p>";
						trafficInfoHTML += "<p><strong>Distance:</strong> " + distance + "</p>";
						trafficInfoHTML += "<p><strong>Normal Duration:</strong> " + duration + "</p>";
						trafficInfoHTML += "<p><strong>Duration with Traffic:</strong> " + durationInTraffic + "</p>";
						
						// Calculate traffic severity based on ratio of traffic duration to normal duration
						var normalMinutes = convertToMinutes(duration);
						var trafficMinutes = convertToMinutes(durationInTraffic);
						
						var trafficSeverity = "Low";
						var severityColor = "green";
						
						if(trafficMinutes > normalMinutes * 1.5) {
							trafficSeverity = "High";
							severityColor = "red";
						} else if(trafficMinutes > normalMinutes * 1.2) {
							trafficSeverity = "Medium";
							severityColor = "orange";
						}
						
						trafficInfoHTML += "<p><strong>Traffic Condition:</strong> <span style='color:" + severityColor + ";'>" + trafficSeverity + "</span></p>";
						trafficInfoHTML += "</div><hr>";
					}
					
					// Display traffic information in the UI
					document.getElementById("traffic-info").innerHTML = trafficInfoHTML;
				}
			});
        }
        </script>
        <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCIZsk8SNPVQMm8Tu4TXieZT0xIqkMSECo&callback=initMap&libraries=geometry">
        </script>
        </body>
        </html>