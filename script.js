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

  let leftHandText = "ไม่พบมือซ้าย";
  let rightHandText = "ไม่พบมือขวา";

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    results.multiHandLandmarks.forEach((landmarks, index) => {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: "#FF0000",
        lineWidth: 2,
        radius: 3,
      });

      const label = results.multiHandedness[index].label;

      const isIndexUp = landmarks[8].y < landmarks[5].y;
      const isMiddleUp = landmarks[12].y < landmarks[9].y;
      const isRingUp = landmarks[16].y < landmarks[13].y;
      const isPinkyUp = landmarks[20].y < landmarks[17].y;
      const pinchDist = getDistance(landmarks[8], landmarks[4]);

      let currentGesture = "";

      if (pinchDist < 0.05) {
        currentGesture = "👌 ท่าจีบ (Pinch)";
      } else if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
        currentGesture = "✋ แบมือ / 4 นิ้ว";
      } else if (isIndexUp && isMiddleUp && isRingUp && !isPinkyUp) {
        currentGesture = "3️⃣ ชู 3 นิ้ว";
      } else if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
        currentGesture = "✌️ ชู 2 นิ้ว (Victory)";
      } else if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        currentGesture = "1️⃣ ชูนิ้วชี้ (Pointing)";
      } else if (!isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
        currentGesture = "🖕 ชูนิ้วกลาง";
      } else if (!isIndexUp && !isMiddleUp && isRingUp && !isPinkyUp) {
        currentGesture = "💍 ชูนิ้วนาง";
      } else if (!isIndexUp && !isMiddleUp && !isRingUp && isPinkyUp) {
        currentGesture = "🤙 ชูนิ้วก้อย";
      } else if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        currentGesture = "✊ กำมือ (Rock)";
      } else {
        currentGesture = "ตรวจพบมือแล้ว";
      }

      if (label === "Left") {
        leftHandText = `L: ${currentGesture}`;
      } else {
        rightHandText = `R: ${currentGesture}`;
      }
    });
  } else {
    leftHandText = "L: ไม่พบมือ";
    rightHandText = "R: ไม่พบมือ";
  }

  document.getElementById("gesture-output").innerHTML =
    `${leftHandText} <br> ${rightHandText}`;

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
