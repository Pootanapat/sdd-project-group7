/* ============================================
   app-firebase.js — เวอร์ชันเชื่อม Firebase จริง (พร้อมระบบประวัติการจอง)
   ============================================ */

import { auth, db, storage } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🟢 1. เพิ่ม collection, query, where, getDocs สำหรับดึงประวัติการจอง
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref, uploadString, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ════════════════════════════════════════════
   HELPER
════════════════════════════════════════════ */
const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSE = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;

let currentUID = null;

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3000);
}

async function fillProfile(user) {
  currentUID = user.uid;
  const snap = await getDoc(doc(db, 'users', user.uid));

  const data = snap.exists() ? snap.data() : {};

  const pfName = document.getElementById('pf-name');
  const pfPhone = document.getElementById('pf-phone');
  const pfEmail = document.getElementById('pf-email');

  if (pfName) pfName.value = data.displayName || data.username || '';
  if (pfPhone) pfPhone.value = data.phone || '';

  if (pfEmail) pfEmail.value = user.email || data.email || '';

  const img = document.getElementById('avatar-img');
  const icon = document.getElementById('avatar-default-icon');

  if (img && icon) {
    if (data.avatarURL) {
      img.src = data.avatarURL;
      img.style.display = 'block';
      icon.style.display = 'none';
    } else {
      img.style.display = 'none';
      icon.style.display = '';
    }
  }
}

// 🟢 2. ฟังก์ชันโหลดประวัติการจองจาก Firestore (ดึงจากทั้ง bookings และ payments)
async function loadBookingHistory(uid) {
  const historyBox = document.getElementById('history-box');
  if (!historyBox) return;

  const localUser = localStorage.getItem('currentUser');
  const searchUid = uid || localUser || 'anonymous';

  console.log('Loading booking history for user:', searchUid);

  try {
    // ดึงข้อมูลจาก 2 Collection เพื่อความชัวร์ (บางส่วนบันทึกฝั่ง Client, บางส่วนบันทึกผ่าน Backend)
    const q1 = query(collection(db, 'bookings'), where('userId', '==', searchUid));
    const q2 = query(collection(db, 'payments'), where('userId', '==', searchUid));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const allBookings = [];
    snap1.forEach(docSnap => allBookings.push({ id: docSnap.id, ...docSnap.data(), source: 'bookings' }));
    snap2.forEach(docSnap => allBookings.push({ id: docSnap.id, ...docSnap.data(), source: 'payments' }));

    // จัดเรียงตามเวลา (ถ้ามี)
    allBookings.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    console.log('Total bookings found:', allBookings.length);

    if (allBookings.length === 0) {
      historyBox.innerHTML = '<div class="history-empty">ยังไม่มีประวัติการจอง</div>';
      return;
    }

    historyBox.innerHTML = ''; 

    allBookings.forEach((data) => {
      const serviceName = data.serviceName || data.service || 'บริการตัดผม';
      const price = data.price || data.amount || '-';
      const barber = data.barberName || data.barber || '-';
      let dateStr = data.bookingDate || data.reservedDate || '';

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        const d = data.createdAt.toDate();
        dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      }

      const html = `
        <div class="history-item" style="border-bottom: 1px solid #333; padding: 15px 0;">
          <div class="h-name" style="font-weight: bold; color: #ffa200;">${serviceName} (ช่าง: ${barber})</div>
          <div class="h-price" style="font-size: 0.9rem; color: #fff;">ราคา ${price} บาท</div>
          <div class="h-date" style="font-size: 0.8rem; color: #888;">${dateStr ? 'เมื่อ ' + dateStr : ''} [${data.status || 'success'}]</div>
        </div>
      `;
      historyBox.innerHTML += html;
    });

  } catch (error) {
    console.error("Error fetching history details: ", error);
    // แจ้งเตือนเรื่อง Permissions หากพบปัญหา Rule
    if (error.code === 'permission-denied') {
      historyBox.innerHTML = '<div class="history-empty" style="color: #ff6b6b;">กรุณาตั้งค่า Firestore Rules ให้เป็น Public หรืออนุญาต Read/Write ครับ</div>';
    } else {
      historyBox.innerHTML = '<div class="history-empty">เกิดข้อผิดพลาดในการโหลดประวัติ</div>';
    }
  }
}

