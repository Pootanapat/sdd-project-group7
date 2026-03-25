/* ============================================
   firebase.js — ตั้งค่าและเชื่อมต่อ Firebase
   ============================================
   วิธีใช้:
   1. ไปที่ https://console.firebase.google.com
   2. สร้าง Project ใหม่
   3. กด "Add app" เลือก Web (</>)
   4. Copy ค่า firebaseConfig มาวางแทนด้านล่าง
   5. เปิด Authentication → Sign-in method → เปิด Email/Password
   6. เปิด Firestore Database → สร้าง Database (test mode)
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ✏️ วางค่าของคุณตรงนี้ (ได้จาก Firebase Console → Project Settings)
const firebaseConfig = {
  apiKey:            "AIzaSyDN5D7azWdf8I8KNmFz_FD-skYq-OOO4w8",
  authDomain:        "sdd-project-group7.firebaseapp.com",
  projectId:         "sdd-project-group7",
  storageBucket:     "sdd-project-group7.firebasestorage.app",
  messagingSenderId: "114308864117",
  appId:             "1:114308864117:web:312d1e8ef18fe7960c803c",
  measurementId:     "G-5YZWKJHVCW"
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);

// Export ส่วนที่ใช้งาน
export const auth    = getAuth(app);       // สำหรับ login / signup
export const db      = getFirestore(app);  // สำหรับเก็บข้อมูล user
export const storage = getStorage(app);    // สำหรับเก็บรูปภาพ
