window.onload = function() {
    requestGPS();
    startTimer();
};

let componentRegistered = false;
let startTime;
let intervalId;
let timerStopped = false;
let randomizePosition = false;
let initialCoords;

function requestGPS() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            function(position) {
                if (!componentRegistered) {
                    initialCoords = position.coords;
                    initARScene(position.coords);
                }
            },
            function(error) {
                handleGPSError(error);
            },
            { enableHighAccuracy: true, maximumAge: 500, timeout: 5000 }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function handleGPSError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert('GPS permission is required to use this application.');
            break;
        case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable. Please ensure your GPS is enabled.');
            break;
        case error.TIMEOUT:
            alert('The request to get user location timed out. Retrying...');
            setTimeout(requestGPS, 5000);
            break;
        default:
            alert('An unknown error occurred. Please try again.');
            break;
    }
}

function startTimer() {
    startTime = Date.now();
    intervalId = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (timerStopped) return;

    let currentTime = Date.now();
    let elapsedTime = currentTime - startTime;
    let seconds = Math.floor(elapsedTime / 1000) % 60;
    let minutes = Math.floor(elapsedTime / 60000);
    let debugInfo = document.getElementById('debug-info').innerHTML;
    let timeInfo = `Time: ${minutes}m ${seconds}s`;
    if (debugInfo.includes('|')) {
        document.getElementById('debug-info').innerHTML = `${debugInfo.split('|')[0]} | ${timeInfo}`;
    } else {
        document.getElementById('debug-info').innerHTML += ` | ${timeInfo}`;
    }
}

function showEndScreen() {
    timerStopped = true;
    clearInterval(intervalId);
    let currentTime = Date.now();
    let elapsedTime = currentTime - startTime;
    let seconds = Math.floor(elapsedTime / 1000) % 60;
    let minutes = Math.floor(elapsedTime / 60000);
    document.getElementById('time-taken').innerText = `${minutes} minutes and ${seconds} seconds`;
    document.getElementById('end-screen').style.display = 'block';
    document.getElementById('debug-info').innerHTML = `Distance: 0 meters | Time: ${minutes}m ${seconds}s`;
}

function initARScene(coords) {
    let targetCoords = { latitude: 48.2684159, longitude: 14.2491783 };

    if (randomizePosition) {
        targetCoords = getRandomCoordinates(coords.latitude, coords.longitude, 500);
    }

    if (!componentRegistered) {
        AFRAME.registerComponent('check-distance', {
            tick: function() {
                var boxEntity = document.querySelector('#info-box');
                var debugInfo = document.querySelector('#debug-info');

                var cameraPosition = this.el.components['gps-camera'].currentCoords;
                var entityPosition = boxEntity.components['gps-entity-place'].attrValue;

                if (cameraPosition && entityPosition) {
                    var distance = calculateDistance(cameraPosition.latitude, cameraPosition.longitude, entityPosition.latitude, entityPosition.longitude);
                    let timeInfo = debugInfo.innerHTML.includes('|') ? debugInfo.innerHTML.split('|')[1].trim() : 'Time: calculating...';
                    debugInfo.innerHTML = `Distance: ${distance.toFixed(2)} meters | ${timeInfo}`;

                    if (distance <= 5 && !timerStopped) {
                        showEndScreen();
                    }

                    boxEntity.setAttribute('visible', true);
                } else {
                    let timeInfo = debugInfo.innerHTML.includes('|') ? debugInfo.innerHTML.split('|')[1].trim() : 'Time: calculating...';
                    debugInfo.innerHTML = `Distance: calculating... | ${timeInfo}`;
                }
            }
        });
        componentRegistered = true;
    }
//Haversine Formel
    function calculateDistance(lat1, lon1, lat2, lon2) {
        var R = 6371e3; // radius earth in meter
        var φ1 = lat1 * Math.PI / 180; // latitude in radiant
        var φ2 = lat2 * Math.PI / 180; // longitude in radiant
        var Δφ = (lat2 - lat1) * Math.PI / 180;//delta
        var Δλ = (lon2 - lon1) * Math.PI / 180;

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + //quadratische Abweichung
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        var d = R * c;
        return d;
    }

    function getRandomCoordinates(lat, lon, radius) {
        var y0 = lat;
        var x0 = lon;
        var rd = radius / 111300; // about 111300 meters in one degree

        var u = Math.random();
        var v = Math.random();

        var w = rd * Math.sqrt(u);
        var t = 2 * Math.PI * v;
        var x = w * Math.cos(t);
        var y = w * Math.sin(t);

        var newLat = y + y0;
        var newLon = x + x0;
        return { latitude: newLat, longitude: newLon };
    }

    var scene = document.querySelector('a-scene');
    var camera = document.createElement('a-camera');
    camera.setAttribute('gps-camera', 'gpsMinDistance: 0; maxDistance: 10000');
    camera.setAttribute('rotation-reader', '');
    camera.setAttribute('check-distance', '');
    scene.appendChild(camera);

    var boxEntity = document.querySelector('#info-box');
    boxEntity.setAttribute('gps-entity-place', `latitude: ${targetCoords.latitude}; longitude: ${targetCoords.longitude};`);
}