/* ════════════════════════════════════════════
   เช็คสถานะการล็อกอินอัตโนมัติ 
════════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  // --- Sync Navigation Buttons (Global) ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const navProfile = document.querySelector('.nav-profile, .profile-link');

  if (user) {
    console.log('User authenticated:', user.uid);
    currentUID = user.uid;
    // User is logged in: Hide Sign In/Signup, Show Profile
    navBtns.forEach(btn => {
      if (btn.innerText.toLowerCase().includes('sign')) {
        btn.style.display = 'none';
      }
    });
    if (navProfile) navProfile.style.display = 'flex';

    if (window.location.pathname.includes('profile.html')) {
      await fillProfile(user);
      await loadBookingHistory(user.uid);
      const content = document.getElementById('profile-content');
      if (content) content.style.display = 'block';
    }
  } else {
    console.log('User not authenticated');
    currentUID = null;
    // User is logged out: Show Sign in/Signup, Hide Profile
    navBtns.forEach(btn => {
      if (btn.innerText.toLowerCase().includes('sign')) {
        btn.style.display = 'inline-block';
      }
    });
    if (navProfile) navProfile.style.display = 'none';

    if (window.location.pathname.includes('profile.html')) {
      window.location.replace('Signin.html');
    }
  }
});

/* ════════════════════════════════════════════
   EYE TOGGLE, SIGN IN, FORGOT PASSWORD, SIGN UP
════════════════════════════════════════════ */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById(btn.dataset.target);
    const icon = document.getElementById(btn.dataset.icon);
    if (!inp || !icon) return;
    const shown = inp.type === 'text';
    inp.type = shown ? 'password' : 'text';
    icon.innerHTML = shown ? EYE_OPEN : EYE_CLOSE;
  });
});

document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('input', () => inp.classList.remove('error'));
});

const suConfirmInp = document.getElementById('su-confirm');
if (suConfirmInp) {
  suConfirmInp.addEventListener('input', () => {
    const p = document.getElementById('su-pass').value;
    const c = document.getElementById('su-confirm').value;
    const h = document.getElementById('hint-confirm');
    if (!h) return;
    if (!c) { h.textContent = ''; h.className = 'hint'; return; }
    if (p === c) { h.textContent = '✅ รหัสผ่านตรงกัน'; h.className = 'hint ok'; }
    else { h.textContent = '❌ รหัสผ่านไม่ตรงกัน'; h.className = 'hint err'; }
  });
}

const loginBtn = document.getElementById('si-login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const uInp = document.getElementById('si-user');
    const pInp = document.getElementById('si-pass');
    uInp.classList.remove('error');
    pInp.classList.remove('error');

    let err = false;
    if (!uInp.value.trim()) { uInp.classList.add('error'); err = true; }
    if (!pInp.value) { pInp.classList.add('error'); err = true; }
    if (err) { showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return; }

    try {
      await signInWithEmailAndPassword(auth, uInp.value.trim(), pInp.value);
      showToast('✅ เข้าสู่ระบบสำเร็จ!', 'success');
      setTimeout(() => window.location.href = 'profile.html', 1000);
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-email') {
        uInp.classList.add('error');
        showToast('❌ ไม่พบบัญชีนี้ในระบบ กรุณาใช้ Email ที่สมัครไว้', 'error');
      } else if (e.code === 'auth/wrong-password') {
        pInp.classList.add('error');
        showToast('❌ รหัสผ่านไม่ถูกต้อง', 'error');
      } else if (e.code === 'auth/too-many-requests') {
        showToast('❌ ลองใหม่ภายหลัง มีการพยายาม login มากเกินไป', 'error');
      } else {
        showToast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
      }
    }
  });
}

const forgotBtn = document.getElementById('si-forgot-btn');
if (forgotBtn) {
  forgotBtn.addEventListener('click', () => {
    document.getElementById('page-signin').classList.remove('active');
    document.getElementById('page-forgot').classList.add('active');
  });
}

