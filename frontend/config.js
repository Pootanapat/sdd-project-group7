/**
 * config.js — ตั้งค่า Backend URL สำหรับ Production (Render)
 *
 * วิธีใช้:
 * 1. เปลี่ยน RENDER_BACKEND_URL เป็น URL จริงของ Render backend ของคุณ
 *    เช่น: https://sdd-group7-backend.onrender.com
 * 2. ทุก HTML ที่ import <script src="config.js"> จะใช้ window.API_BASE_URL อัตโนมัติ
 */

(function () {
  // ✏️ เปลี่ยนเป็น URL จริงจาก Render Dashboard หลัง Deploy
  const RENDER_BACKEND_URL = 'https://YOUR-RENDER-APP.onrender.com';

  // ตรวจสอบว่ากำลังรันใน localhost หรือไม่
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  window.API_BASE_URL = isLocalhost
    ? 'http://localhost:3000'
    : RENDER_BACKEND_URL;

  console.log('[Config] API Base URL:', window.API_BASE_URL);
})();
