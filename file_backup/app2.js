// Name:            app.js
//
// Description:     GEOG 576 Part 3.  Use flight tracking API to display aircraft locations
//
// Author:          Bucky Badger

console.log("app.js()  starting app.js() ... ")

// ------------------------------------
// Elastic IP Address of EC2 Instance
// ------------------------------------
ec2ServerURL = 'http://54.242.202.14'


// Get lat/lng from local storage variables
console.log("app.js() localStorage (lat): " + localStorage.getItem('latitude'))
console.log("app.js() localStorage (lng):" + localStorage.getItem('longitude'))

var myLatitude = localStorage.getItem('latitude')
var myLongitude = localStorage.getItem('longitude')

// Verify location variables have values.  If not, set default lat/lon values
if (myLatitude == null || myLongitude == null) {
    console.log(" setting latitude, longitude to default values ...")

    localStorage.setItem('latitude',43.0637)
    localStorage.setItem('longitude',-89.2043)

    myLatitude = localStorage.getItem('latitude')
    myLongitude = localStorage.getItem('longitude')

}

console.log("app.js() myLat/Lng: " + myLatitude + " " + myLongitude)

const tableBody = document.getElementById('table_body')


// Default Airport Code
// const defaultAirportCode = process.env.defaultAirportCode
defaultAirportCode = "MSN"

console.log("mapping.js: checking flightURL ...")

// Add Flight data to Map

async function showFlights() {


    try {
        const flightURL = ec2ServerURL + ':8000/flights/' + '&arr_iata=' + defaultAirportCode
        scriptName = "mapping.js: showFlights(): "
        console.log("in "+ scriptName)
        console.log("  **flightURL: " + flightURL)

        const response = await fetch(flightURL)
        const json = await response.json()

        console.log(scriptName + " data: " + json)

        var delim = ","

        var planeIcon = L.icon({
            iconUrl: 'icons8-plane-24.png',
        
            iconSize:     [24, 24], // size of the icon
            shadowSize:   [26, 26], // size of the shadow
            iconAnchor:   [22, 22], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -24] // point from which the popup should open relative to the iconAnchor
        });
        
            for (let i = 0; i < json.response.length;i++) {
    
                // Put marker on map
                console.log("adding marker to map. LatLng: " + json.response[i].lat,json.response[i].lng)

                // const marker = L.marker([json.response[i].lat,json.response[i].lng]).addTo(map)
                const marker = L.marker([json.response[i].lat,json.response[i].lng],{icon:planeIcon}).addTo(map)

                console.log(json.response[i].reg_number + delim + json.response[i].alt + delim  +
                json.response[i].dir + delim + json.response[i].speed + delim + json.response[i].lat +
                delim + json.response[i].lng + delim + json.response[i].dep_iata + delim + json.response[i].flight_icao + delim + json.response[i].status)

                }  // end for


    } catch (error) {
        console.error("Error fetching flightURL: " + flightURL + " Error: " + error.stack) 
    }

}  // end showFlights()

// ----------------------------------
// Get Flights for Specified Airport
// ----------------------------------

const getFlights = async function (airportCode)  {

    try {
 
        console.log("app.js()  in getFlights() ...")

        // Check if airportCode is set.  First time through,
        // the airportCode gets set to current location;
        // Can be set by user on subsequent passes

        console.log("app.js()  in getFlights() airportCode: " + airportCode)
        if (typeof airportCode == 'undefined') {
            console.log("app.js()  in getFlights() setting airportCode to default value")
            
            airportCode = 'MSN'
        }

        console.log("app.js: in getFlights() ...airport code: " + airportCode)

        // ----------------------------------------------------
        // Need to use Elastic IP Address of EC2 Instance Here
        // ----------------------------------------------------
       const api_url = ec2ServerURL + ':8000/flights/' + `${airportCode}`
       
        console.log("app.js: getFlights() api_url: " + api_url)
       
        // Call API to get current flights for selected airport

        const response = await fetch(api_url);   

        // Wait for response from flight API
        const json = await response.json();

        console.log("** app.js: getFlights() " + json);
        console.log(json)

        console.log("app.js: getFlights() length: " + json.response.length)

        if (json.response.length < 1) {
            alert("No response from flight tracking API ... try again later")
        }

        // Populate the Flight Table with Active Flights
        populateFlightTable(json)

        // Create a Text File and Load Into Postgres
        // createCSVAndLoad(json)
  
    } // end try
    catch (error) {
        console.error("app.js: getFlights() Error getting flights. Error: " + error.stack)
    }

}  // end getFlights

// Get nearby airport(s)

