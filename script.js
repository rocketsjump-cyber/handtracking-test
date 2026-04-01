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

// --- ส่วนที่ 4: การเปิดใช้งานกล้อง ---
// --- ส่วนที่ 4: การจัดการกล้องและการสลับกล้อง ---
let currentFacingMode = "user"; // เริ่มต้นที่กล้องหน้า

// ฟังก์ชันสำหรับสร้างและเริ่มกล้อง
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

// เริ่มรันกล้องครั้งแรก
let activeCamera = startNewCamera(currentFacingMode);

// ตั้งค่าปุ่มสลับกล้อง
const switchBtn = document.getElementById("switch-camera-btn");
switchBtn.addEventListener("click", () => {
  // สลับโหมด
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";

  // สั่งหยุดกล้องตัวเดิมก่อน
  activeCamera.stop();

  // จัดการเรื่องการ Mirror (กลับด้าน) ภาพ
  if (currentFacingMode === "environment") {
    videoElement.style.transform = "scaleX(1)"; // กล้องหลังไม่ต้องกลับด้าน
    canvasElement.style.transform = "scaleX(1)";
  } else {
    videoElement.style.transform = "scaleX(-1)"; // กล้องหน้ากลับด้านเหมือนกระจก
    canvasElement.style.transform = "scaleX(-1)";
  }

  // เริ่มกล้องใหม่ในโหมดที่เลือก
  activeCamera = startNewCamera(currentFacingMode);

  console.log("สลับไปใช้โหมด: " + currentFacingMode);
});
