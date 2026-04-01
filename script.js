const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusElement = document.getElementById("status");

const width = window.innerWidth < 640 ? window.innerWidth : 640;
const height = (width * 3) / 4;

canvasElement.width = width;
canvasElement.height = height;

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

hands.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  let gestureText = "กำลังหาตำแหน่งมือ...";

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: "#FF0000",
        lineWidth: 2,
        radius: 3,
      });

      const isIndexUp = landmarks[8].y < landmarks[5].y;
      const isMiddleUp = landmarks[12].y < landmarks[9].y;
      const isRingUp = landmarks[16].y < landmarks[13].y;
      const isPinkyUp = landmarks[20].y < landmarks[17].y;

      const pinchDist = getDistance(landmarks[8], landmarks[4]);

      if (pinchDist < 0.05) {
        gestureText = "👌 ท่าจีบ (Pinch)";
      } else if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
        gestureText = "✋ แบมือ (Paper)";
      } else if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        gestureText = "✊ กำมือ (Rock)";
      } else if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
        gestureText = "✌️ สองนิ้ว (Victory)";
      } else if (isIndexUp) {
        gestureText = "☝️ ชูนิ้วชี้ (Pointing)";
      } else {
        gestureText = "ตรวจพบมือแล้ว";
      }
    }
  }

  statusElement.innerText = "Gesture: " + gestureText;
  canvasCtx.restore();
});

let currentFacingMode = "user";
let activeCamera = null;

function startNewCamera(mode) {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    facingMode: mode,
    width: width,
    height: height,
  });
  camera.start();
  return camera;
}

activeCamera = startNewCamera(currentFacingMode);

window.addEventListener("DOMContentLoaded", () => {
  const switchBtn = document.getElementById("switch-camera-btn");
  if (switchBtn) {
    switchBtn.addEventListener("click", async () => {
      currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
      if (activeCamera) await activeCamera.stop();

      const scaleValue = currentFacingMode === "user" ? -1 : 1;
      videoElement.style.transform = `scaleX(${scaleValue})`;
      canvasElement.style.transform = `scaleX(${scaleValue})`;

      activeCamera = startNewCamera(currentFacingMode);
      console.log("Switched to: " + currentFacingMode);
    });
  }
});
