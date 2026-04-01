// --- ส่วนที่ 1: การประกาศตัวแปรและการตั้งค่าหน้าจอ ---
const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusElement = document.getElementById("status");

// คำนวณขนาดหน้าจอให้รองรับมือถือ (Responsive)
const width = window.innerWidth < 640 ? window.innerWidth : 640;
const height = (width * 3) / 4; // อัตราส่วน 4:3

canvasElement.width = width;
canvasElement.height = height;

// --- ส่วนที่ 2: การตั้งค่า AI (MediaPipe Hands) ---
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2, // ตรวจจับสูงสุด 2 มือ
  modelComplexity: 1, // 1 = แม่นยำ (ถ้ามือถือช้าให้เปลี่ยนเป็น 0)
  minDetectionConfidence: 0.5, // ความเชื่อมั่นในการหาตำแหน่งมือ
  minTrackingConfidence: 0.5, // ความเชื่อมั่นในการติดตามข้อต่อ
});

// --- ส่วนที่ 3: ฟังก์ชันจัดการผลลัพธ์ (วาดจุดบนหน้าจอ) ---
hands.onResults((results) => {
  statusElement.innerText = "ระบบกำลังทำงาน: ตรวจพบมือแล้ว";

  // ล้าง Canvas และวาดภาพใหม่ทุกเฟรม
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // (เลือกเปิด) วาดภาพวิดีโอจริงลงบน Canvas
  // canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      // วาดเส้นใยเชื่อมข้อนิ้ว (Connectors)
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      // วาดจุดข้อต่อทั้ง 21 จุด (Landmarks)
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

// --- ส่วนที่ 4: การจัดการกล้องและการสลับกล้อง ---
let currentFacingMode = "user";
let activeCamera = null;

// ฟังก์ชันสร้างกล้องใหม่
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

// สั่งรันกล้องครั้งแรกเมื่อโหลดหน้าเว็บ
activeCamera = startNewCamera(currentFacingMode);

// รอให้หน้าเว็บโหลดเสร็จก่อนค่อยเริ่มทำงานกับปุ่ม
window.addEventListener("DOMContentLoaded", () => {
  const switchBtn = document.getElementById("switch-camera-btn");

  if (switchBtn) {
    switchBtn.addEventListener("click", async () => {
      // 1. สลับโหมด
      currentFacingMode = currentFacingMode === "user" ? "environment" : "user";

      // 2. หยุดกล้องตัวเดิม
      if (activeCamera) {
        await activeCamera.stop();
      }

      // 3. ปรับ Mirror (กลับด้าน) ให้เหมาะสม
      // กล้องหน้า (user) = กลับด้าน (-1), กล้องหลัง (environment) = ปกติ (1)
      const scaleValue = currentFacingMode === "user" ? -1 : 1;
      videoElement.style.transform = `scaleX(${scaleValue})`;
      canvasElement.style.transform = `scaleX(${scaleValue})`;

      // 4. เริ่มกล้องใหม่
      activeCamera = startNewCamera(currentFacingMode);

      console.log("Switched to: " + currentFacingMode);
    });
  } else {
    console.error("หาปุ่ม switch-camera-btn ไม่เจอ!");
  }
});
