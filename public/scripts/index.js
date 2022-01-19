const loginElement = document.querySelector('#login-form');
const contentElement = document.querySelector("#content-sign-in");
const userDetailsElement = document.querySelector('#user-details');
const authBarElement = document.querySelector("#authentication-bar");
const locationElement = document.querySelector("#location");

let lonValue = firebase.database().ref("lonValue");
let latValue = firebase.database().ref("latValue");

let tempOutPath = firebase.database().ref("tempOut");
let humOutPath = firebase.database().ref("humOut");
let locationPath = firebase.database().ref("location");

// Elements for website updates
const tempElement = document.getElementById("temp");
const humElement = document.getElementById("hum");
const comfElement = document.getElementById("comf");
const tempOutElement = document.getElementById("tempOut");
const humOutElement = document.getElementById("humOut");
const locElement = document.getElementById("loc");

// Location Variables
var checkLocation = 0;
var lon;
var lat;
var currLocation;
var saveAllowed = null;
//var lonCurr;
//var latCurr;

// Comfort index data
var comfortIndex;
var tempCurr;
var humCurr;

// MANAGE LOGIN/LOGOUT UI
const setupUI = (user) => {
  if (user) {
    loginElement.style.display = 'none';
    /*if (!checkLocation) {
      locationElement.style.display = 'block';
    }*/
    console.log(localStorage.getItem('saveKey'));
    if (localStorage.getItem('saveKey') == '1') {
      //if (checkLocation) {
      //toggle UI elements
      locationElement.style.display = 'none';
      contentElement.style.display = 'block';
      authBarElement.style.display = 'block';
      userDetailsElement.style.display = 'block';
      userDetailsElement.innerHTML = user.email;

      // get user UID to get data from database
      var uid = user.uid;
      console.log(uid);

      // Database paths (with user UID)
      var dbPathTemp = 'UsersData/' + uid.toString() + '/temperature' + '/';
      var dbPathHum = 'UsersData/' + uid.toString() + '/humidity' + '/';

      // Database references
      var dbRefTemp = firebase.database().ref().child(dbPathTemp);
      var dbRefHum = firebase.database().ref().child(dbPathHum);

      // Update page with new readings
      dbRefTemp.on('value', snap => {
        tempElement.innerText = snap.val().toFixed(1);
        tempCurr = snap.val().toFixed(1);
      });

      dbRefHum.on('value', snap => {
        humElement.innerText = snap.val().toFixed(2);
        humCurr = snap.val().toFixed(2);
      });
      //}

      //comfort level
      setTimeout('getComfort(tempCurr, humCurr)', 3000);
      setInterval('getComfort(tempCurr, humCurr)', 20000);

      //save current location to database
      navigator.geolocation.getCurrentPosition((position) => {
        checkLocation = 1, lon = position.coords.longitude;
        lat = position.coords.latitude;
        lonValue.set({
          lon: lon,
        });
        latValue.set({
          lat: lat,
        })
        getWeather(lat, lon);
        setInterval('getWeather(lat, lon)', 300000);
      });

      /*var position;
      var lon = position.coords.longitude;
      var lat = position.coords.latitude;
      lonValue.set({
        lon: lon,
      });
      latValue.set({
        lat: lat,
      });*/

    }
    else {
      locationElement.style.display = 'block';
      document.getElementById("location-button").onclick = function () {
        navigator.geolocation.getCurrentPosition((position) => {
          checkLocation = 1, lon = position.coords.longitude;
          lat = position.coords.latitude;
          lonValue.set({
            lon: lon,
          });
          latValue.set({
            lat: lat,
          });
          getWeather(lat, lon);
          setInterval('getWeather(lat, lon)', 300000);

        }, () => {
          checkLocation = 0, alert('In order ' +
            'for the website to work you must first allow access to your location. Please reset the website settings.')
        });
        setTimeout(() => {
          if (checkLocation) {
            //toggle UI elements
            locationElement.style.display = 'none';
            contentElement.style.display = 'block';
            authBarElement.style.display = 'block';
            userDetailsElement.style.display = 'block';
            userDetailsElement.innerHTML = user.email;

            // get user UID to get data from database
            var uid = user.uid;
            console.log(uid);

            // Database paths (with user UID)
            var dbPathTemp = 'UsersData/' + uid.toString() + '/temperature' + '/';
            var dbPathHum = 'UsersData/' + uid.toString() + '/humidity' + '/';

            // Database references
            var dbRefTemp = firebase.database().ref().child(dbPathTemp);
            var dbRefHum = firebase.database().ref().child(dbPathHum);

            // Update page with new readings
            dbRefTemp.on('value', snap => {
              tempElement.innerText = snap.val().toFixed(1);
              tempCurr = snap.val().toFixed(1);
            });

            dbRefHum.on('value', snap => {
              humElement.innerText = snap.val().toFixed(2);
              humCurr = snap.val().toFixed(2);
            });
            //}

            //comfort level
            setTimeout('getComfort(tempCurr, humCurr)', 3000);
            setInterval('getComfort(tempCurr, humCurr)', 20000);

            //save current location to database
            /*var position;
            var lon = position.coords.longitude;
            var lat = position.coords.latitude;
            lonValue.set({
              lon: lon,
            });
            latValue.set({
              lat: lat,
            });*/

            //save location access status
            saveAllowed = checkLocation;
            localStorage.setItem('saveKey', saveAllowed);
          }
        }, 1150);
      };
    }
    // if user is logged out
  } else {
    // toggle UI elements
    loginElement.style.display = 'block';
    authBarElement.style.display = 'none';
    userDetailsElement.style.display = 'none';
    contentElement.style.display = 'none';
  }
}

