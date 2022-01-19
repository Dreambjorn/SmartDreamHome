let tempValue = firebase.database().ref("tempPref");
let humValue = firebase.database().ref("humPref");
// Listen for a submit

let timeTemp = 0;
let timeHum = 0;

//var x = document.getElementById("demo");

/*function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  x.innerHTML = "Latitude: " + position.coords.latitude + 
  "<br>Longitude: " + position.coords.longitude;
}*/

document.querySelector(".temp-form").addEventListener("submit", submitTemp);
function submitTemp(e) {
  e.preventDefault();

  const dAuxTemp = new Date();

  //   Get input Values
  let temp = document.querySelector(".tempP").value;
  console.log(temp);
  number = Number(temp);
  if (number < 15 && dAuxTemp.getTime() - timeTemp >= 10000) {
    alert('The value exceeds the range of values that must be set for the temperature (15°C-30°C). Please enter a new value.');
  } else if (number > 30 && dAuxTemp.getTime() - timeTemp >= 10000) {
    alert('The value exceeds the range of values that must be set for the temperature (15°C-30°C). Please enter a new value.');
  }
  else if (dAuxTemp.getTime() - timeTemp >= 10000) {
    saveTemp(temp);
    timeTemp = dAuxTemp.getTime();
  }
  else {
    alert('You cannot enter a new value yet.');
  }

  document.querySelector(".temp-form").reset();
  document.querySelector(".hum-form").reset();
}

document.querySelector(".hum-form").addEventListener("submit", submitHum);
function submitHum(e) {
  e.preventDefault();

  const dAuxHum = new Date();

  //   Get input Values
  let hum = document.querySelector(".humP").value;
  console.log(hum);
  number = Number(hum);

  if (number < 30 && dAuxHum.getTime() - timeHum >= 10000) {
    alert('The value exceeds the range of values that must be set for the temperature (30%-60%). Please enter a new value.');
  } else if (number > 60 && dAuxHum.getTime() - timeHum >= 10000) {
    alert('The value exceeds the range of values that must be set for the temperature (30%-60%). Please enter a new value.');
  }

  else if (dAuxHum.getTime() - timeHum >= 10000) {
    saveHum(hum);
    timeHum = dAuxHum.getTime();
  }
  
  else {
    alert('You cannot enter a new value yet.');
  }

  document.querySelector(".hum-form").reset();
  document.querySelector(".temp-form").reset();
}

// Save infos to Firebase
function saveTemp(temp) {

  tempValue.set({
    temp: temp,
  });
}

function saveHum(hum) {

  humValue.set({
    hum: hum,
  });
}