async function loadModels() {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('models');
    await faceapi.nets.ageGenderNet.loadFromUri('models');
    await faceapi.nets.faceExpressionNet.loadFromUri('models');
    
    console.log("Models loaded successfully.");
    document.getElementById('loadingIndicator').style.display = 'none';

    startVideo();
  } catch (error) {
    console.error("Error loading models:", error);
  }
}

function startVideo() {
  const video = document.getElementById('video');
  const warningMessage = document.getElementById('warningMessage');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.classList.remove('hidden');
      warningMessage.classList.add('hidden');
      video.play();
      detectEmotions();
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error);
      warningMessage.classList.remove('hidden');
    });
}

async function detectEmotions() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const emotionResult = document.getElementById('emotionResult');

  video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log("Canvas dimensions set:", canvas.width, canvas.height);
  });

  const getDisplaySize = () => ({
      width: video.videoWidth,
      height: video.videoHeight,
  });

  canvas.classList.remove('hidden');

  setInterval(async () => {
      if (!video.videoWidth || !video.videoHeight) {
          console.warn("Video dimensions are not yet available.");
          return;
      }

      const detections = await faceapi.detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, getDisplaySize());

      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      if (detections[0]?.expressions) {
          const expressions = detections[0].expressions;
          const emotion = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
          emotionResult.innerText = `Detected Emotion: ${emotion[0]} (${Math.round(emotion[1] * 100)}%)`;
      } else {
          emotionResult.innerText = "No face detected.";
      }
  }, 300);
}

window.onload = async () => {
  await loadModels();
};