const fpSendBtn = document.getElementById('fp-send-btn');
if (fpSendBtn) {
  fpSendBtn.addEventListener('click', async () => {
    const eInp = document.getElementById('fp-email');
    const e = eInp.value.trim();
    eInp.classList.remove('error');

    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      eInp.classList.add('error');
      showToast('⚠️ กรุณากรอกอีเมลให้ถูกต้อง', 'error');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, e);
      showToast('📧 ส่งลิงก์รีเซ็ตไปที่ ' + e + ' แล้ว!', 'success');
      eInp.value = '';
      setTimeout(() => {
        document.getElementById('page-forgot').classList.remove('active');
        document.getElementById('page-signin').classList.add('active');
      }, 2500);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        showToast('❌ ไม่พบ Email นี้ในระบบ', 'error');
      } else {
        showToast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
      }
    }
  });
}

const submitBtn = document.getElementById('su-submit-btn');
if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    const uInp = document.getElementById('su-user');
    const eInp = document.getElementById('su-email');
    const pInp = document.getElementById('su-pass');
    const cInp = document.getElementById('su-confirm');
    [uInp, eInp, pInp, cInp].forEach(el => el.classList.remove('error'));

    const u = uInp.value.trim();
    const e = eInp.value.trim();
    const p = pInp.value;
    const c = cInp.value;
    let hasErr = false;

    if (!u) { uInp.classList.add('error'); hasErr = true; }
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { eInp.classList.add('error'); hasErr = true; }
    if (p.length < 6) {
      pInp.classList.add('error');
      const h = document.getElementById('hint-pass');
      if (h) {
        h.textContent = '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        h.className = 'hint err';
      }
      hasErr = true;
    }
    if (!c || p !== c) { cInp.classList.add('error'); hasErr = true; }
    if (hasErr) { showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน', 'error'); return; }

    try {
      const cred = await createUserWithEmailAndPassword(auth, e, p);
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: u,
        name: u,
        email: e,
        phone: '',
        displayName: u,
        avatarURL: '',
        createdAt: new Date().toISOString()
      });

      showToast('✅ สมัครสมาชิกสำเร็จ!', 'success');
      setTimeout(() => window.location.href = 'Signin.html', 2000);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        eInp.classList.add('error');
        showToast('❌ Email นี้ถูกใช้แล้ว', 'error');
      } else if (e.code === 'auth/invalid-email') {
        eInp.classList.add('error');
        showToast('❌ รูปแบบ Email ไม่ถูกต้อง', 'error');
      } else if (e.code === 'auth/weak-password') {
        showToast('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
      } else {
        showToast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
      }
    }
  });
}

const avatarInput = document.getElementById('avatar-file-input');
if (avatarInput) {
  avatarInput.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file || !currentUID) return;

    const reader = new FileReader();
    reader.onload = async e => {
      const img = document.getElementById('avatar-img');
      const icon = document.getElementById('avatar-default-icon');

      try {
        const storageRef = ref(storage, `avatars/${currentUID}`);
        await uploadString(storageRef, e.target.result, 'data_url');
        const url = await getDownloadURL(storageRef);

        await updateDoc(doc(db, 'users', currentUID), { avatarURL: url });

        if (img && icon) {
          img.src = url;
          img.style.display = 'block';
          icon.style.display = 'none';
        }
        showToast('✅ อัปโหลดรูปโปรไฟล์แล้ว!', 'success');
      } catch (err) {
        showToast('❌ อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่', 'error');
      }
    };
    reader.readAsDataURL(file);
  });
}

const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    const nameInp = document.getElementById('pf-name');
    const phoneInp = document.getElementById('pf-phone');

    if (!user) {
      showToast('⚠️ กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }

    const name = nameInp.value.trim();
    const phone = phoneInp.value.trim();

    if (!name) {
      nameInp.classList.add('error');
      showToast('⚠️ กรุณากรอกชื่อ-นามสกุล', 'error');
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        phone: phone,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast('✅ บันทึกข้อมูลเรียบร้อยแล้ว!', 'success');
      nameInp.classList.remove('error');
    } catch (e) {
      console.error("Save Error:", e);
      showToast('❌ บันทึกไม่สำเร็จ: ' + e.message, 'error');
    }
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    currentUID = null;
    showToast('👋 ออกจากระบบแล้ว', 'success');
    setTimeout(() => window.location.href = 'Signin.html', 1200);
  });
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const loginPage = document.getElementById('page-signin');
  if (loginBtn && loginPage && loginPage.classList.contains('active')) {
    loginBtn.click();
  } else if (submitBtn && document.getElementById('page-signup')) {
    submitBtn.click();
  }
});