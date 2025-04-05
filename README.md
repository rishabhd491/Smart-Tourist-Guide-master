# 🗺️ Smart Tourist Guide

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/PHP-8.0+-blue.svg)](https://php.net)
[![Demo Video](https://img.shields.io/badge/Demo-Video-red.svg)](https://www.youtube.com/watch?v=-g5eFz1LeUU)

A smart, personalized travel planning system that helps users discover and explore destinations based on their interests and preferences.

## 🌟 Features

- **Personalized Recommendations**: Get tailored suggestions based on your interests and preferences
- **Smart Route Planning**: Optimized itineraries with efficient travel routes
- **Weather Integration**: Real-time weather updates for better planning
- **Interactive Maps**: Visual representation of destinations and routes
- **User Profiles**: Save preferences and travel history
- **Email Notifications**: Get your travel plans delivered to your inbox

## 🚀 Demo

Check out our demo video to see Smart Tourist Guide in action:
[![Smart Tourist Guide Demo](https://img.youtube.com/vi/-g5eFz1LeUU/0.jpg)](https://www.youtube.com/watch?v=-g5eFz1LeUU)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/rishabhd491/Smart-Tourist-Guide-master.git
```

2. Set up the database:
- Import the `sctdb.sql` file into your MySQL database
- Update database credentials in `config.php`

3. Configure API keys:
- Update the following in `config.php`:
  - OpenWeatherMap API key
  - Google Maps API key

4. Start the PHP development server:
```bash
php -S localhost:8000
```

5. Access the application at `http://localhost:8000`

## 📋 Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx) or PHP's built-in server
- Modern web browser

## 🏗️ Project Structure

```
Smart-Tourist-Guide/
├── aboutus/           # About us pages
├── css/              # Stylesheets
├── images/           # Image assets
├── js/               # JavaScript files
├── login/            # Login system
├── plugins/          # Third-party plugins
├── styles/           # Additional styles
├── travelez/         # Travel-related pages
├── config.php        # Configuration file
├── connection.php    # Database connection
├── index.html        # Main entry point
├── search.php        # Search functionality
└── weather-proxy.php # Weather API integration
```

## 🔑 API Integration

The project integrates with several APIs:
- OpenWeatherMap API for weather data
- Google Maps API for location services
- Foursquare API for venue recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Rishabh Dubey** - *Initial work* - [rishabhd491](https://github.com/rishabhd491)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped improve this project
- Special thanks to the open-source community for their valuable tools and libraries

## 📞 Contact

For any queries or support, please reach out to:
- Email: [your-email@example.com]
- GitHub: [rishabhd491](https://github.com/rishabhd491)

---

<div align="center">
  <sub>Built with ❤️ by the Smart Tourist Guide team</sub>
</div>

# Smart-Tourist-Guide:This app helps user to specify city where he/she want to visit and our application will suggest places and venues based on user interest.</br>
#[Click to get Full project report](https://drive.google.com/file/d/1e8KjkT6tBErOEmAxyidbQJYB1peKco53/view?usp=sharing) </br>
<strong>1. INTRODUCTION</strong></br>
Smart City Traveler is a web application to create a schedule for atraveler travelling to a city to exploreitby specifying interests and types of places want to visit. Our system then smartly  analyzes  the questionnaire  and  creates  a  schedule  fortraveler  based  on  provided timeand gives a shortest route to reach all places from one to another .By the name it  itself indicates  the way  in  analyzing  user's  likes  and  dislikes  and  is basically used to help a traveler new to the city or anyone who wants to explore a city in the given  time  periodand  their  interests,  the  systemfirst fetches user's current location using GPS and thenmakes use of the Foursquare APIto get all the locations and places with all their information to sort and place it before the user to make his choice. The places are sorted and selected based on the top rankings by the foursquareand a shortest route is displayed to the user to save their time.</br>
<strong>2. WORKING</strong>
AftertheRegistration,the user is asked some questions helping the systemto filter out  in  searching  the  places,  the  places  are  displayed  on amap  giving  a  clear  idea  of  the location  and  giving the paths  from  one place to  another  from  the  start  location  to  the  end location. The system also asks the userwhether he/shewants to visit anadventure or water parkor a temple or want to have coffeeand will show theoptions based on the rankings and reviews about the place. Since the Traveler may be new to the city not knowing any place, in the map view if the user clicks on the marker,he/shecan see the ratings and reviews which are recorded from the Foursquare itself.The best thing is that the system will also forward a mail  to  the  user  containing  information  about  his/her  plan. The  System  requires a  working internet connection all the time for the applicationto work.</br>
<strong>3. FEATURES</strong></br>
•Registration: The user hasto register into the system with theirbasic details.</br>
•Login: The user has to Login into the System to make use of it.</br>
•Dashboard: The user is allowed to see his/hertravel planon dashboard, i.e. theplaces to visit.</br>
•Planning Your Day: The user has to just put their interestsand enable their GPS and the rest work is done by system.</br>
•Map  View:The  user  will  get  an  interactive  map  with  all  the  places  to  visit  as marked(pinned) on the map making it easier to see all the location.</br>
•ShortestRoute: The  user  can  see  the  shortest  route  that  connects  all  the  places marked saving their money wasted in taking longer route.</br>
•E-mail: The  system  will be sent  an  e-mail to the user's mailing address with all the details.</br>
<strong>Important</strong>
Use the database file given inside the  project.</br>
Warning : User current location feature might not work in chrome but it works properly in firefox.