function getWeather(lat, lon) {
  var key = '6dc744ae07bf210fb2a5b48548b94109';

  fetch('https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&appid=' + key)
    .then(function (resp) { return resp.json() }) // Convert data to json
    .then(function (data) {
      saveWeather(data);
    })
    .catch(function () {
      // catch any errors
    });
}

//save weather data to database and update data on website
function saveWeather(data) {
  var tempOut = (parseFloat(data.main.temp) - 273.15).toFixed(1);
  var humOut = parseFloat(data.main.humidity).toFixed(2);
  var currLocation = data.name;

  //tempOutElement.innerHTML = tempOut;
  //humOutElement.innerHTML = humOut;
  //locElement.innerHTML = currLocation;

  //save data to database
  tempOutPath.set({
    tempOut: tempOut,
  });;
  humOutPath.set({
    humOut: humOut,
  });;
  locationPath.set({
    location: currLocation,
  });;

  //update website data
  tempOutPath.on('value', snap => {
    tempOutElement.innerHTML = parseFloat(snap.val().tempOut);
  });
  humOutPath.on('value', snap => {
    humOutElement.innerHTML = parseFloat(snap.val().humOut);
  });
  locationPath.on('value', snap => {
    locElement.innerHTML = snap.val().location;
  });
}

//get comfort index
function getComfort(temp, hum) {
  comfortIndex = (temp * 1.8 + 32) - (0.55 - 0.0055 * hum) * ((temp * 1.8 + 32) - 58);
  console.log(comfortIndex);
  if (comfortIndex <= 65)
    comfortIndex = 'Comfort';
  else if (comfortIndex > 65 && comfortIndex <= 73)
    comfortIndex = 'Slightly Comfort';
  else if (comfortIndex > 73 && comfortIndex < 80)
    comfortIndex = 'Slightly Discomfort';
  else if (comfortIndex >= 80)
    comfortIndex = 'Discomfort';
  comfElement.innerHTML = comfortIndex;
  console.log(comfortIndex);
}
/*function onSuccess(position) {
  alert('Latitude: ' + position.coords.latitude + '\n' +
    'Longitude: ' + position.coords.longitude + '\n' +
    'Altitude: ' + position.coords.altitude + '\n' +
    'Accuracy: ' + position.coords.accuracy + '\n' +
    'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
    'Heading: ' + position.coords.heading + '\n' +
    'Speed: ' + position.coords.speed + '\n' +
    'Timestamp: ' + position.timestamp + '\n');
  checkLocation = 1;
};

function onError(error) {
  alert('code: ' + error.code + '\n' +
    'message: ' + error.message + '\n');
  checkLocation = 0;
}	*/
