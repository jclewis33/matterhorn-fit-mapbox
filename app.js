"use strict";

//This script correlates everything based on the city name in the CMS. The location ID is based on this city name, which means the city name needs to be unique. It cannot be a duplicate. If you find it is being duplicated, can use another selector that will not be duplicated in the future.

window.Webflow ||= [];
window.Webflow.push(() => {
  //alert("connected");
  //////////////////////////////////////////////////////////////
  /////////////////////// VARIABLES ////////////////////////////

  // Variables for the map card wrapper, items, and close buttons
  const locationMapCardWrapper = document.querySelector(
    "[locations-map-card-wrapper]"
  );
  const locationMapCardItem = document.querySelectorAll(
    "[locations-map-card-item]"
  );
  const locationMapCardCloseBtn = document.querySelectorAll(
    "[locations-map-card-close-block]"
  );

  // Variables for the sidebar items and popups
  const locationItemSidebar = document.querySelectorAll(
    "[location-item-sidebar]"
  );
  const popUps = document.getElementsByClassName("mapboxgl-popup");

  // Remove the 'is--show' class from the map card wrapper
  locationMapCardWrapper.classList.remove("is--show");

  // Global markers array
  let markers = [];

  // Set the Mapbox access token for authentication
  mapboxgl.accessToken =
    "pk.eyJ1Ijoia3QtbWFwLWxvY3MiLCJhIjoiY2x6bWx5ZjViMGczbTJqcHhqYmwydzF6ZSJ9.4B65REMkTCJh3bFYcaJD1A";

  //////////////////////////////////////////////////////////////
  /////////////////// INITIALIZE MAPBOX MAP ////////////////////

  // Initialize the Mapbox map within the element with id 'map'
  const map = new mapboxgl.Map({
    container: "map", // The id of the HTML element to initialize the map in
    style: "mapbox://styles/kt-map-locs/clzmr5xfi007601pca3wr990i", // The Mapbox style to use
    center: [-80.92897423261904, 26.214125442030234], // Initial center coordinates [longitude, latitude]
    zoom: 8, // Initial zoom level
  });

  // Adjust the zoom level of the map based on the screen size
  let mq = window.matchMedia("(max-width: 767px)");
  if (mq.matches) {
    map.setZoom(7); // Set map zoom level for mobile size
  }

  //////////////////////////////////////////////////////////////
  /////////// SORT LIST BASED ON CITY NAME USING ATTRIBUTE /////

  //NOTE: THIS IS A FALL BACK. YOU CAN COMMENT OUT IF YOU DO THE FOLLOWING: IF you use Webflow to sort, you have to sort both the sidebar list and the card list. If you sort one by city name A-Z and not the other, the correct data-attribute that correlates the two lists will not be added and there will be a mismatch.

  // Sort the NodeList of location items based on the 'location-name-sidebar' attribute
  const sortedLocations = Array.from(locationItemSidebar).sort((a, b) => {
    const nameA = a
      .querySelector("[location-name-sidebar]")
      .textContent.trim()
      .toUpperCase();
    const nameB = b
      .querySelector("[location-name-sidebar]")
      .textContent.trim()
      .toUpperCase();
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });

  // Select the parent element with the attribute location-list-sidebar and remove all existing children
  const parentElement = document.querySelector("[location-list-sidebar]");
  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }

  // Reorder the HTML elements based on the sorted order
  sortedLocations.forEach((location) => {
    parentElement.appendChild(location); // This moves the element to the end of the parent, effectively reordering them
  });

  //////////////////////////////////////////////////////////////
  /////////////////// CREATE GEOJSON DATA //////////////////////

  // Create an empty GeoJSON object to store location data
  let stores = {
    type: "FeatureCollection",
    features: [],
  };

  // Get the list of location elements from the HTML and convert each to GeoJSON
  const listLocations = locationItemSidebar;

  // Function to convert each location element into GeoJSON and add to stores object
  const getGeoData = function () {
    // Loop through each location in the list
    listLocations.forEach(function (location) {
      // Get the latitude from the element and trim any whitespace
      const locationLat = location
        .querySelector("[location-latitude-sidebar]")
        .textContent.trim();

      // Get the longitude from the element and trim any whitespace
      const locationLong = location
        .querySelector("[location-longitude-sidebar]")
        .textContent.trim();

      // Create coordinates array from longitude and latitude using parseFloat to convert strings to numbers
      const coordinates = [parseFloat(locationLong), parseFloat(locationLat)];

      // Get the location ID from the element (using the location name)
      const locationID = location.querySelector(
        "[location-name-sidebar]"
      ).textContent;

      // Get the location info for popup content on the map (using the location name)
      const locationCity = location.querySelector(
        "[location-name-sidebar]"
      ).textContent;

      // Create a GeoJSON feature for the location using the gathered information
      const geoData = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        properties: {
          id: locationID,
          city: locationCity, // information used in the popup on the map
        },
      };

      // Add the feature to the stores object if it's not already included
      if (!stores.features.includes(geoData)) {
        stores.features.push(geoData);
      }

      // Set the data-id attribute on the location element for later reference in sidebar click events
      location.setAttribute("data-id", locationID);
    });

    // Log the stores object to the console for debugging
    console.log(stores);
  };

  // Call getGeoData function to turn Webflow CMS items into GeoJSON Data for Mapbox to use
  getGeoData();

  // Set data-id attribute for each map card item based on the corresponding location ID
  locationMapCardItem.forEach((el, i) => {
    // Get the location ID from the corresponding location in the list
    const locationID = listLocations[i]
      .querySelector("[location-name-sidebar]") // Find the element with location name
      .textContent.trim(); // Get the text content and trim any whitespace

    // Set the data-id attribute on the map card item using the location ID
    el.setAttribute("data-id", locationID);
  });

  //////////////////////////////////////////////////////////////
  ///////////////// RENDER LOCATIONS LAYER ON THE MAP //////////

  // Function to add the GeoJSON data as a layer to the map
  /*const addMapPoints = function () {
    map.addLayer({
      id: "locations", // Layer id
      type: "circle", // Layer type (circle for point features)
      source: {
        type: "geojson", // Source type
        data: stores, // Uses GeoJSON data from the stores object
      },
      paint: {
        "circle-radius": 8, // Circle radius
        "circle-stroke-width": 1, // Circle stroke width
        "circle-color": "#EB2D2E", // Circle fill color
        "circle-opacity": 1, // Circle opacity
        "circle-stroke-color": "#CB1F10", // Circle stroke color
      },
    });
  };*/

  //////////////////////////////////////////////////////////////
  ///////////////// ADD MARKERS ON THE MAP //////////

  const addMarkersToMap = function () {
    // Create an array to store marker references
    const markersArray = [];

    stores.features.forEach((feature) => {
      // Create marker element
      const markerEl = document.createElement("div");
      markerEl.className = "location-marker";
      markerEl.innerHTML = `
      <svg width="150" height="151" viewBox="0 0 101 102" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M84.7945 37.1377C84.7945 44.3863 82.4649 52.4753 78.5469 57.938L51.4383 98.5934L24.3296 57.938C20.4117 52.4753 18.082 44.2813 18.082 37.1377C18.082 18.8586 33.013 4.04614 51.4383 4.04614C69.8636 4.04614 84.7945 18.8586 84.7945 37.1377Z" fill="#1FD6B0"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M24 37.6097C24 22.4563 36.2837 10.1721 51.4365 10.1721C66.5892 10.1721 78.8729 22.4563 78.8729 37.6097C78.8729 52.7631 66.5892 65.0474 51.4365 65.0474C36.2837 65.0474 24 52.7631 24 37.6097Z" fill="white"/>
<path d="M67.1632 38.4651L64.6422 34.1363L63.2852 36.0244L65.8382 40.3086L67.1632 38.4651Z" fill="#1FD6B0"/>
<path d="M67.9019 27.1154C67.7125 26.7899 67.403 26.5825 67.0678 26.5561C66.7328 26.5301 66.4113 26.6877 66.2015 26.9817L52.8906 45.697H55.6363L66.9611 29.817L69.874 34.6944L71.2428 32.7899L67.9019 27.1154Z" fill="#6F6F6F"/>
<path d="M55.0214 18.1678C54.832 17.8423 54.5225 17.6349 54.1873 17.6085C53.8523 17.5824 53.5308 17.74 53.321 18.034L29.5234 51.4939H32.2409L54.0806 20.8693L61.2679 32.9043L62.6035 31.046L55.0214 18.1678Z" fill="#414142"/>
</svg>
    `;

      // Add click handler to marker element
      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent any default behavior

        const locationID = feature.properties.id;
        /*const mockEvent = {
          features: [
            {
              geometry: { coordinates: feature.geometry.coordinates },
              properties: { city: feature.properties.city },
            },
          ],
          lngLat: {
            lng: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
          },
        };

        // Call the same functions as the original layer click
        addPopup(mockEvent);*/
        updateActiveLocation(locationID);
        showMapCard(locationID);
        zoomToLocation(map, feature.geometry.coordinates);
      });

      // Add hover effects
      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.cursor = "pointer";
      });

      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.cursor = "";
      });

      // Create the marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);

      // Store marker reference with location data
      markersArray.push({
        marker: marker,
        element: markerEl,
        locationId: feature.properties.id,
        coordinates: feature.geometry.coordinates,
        city: feature.properties.city,
      });
    });

    return markersArray;
  };

  /////////////////////////////////////////////////////////////////////////////
  /////// Helper function to calculate distances and update the DOM //////////

  const calculateDistancesAndUpdateDOM = (referencePoint) => {
    const options = { units: "miles" }; // Set the units for distance calculation to miles

    // Loop through each location in the list
    listLocations.forEach((location) => {
      // Get the latitude from the element and trim any whitespace
      const locationLat = location
        .querySelector("[location-latitude-sidebar]")
        .textContent.trim();

      // Get the longitude from the element and trim any whitespace
      const locationLong = location
        .querySelector("[location-longitude-sidebar]")
        .textContent.trim();

      // Create coordinates array from longitude and latitude using parseFloat to convert strings to numbers
      const coordinates = [parseFloat(locationLong), parseFloat(locationLat)];

      // Create a GeoJSON feature for the location using the gathered coordinates
      const locationGeoJSON = {
        type: "Point",
        coordinates: coordinates,
      };

      // Calculate the distance between the reference point and the location
      const distance = turf.distance(referencePoint, locationGeoJSON, options);
      // Store the calculated distance as a data attribute on the location element
      location.setAttribute("data-distance", distance);

      // Find or create a distance element to display the distance
      let distanceElement = location.querySelector(
        "[location-distance-sidebar]"
      );
      if (!distanceElement) {
        distanceElement = document.createElement("div"); // Create a new div element if it doesn't exist
        distanceElement.className = "location-distance_sidebar"; // Set the class name of the div
        location.appendChild(distanceElement); // Append the div to the location element
      }
      // Set the text content of the div to the calculated distance in miles
      distanceElement.textContent = `${distance.toFixed(2)} miles`;
    });

    // Sort the locations based on the distance attribute
    const sortedLocations = Array.from(listLocations).sort((a, b) => {
      return (
        parseFloat(a.getAttribute("data-distance")) -
        parseFloat(b.getAttribute("data-distance"))
      );
    });

    // Select the parent element with the attribute location-list-sidebar and remove all existing children
    const parentElement = document.querySelector("[location-list-sidebar]");
    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }

    // Reorder the HTML elements based on the sorted order
    sortedLocations.forEach((location) => {
      parentElement.appendChild(location); // Append the location to the parent element
    });

    // Return the sorted locations
    return sortedLocations;
  };

  /////////////////////////////////////////////////////////////////////////////////////
  /////// Helper function to highlight the closest location and add a popup //////////

  const highlightClosestLocationAndAddPopup = (sortedLocations) => {
    // Get the closest location from the sorted list (first element)
    const closestLocation = sortedLocations[0];

    // Check if there is a closest location
    if (closestLocation) {
      // Add the 'is--active' class to highlight the closest location
      closestLocation.classList.add("is--active");

      // Get the ID of the closest location from the data-id attribute
      const ID = closestLocation.getAttribute("data-id");

      // Find the feature in the GeoJSON data that matches the closest location ID
      const feature = stores.features.find(
        (feature) => feature.properties.id === ID
      );

      // Check if the feature is found
      if (feature) {
        // Extract the coordinates and city of the feature
        const coordinates = feature.geometry.coordinates;
        const city = feature.properties.city;

        // Create a mock event object to pass to the addPopup function
        /*const mockEvent = {
          features: [
            {
              geometry: { coordinates: coordinates },
              properties: { city: city },
            },
          ],
          lngLat: { lng: coordinates[0], lat: coordinates[1] }, // Set the lngLat property of the mock event
        };

        // Add the popup to the map at the closest location
        addPopup(mockEvent);*/

        // Update the active location in the sidebar to highlight it
        updateActiveLocation(ID);

        // Show the detailed map card for the closest location
        showMapCard(ID);

        // Zoom in to the closest location on the map
        zoomToLocation(map, coordinates);
      } else {
        // Log an error message if the feature is not found in the GeoJSON data
        console.error(`Feature with ID ${ID} not found.`);
      }
    }
  };

  // Event listener for when the map is loaded
  map.on("load", function () {
    // Add map points after map loads
    //addMapPoints();
    markers = addMarkersToMap();

    //////////////////////////////////////////////////////////////
    ///////////////// MAP GEOCODER FUNCTIONALITY (SEARCH) //////////

    // Initialize the Mapbox Geocoder for search functionality
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken, // Set the access token for Mapbox
      mapboxgl: mapboxgl, // Reference to the Mapbox GL JS library
      placeholder: "Type your address", // Set the placeholder text for the search box
      bbox: [-87.983923, 24.297353, -78.909216, 31.128493], // Limit the autocomplete to this bounding box. Used this website: http://bboxfinder.com
    });

    // Add the geocoder control to the map
    map.addControl(geocoder);

    // Add zoom and rotation controls to the map
    map.addControl(new mapboxgl.NavigationControl());

    // Event listener that fires when a search result occurs
    geocoder.on("result", (event) => {
      // Extract the geometry of the search result (coordinates)
      const searchResult = event.result.geometry;

      // Calculate distances from the search result to each location and update the DOM
      // This function returns the sorted list of locations based on their distance to the search result
      const sortedLocations = calculateDistancesAndUpdateDOM(searchResult);

      // Highlight the closest location from the sorted list and add a popup
      highlightClosestLocationAndAddPopup(sortedLocations);
    });

    //////////////////////////////////////////////////////////////
    //////// MAP GEOLOCATE FUNCTIONALITY (CURRENT POSITION) /////

    // Initialize the GeolocateControl, which provides a button that when clicked
    // uses the browser's geolocation API to locate the user on the map
    // Initialize the Mapbox GeolocateControl for tracking user's location
    const geolocate = new mapboxgl.GeolocateControl({
      // Configuration options for geolocation
      positionOptions: {
        enableHighAccuracy: true, // Enable high accuracy for geolocation
      },
      trackUserLocation: false, // Do not continuously track user's location
      showUserHeading: true, // Show the direction the user is facing
    });

    // Add the geolocate control to the map
    map.addControl(geolocate);

    // Event listener that fires when a geolocation event occurs (i.e., when the user's location is found)
    geolocate.on("geolocate", (event) => {
      // Log to the console that a geolocation event has occurred
      console.log("A geolocate event has occurred.");

      // Extract the user's current coordinates (longitude and latitude) from the event object
      const geolocateResult = [event.coords.longitude, event.coords.latitude];

      // Calculate distances from the user's current location to each listed location and update the DOM
      // This function returns the sorted list of locations based on their distance to the user's current location
      const sortedLocations = calculateDistancesAndUpdateDOM({
        type: "Point", // Specify the GeoJSON type as Point
        coordinates: geolocateResult, // Set the coordinates to the user's current location
      });

      // Highlight the closest location from the sorted list and add a popup
      highlightClosestLocationAndAddPopup(sortedLocations);
    });
  });

  //////////////////////////////////////////////////////////////
  ///////////// OPTIONS FOR THE MAP ////////////////////////////

  // Popup options
  const popupOptions = {
    closeOnClick: false,
  };

  //////////////////////////////////////////////////////////////
  ///////////// FUNCTIONS BASED ON CLICK EVENTS ////////////////

  // Function to close the detailed map card when the close button is clicked
  const locationMapCardClose = function () {
    // Remove the 'is--show' class from the map card wrapper to hide it
    locationMapCardWrapper.classList.remove("is--show");

    // Iterate over each map card item
    locationMapCardItem.forEach((el) => {
      // Remove the 'is--show' class from each map card item to ensure none of them are visible
      el.classList.remove("is--show");
    });
  };

  // Function to add a popup to the dot on the map. Event properties are passed from click event
  /*const addPopup = function (e) {
    // Extract the coordinates of the clicked feature and create a copy of the coordinates array
    const coordinates = e.features[0].geometry.coordinates.slice();

    // Extract the city of the clicked feature for the popup content
    const city = e.features[0].properties.city;

    // Adjust coordinates if the map is zoomed out and the popup appears on a different copy of the feature
    // This ensures the popup appears on the correct side of the map
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Check if there is already a popup on the map and if so, remove it to avoid multiple popups
    if (popUps[0]) popUps[0].remove();

    // Create and display the popup at the coordinates with the city
    const popup = new mapboxgl.Popup(popupOptions)
      .setLngLat(coordinates) // Set the longitude and latitude for the popup
      .setHTML(city) // Set the HTML content of the popup
      .addTo(map); // Add the popup to the map

    // Add event listener to close card items when popup is closed
    popup.on("close", () => {
      locationMapCardClose(); // Close the detailed map card
      console.log("popup was closed"); // Log that the popup was closed
    });
  };*/

  // Function to update the active item in the sidebar by adding the 'is--active' class
  const updateActiveLocation = function (locationID) {
    // Remove the 'is--active' class from all sidebar location items
    locationItemSidebar.forEach((el) => el.classList.remove("is--active"));

    // Loop through each sidebar location item to find the one with the matching locationID
    locationItemSidebar.forEach((el) => {
      // Check if the current item's data-id attribute matches the provided locationID
      if (el.getAttribute("data-id") === locationID) {
        // Add the 'is--active' class to the matching item
        el.classList.add("is--active");
      }
    });
  };

  // Function to show the detailed map card for a specific location
  const showMapCard = function (locationID) {
    console.log(`Showing map card for location ID: ${locationID}`);

    // Add the 'is--show' class to the map card wrapper to display it
    locationMapCardWrapper.classList.add("is--show");

    // Loop through each map card item and remove the 'is--show' class
    locationMapCardItem.forEach((el) => {
      el.classList.remove("is--show");
      /*console.log(
        `Removed 'is--show' class from card with data-id: ${el.getAttribute(
          "data-id"
        )}`
      );*/
    });

    // Loop through each map card item to find the one with the matching locationID
    locationMapCardItem.forEach((el) => {
      /* console.log(
        `Checking card with data-id: ${el.getAttribute(
          "data-id"
        )} against locationID: ${locationID}`
      );*/
      // Check if the current item's data-id attribute matches the provided locationID
      if (el.getAttribute("data-id") === locationID) {
        // Add the 'is--show' class to the matching item to display it
        el.classList.add("is--show");
        /*console.log(
          `Added 'is--show' class to card with data-id: ${el.getAttribute(
            "data-id"
          )}`
        );*/
      }
    });
  };

  // Fly to location on the map and zoom in - Adjust properties for different effects
  const zoomToLocation = function (map, coordinates) {
    map.flyTo({
      center: coordinates, // Center the map on the provided coordinates
      zoom: 14, // Set the zoom level to 14 for a closer view
      speed: 1, // Set the animation speed (1 is default, higher is faster)
      curve: 1, // Set the animation curve (1 is default, higher is more curved)
      easing(t) {
        return t; // Set the easing function for the animation (t is the current time)
      },
    });
  };

  //////////////////////////////////////////////////////////////
  //////////////////// EVENT LISTENERS /////////////////////////

  // Listens for clicks on the location layer of the map (dots on the map)
  /*map.on("click", "locations", (e) => {
    // Get the location ID from the clicked feature's properties
    const locationID = e.features[0].properties.id;

    // Log the location ID for debugging purposes
    console.log(
      `This is the location ID: ${locationID} that corresponds to the clicked feature.`
    );

    // Add a popup to the map at the location of the clicked feature
    addPopup(e);

    // Update the active location in the sidebar to highlight the clicked location
    updateActiveLocation(locationID);

    // Show the detailed map card for the clicked location
    showMapCard(locationID);

    // Zoom in to the clicked location on the map
    zoomToLocation(map, e.features[0].geometry.coordinates);
  });

  // Changes cursor style when cursor moves onto the map layer "locations" (REMEMBER: Locations has the dots so when you hover over a dot, the cursor changes)
  map.on("mouseenter", "locations", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Reverses cursor style when cursor moves off the map layer "locations" (REMEMBER: Locations has the dots so when you hover off a dot, the cursor changes)
  map.on("mouseleave", "locations", () => {
    map.getCanvas().style.cursor = "";
  });*/

  // Add Event Listener that closes the detailed card when the close button is clicked on the detailed card
  locationMapCardCloseBtn.forEach((btn) => {
    btn.addEventListener("click", () => {
      locationMapCardClose();
    });
  });

  // Add event listeners to the sidebar location items
  locationItemSidebar.forEach((location) => {
    // Add a click event listener to each sidebar location item
    location.addEventListener("click", (e) => {
      // Get the location ID from the data-id attribute of the clicked sidebar item
      const locationID = e.currentTarget.getAttribute("data-id");

      // Log the location ID for debugging purposes
      console.log(
        `This is the locationID: ${locationID} that corresponds to the clicked feature.`
      );

      // Check if the screen width is 767px or below (mobile view)
      if (window.innerWidth <= 767) {
        // Scroll to the section with ID 'section-map' to ensure the map is visible on mobile view
        document.getElementById("section-map").scrollIntoView({
          behavior: "smooth",
        });
      }

      // Find the feature in the GeoJSON data that matches the location ID
      const feature = stores.features.find(
        (feature) => feature.properties.id === locationID
      );

      // If the feature is found in the GeoJSON data
      if (feature) {
        // Get the coordinates and city of the feature
        const coordinates = feature.geometry.coordinates;
        const city = feature.properties.city;

        // Create a mock event object to pass to the addPopup function
        const mockEvent = {
          features: [
            {
              geometry: { coordinates: coordinates },
              properties: { city: city },
            },
          ],
          lngLat: { lng: coordinates[0], lat: coordinates[1] },
        };

        // Add a popup at the feature's location
        //addPopup(mockEvent);

        // Update the active location in the sidebar
        updateActiveLocation(locationID);

        // Show the corresponding map card
        showMapCard(locationID);

        // Zoom to the feature's location on the map
        zoomToLocation(map, coordinates);
      } else {
        // Log an error message if the feature is not found in the GeoJSON data
        console.error(`Feature with ID ${locationID} not found.`);
      }
    });
  });
});

/*code to add into webflow project
<script src="http://localhost:1234/app.js"></script>
*/