const getNearbyAirports = async function ()  {

    try {
 
        console.log("app.js:  in getNearbyAirports() ...")
        
        console.log("app.js:  getNearbyAirports() calling nearbyAirports ...")

        // Make sure to use backticks when defining the route parameter
        console.log("app.js:  getNearbyAirports() calling flights api ...")
        
        // Need to use the Elastic IP Address
        const api_url = ec2ServerURL + `:8000/nearbyAirports/` + `${myLatitude},${myLongitude}`

        console.log("app.js: getNearbyAirports() api_url: " + api_url)
       
        const response = await fetch(api_url);

        const json = await response.json();

        console.log(json);

        console.log("app.js: getNearbyAirports() length: " + json.response.airports.length)

        if (json.response.airports.length < 1) {
            alert("No response from flight tracking (nearby) API... try again later")
        }

        // Read the response from the Nearby Airport API Call
        getNearbyAirportResults(json)
  
        console.log("app.js() ** done getting nearby airports ...")

    } // end try
    catch (error) {
        console.error("app.js() Error getting nearby airport. Error: " + error.stack)

        airportName = '*Error getting nearby airport.  Is the server running?'
        airportIataCode = -1
    
        // Find the element on page where id='location'
        var x = document.getElementById("nearbyAirport");
    
        // Display the Nearby Airport on page
        x.innerHTML= airportName + " (" + airportIataCode + ")"
    
    }

}  // end getNearByAirport()


// --------------------
// Show Flights on Map
// --------------------
console.log("--------------------------")
console.log("app.js:  calling: getFlights() ...")
showFlights()


console.log("app.js: calling: getNearbyAirports() ....")
getNearbyAirports()

// --------------------
// Get Current Flights
// --------------------
console.log("--------------------------")
console.log("app.js:  calling: getFlights() ...")
getFlights()

// --------------------------------------
// Populate flight table with attributes
// --------------------------------------
const populateFlightTable = (json) => {

    console.log("app.js() in populateFlightTable ...")

    var tableCell

            // Indicate no data is available when API is not reachable
            if (json.response.length < 1) {

                // Create entry to indicate 'no data' available
                console.log("creating new table row ...")
                const tableRow = document.createElement('tr')

                tableCell = document.createElement("td")
                tableCell.append('no data')
                tableRow.append(tableCell)

                tableBody.append(tableRow)

            }

            else {
           
            // Loop through the response
            for (let i = 0; i < json.response.length;i++) {

                // Display Flight Attributes in a SPAN Element
                // document.getElementById('aircraft').textContent = json.response[i].reg_number
    
                console.log("reg_number: " + json.response[i].reg_number + " altitude: " + json.response[i].alt)

                // --------------
                // New Table Row
                // --------------
                console.log("creating new table row ...")
                const tableRow = document.createElement('tr')
                tableRow.className = ".departures"
                
                const flightDetails = {
                    flight: json.response[i].reg_number,
                    direction: json.response[i].dir
                }

                    // Altitude
                    // --------
                    tableCell = document.createElement("td")
                    tableCell.append(json.response[i].alt)
                    tableRow.append(tableCell)

                    // Aircraft Registration #
                    // -----------------------
                    tableCell = document.createElement('td')
                    tableCell.append(json.response[i].reg_number)

                    tableCell.className = "departures"

                    tableRow.append(tableCell)

                    // Direction
                    // ---------
                    tableCell = document.createElement("td")
                    tableCell.append(json.response[i].dir)
                    tableRow.append(tableCell)

                    // Latitude
                    // ---------
                    tableCell = document.createElement("td")
                    tableCell.append(json.response[i].lat)
                    tableRow.append(tableCell)

                    // Latitude
                    // ---------
                    tableCell = document.createElement("td")
                    tableCell.append(json.response[i].lng)
                    tableRow.append(tableCell)


                    tableBody.append(tableRow)
    
            }  // end for
            
        } // end if/else

} // end populateFlightTable

// Get the nearby airport results
// ------------------------------
console.log("app.js() calling: getNearbyAirportResults ...")

// Populate flight table with current flight attributes
const getNearbyAirportResults = (json) => {

    try {

   
        console.log("app.js() in getNearbyAirportResults ...")

        if (json.response.airports.length < 1) {
            alert("No nearby airport found from flight tracking API ... try changing distance")

            airportName = 'unknown'
            airportIataCode = -1

            // Find the element on page where id='location'
            var x = document.getElementById("nearbyAirport");

            // Display the Nearby Airport on page
            x.innerHTML= airportName + " (" + airportIataCode + ")"
 
        }
        else {


            // Loop through the response
            for (let i = 0; i < json.response.airports.length;i++) {
    
                // console.log("airports: " + json.response[i].airports + " altitude: " + json.response[i].alt)
                console.log("airport name: " + json.response.airports[i].name + " iata_code: " + json.response.airports[i].iata_code)
                
                // Save the first airport name
                if (i == 0) {
                    airportName = json.response.airports[i].name
                    airportIataCode = json.response.airports[i].iata_code
                }
            }  // end for
        }  // end if/else

    // Find the element on page where id='location'
    var x = document.getElementById("nearbyAirport");

    // Display the Nearby Airport on page
    x.innerHTML = "<br />" + "Nearby Airport: " + airportName + " (" + airportIataCode + ")"
 
}
catch {
    alert("Error getting nearby airport data")
    console.error("Error getting nearby airport data")

    airportName = 'unknown'
    airportIataCode = -1

    // Find the element on page where id='location'
    var x = document.getElementById("nearbyAirport");

    // Display the Nearby Airport on page
    x.innerHTML= "Nearby Airport: " + airportName + " (" + airportIataCode + ")"

}

} // end getNearbyAirportResults