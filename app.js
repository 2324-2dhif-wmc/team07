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
    let targetCoords = { latitude: 48.268231, longitude: 14.252070 };

    if (randomizePosition) {
        targetCoords = getRandomCoordinates(coords.latitude, coords.longitude, 500);
    }

    if (!componentRegistered) {
        AFRAME.registerComponent('check-distance', {
            tick: function() {
                const boxEntity = document.querySelector('#info-box');
                const debugInfo = document.querySelector('#debug-info');

                const cameraPosition = this.el.components['gps-camera'].currentCoords;
                const entityPosition = boxEntity.components['gps-entity-place'].attrValue;

                if (cameraPosition && entityPosition) {
                    const distance = calculateDistance(cameraPosition.latitude, cameraPosition.longitude, entityPosition.latitude, entityPosition.longitude);
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

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // radius earth in meter
        const w1 = lat1 * Math.PI / 180; // latitude in radiant
        const w2 = lat2 * Math.PI / 180; // longitude in radiant
        const dw = (lat2 - lat1) * Math.PI / 180;//delta
        const dl = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dw / 2) * Math.sin(dw / 2) + //quadratische Abweichung
            Math.cos(w1) * Math.cos(w2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    function getRandomCoordinates(lat, lon, radius) {
        const y0 = lat;
        const x0 = lon;
        const rd = radius / 111300; // about 111300 meters in one degree

        const u = Math.random();
        const v = Math.random();

        const w = rd * Math.sqrt(u);
        const t = 2 * Math.PI * v;
        const x = w * Math.cos(t);
        const y = w * Math.sin(t);

        const newLat = y + y0;
        const newLon = x + x0;
        return { latitude: newLat, longitude: newLon };
    }

    const scene = document.querySelector('a-scene');
    const camera = document.createElement('a-camera');
    camera.setAttribute('gps-camera', 'gpsMinDistance: 0; maxDistance: 10000');
    camera.setAttribute('rotation-reader', '');
    camera.setAttribute('check-distance', '');
    scene.appendChild(camera);

    const boxEntity = document.querySelector('#info-box');
    boxEntity.setAttribute('gps-entity-place', `latitude: ${targetCoords.latitude}; longitude: ${targetCoords.longitude};`);
}
