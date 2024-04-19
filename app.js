document.addEventListener('DOMContentLoaded', function() {
    const videoElement = document.getElementById('videoElement');

    // Get access to the camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function(stream) {
            videoElement.srcObject = stream;
        })
        .catch(function(err) {
            console.error('Error accessing the camera: ', err);
        });
});
