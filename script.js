const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusElement = document.getElementById("status");

const width = window.innerWidth < 640 ? window.innerWidth : 640;
const height = (width * 3) / 4;

canvasElement.width = width;
canvasElement.height = height;

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
  statusElement.innerText = "ระบบกำลังทำงาน: ตรวจพบมือแล้ว";

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
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
    }
  } else {
    statusElement.innerText = "กำลังหาตำแหน่งมือ...";
  }
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

      if (activeCamera) {
        await activeCamera.stop();
      }

      const scaleValue = currentFacingMode === "user" ? -1 : 1;
      videoElement.style.transform = `scaleX(${scaleValue})`;
      canvasElement.style.transform = `scaleX(${scaleValue})`;

      activeCamera = startNewCamera(currentFacingMode);

      console.log("Switched to: " + currentFacingMode);
    });
  } else {
    console.error("หาปุ่ม switch-camera-btn ไม่เจอ!");
  }
});
