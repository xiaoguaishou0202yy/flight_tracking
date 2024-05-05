// Name:          server.js

// Description:   Access flight tracking API.  GEOG 576 Lab 6

// Author:        Bucky Badger

const PORT = 8000

// Import Required Modules

const express = require("express")
const app = express() 

const {runQueries} = require('../server/database.js')

// Serve static files from the "/var/www/html" directory 
app.use(express.static('/var/www/html'))

// Middleware to parse JSON bodies
app.use(express.json());


const cors = require("cors")

// Allow us to load environment variables from the .env file
require("dotenv").config()

// *Need version 2.6.* of node-fetch library*
const fetch = require("node-fetch")

const request = require("request");
const { response } = require("express")


// Get the API Key from an Environment Variable called: FLIGHTS_API_KEY
const myFlightsAPIKey = process.env.flightsAPIKey

console.log("server.js(): myFlightsAPIKey: " + myFlightsAPIKey)

// Distance to find nearby airports
const nearbyAirportDistance = process.env.nearbyAirportDistance

console.log("nearby airport distance: " + nearbyAirportDistance)

// Base URL of Flight Tracking API
const api_base = "https://airlabs.co/api/v9/";

// Middleware. allowedOrigins - list of URL's that can access the node/express server routes
app.use(function (req, res, next) {

  console.log("+++++++++ in app.use() +++++++++++ ")

  // +++++++++++++++++++++++++++++++++++++++++++++++
  // Elastic IP Address of EC2 Node/Express Server
  // +++++++++++++++++++++++++++++++++++++++++++++++
  const allowedOrigins = ['http://54.242.202.14']

  const origin = req.headers.origin

  console.log("fetch_server: origin: " + origin)
  //console.log(req)
  
  if (allowedOrigins.includes(origin)) {
    console.log("  **origin is included: " + origin)
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  else {
    console.log(" origin is NOT included: " + origin)
  }

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// Hello Route
app.get('/hello', async (request, response) => {
  console.log("Hello to You! API route has been called")

  response.send({message: "Hello to You"})
  
})

// Invalid Flights Route
app.get('/flights', async (request, response) => {
  console.error("/flights is an invalid route")
  response.send("/flights is an invalid route")
  
})

// Flights Based on Airport Code Parameter
app.get('/flights/:airport_code', async (request, response) => {

  scriptName = "server.js: /flights/:airport_code(): "
  console.log("in " + scriptName + " ...")
  try {

      // Airport Code Parameter 
      console.log(scriptName + " request.params.airport_code: " + request.params.airport_code)

      var my_airport_code = request.params.airport_code
      console.log(scriptName + " airport_code: " + my_airport_code)

      // Check if airport_code is being passed in
      console.log(scriptName + "  length of airport code: " + my_airport_code.length)

      if (my_airport_code.length < 1) {

        my_airport_code = process.env.defaultAirportCode
        alert("Missing airport code.  Default set to: " + my_airport_code)
      }

      // Departing from Airport
      // const api_url = 'https://airlabs.co/api/v9/flights?api_key=' + myFlightsAPIKey + '&dep_iata=' + my_airport_code

      // Arrivals
      const api_url = 'https://airlabs.co/api/v9/flights?api_key=' + myFlightsAPIKey + '&arr_iata=' + my_airport_code

      console.log("*my airport code: " + api_url)

      const fetch_response = await fetch (api_url);
      const json = await fetch_response.json();

      console.log(json)

      // Read the response stream and produce and return a JavaScript object
      response.json(json);

      console.log(" +++++++++ calling runQueries() +++++++++++++++")
      
      // Used for lab 7
      runQueries(json)

      console.log(" +++++++++ completed runQueries() +++++++++++++++")

      console.log(`${scriptName} ++++++++++++ done with getFlights airport code: ++++++++++++++` + my_airport_code)
    }
  catch (error) {
    console.error(scriptName + " Error getting flights for airport: " + error.stack)
  }

}); //end flights

// Flight search route
app.post('/searchFlights', async (request, response) => {
  try {
    // Retrieve departure and destination cities from the request body
    const { departureCity, destinationCity } = request.body;
    console.log(request.body.departureCity, request.body.destinationCity)




    // Fetch nearby airports for departure city
    const departureAirportsResponse = await fetch(`https://airlabs.co/api/v9/airports?api_key=${myFlightsAPIKey}&city_code=${departureCity}`);
    const departureAirportsData = await departureAirportsResponse.json();


    //console.log(departureAirportsData);
    const valid_depa = departureAirportsData.response.filter(airport => airport.iata_code !== null);
    const departureAirports = valid_depa.map(dep_airport => {
        return {
            name: dep_airport.name,
            iata_code: dep_airport.iata_code,
            icao_code: dep_airport.icao_code,
            latitude: dep_airport.lat,
            longitude: dep_airport.lng,
            country_code: dep_airport.country_code
        };
    });

    departureAirports.forEach(dep_airport => {
      console.log(dep_airport.name); // This will log the name of each airport to the console
    });

    // Fetch nearby airports for destination city
    const destinationAirportsResponse = await fetch(`https://airlabs.co/api/v9/airports?city_code=${destinationCity}&api_key=${myFlightsAPIKey}`);
    const destinationAirportsData = await destinationAirportsResponse.json();
    //console.log(destinationAirportsData);
    const valid_desa = destinationAirportsData.response.filter(airport => airport.iata_code !== null);
    const destinationAirports = valid_desa.map(des_airport => {
        return {
            name: des_airport.name,
            iata_code: des_airport.iata_code,
            icao_code: des_airport.icao_code,
            latitude: des_airport.lat,
            longitude: des_airport.lng,
            country_code: des_airport.country_code
        };
    });

    destinationAirports.forEach(des_airport => {
      console.log(des_airport.name); // This will log the name of each airport to the console
    });


    // List of specific airlines to filter by their names
    const specificAirlines = [
      //"Delta Air Lines", 
      "Southwest Airlines", 
      "United Airlines", 
      //"American Airlines", 
      //"Alaska Airlines"
    ];

    // Fetch nearby airports for destination city
    const airlinesResponse = await fetch(`https://airlabs.co/api/v9/airlines?country_code=US&api_key=${myFlightsAPIKey}`);
    if (!airlinesResponse.ok) {
      throw new Error(`API responded with status: ${airlinesResponse.status}`);
    }
    const airlinesData = await airlinesResponse.json();

    const valid_airlines = airlinesData.response.filter(airline => specificAirlines.includes(airline.name));
    //console.log(destinationAirportsData);
    if (!airlinesResponse.ok) {
      console.error('API responded with an error:', airlinesData.message); // Assuming the API sends back an error message
      throw new Error(`API responded with status: ${airlinesResponse.status}`);
    }

    const airlines = valid_airlines.map(airline => {
        return {
            name: airline.name,
            iata_code: airline.iata_code,
            icao_code: airline.icao_code,
            country_code: airline.country_code
        };
    });

    airlines.forEach(airline => {
      console.log(airline.name,airline.iata_code,airline.icao_code); // This will log the name of each airport to the console
    });




    let allRoutes = []; // Array to store all routes

    async function fetchRoutes() {
      for (const dep_airport of departureAirports) {
        for (const des_airport of destinationAirports) {
          for (const airline of airlines) {
            const routesRequestUrl = `https://airlabs.co/api/v9/routes?api_key=${myFlightsAPIKey}&dep_iata=${dep_airport.iata_code}&dep_icao=${dep_airport.icao_code}&arr_iata=${des_airport.iata_code}&arr_icao=${des_airport.icao_code}&airline_iata=${airline.iata_code}&airline_icao=${airline.icao_code}`;
            
            try {
              const routesResponse = await fetch(routesRequestUrl);
              const routesData = await routesResponse.json();

              console.log('API response:', JSON.stringify(routesData, null, 2));

              // Ensure that routesData is actually an array
              if (Array.isArray(routesData.response)) {
                  const routes = routesData.response.map(route => ({
                      flight_iata: route.flight_iata,
                      dep_iata: route.dep_iata,
                      dep_time: route.dep_time,
                      arr_iata: route.arr_iata,
                      arr_time: route.arr_time,
                      duration: route.duration,
                      days: route.days,
                      aircraft_icao: route.aircraft_icao
                  }));
                  allRoutes.push(...routes);
              } else {
                  console.error('Expected an array but got:', typeof routesData);
              }

                
            } catch (error) {
              console.error('Error fetching route data:', error);
            }
          }
        }
      }
    }
  
    console.log(" +++++++++ fetching routes +++++++++++++++")
    await fetchRoutes();
    console.log("+++++++++ Fetching routes complete ++++++++++++++");

    response.json({routes: allRoutes});  // Send only the routes data back to client


    
  } catch (error) {
    console.error('Search Flights Error:', error);
    response.status(500).send('Internal Server Error');
  }
});


// --------------------------------------------------
// Nearby Airports Route with Lat/Long as Parameters
// --------------------------------------------------
app.get('/nearbyAirports/:latitude,:longitude', async (request, response) => {

  try {

        // Airport Code Parameter 
        console.log("**server.js: nearbyairports(/) request.params.latitude Longitude: " + request.params.latitude + request.params.longitude)

        var latitude, longitude

        // Check if latitude and longitude are populated
        if (isNaN(request.params.latitude)) {
          console.log(" ** setting lat to default value ...")

          // Populate latitude from the default value in .env file
          latitude = process.env.defaultLatitude

        }
        else {
          // Populate from route parameters
          latitude = request.params.latitude
        }

        // Use Default lat/long if No Values are Present
        if (isNaN(request.params.longitude)) {
          console.log(" ** setting lat to default value ...")

          // Populate latitude from the default value in .env file
          longitude = process.env.defaultLongitude

        }
        else {
          // Populate from route parameters
          longitude = request.params.longitude
        }

        console.log("server.js: lat: " + latitude + ' long:' + longitude)

        // Check if latitude, longitude is being passed in
        console.log("server.js  length of lat long: " + latitude.length)

         // URL to Get Nearby Airports
        const api_url = 'https://airlabs.co/api/v9/nearby?api_key=' + myFlightsAPIKey + '&distance=' + nearbyAirportDistance + '&lat=' + latitude + '&lng=' + longitude


        console.log("*nearby airport URL: " + api_url)

        // Make request to airlabs.com 
        const fetch_response = await fetch (api_url);
        const json = await fetch_response.json();

        console.log(json)
        response.json(json);

}


catch (error) {
    console.error("Error getting nearby airport: " + error)

}

}); //end nearbyAirports

app.listen(PORT, '0.0.0.0', function(error) {

  if (error) {
    console.error("Error while starting server" + error.stack)
  }
  else {
    console.log("Node Server is Listening on PORT: " + PORT)
  }
})