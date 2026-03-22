/* ============================================
   app-firebase.js — เวอร์ชันเชื่อม Firebase จริง
   (แทนที่ app.js เมื่อพร้อม deploy)
   ============================================ */

import { auth, db, storage } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc, setDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref, uploadString, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ════════════════════════════════════════════
   HELPER
════════════════════════════════════════════ */
const EYE_OPEN  = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSE = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;

let currentUID = null;

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3000);
}

function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  const isProfile = pageId === 'page-profile';
  document.getElementById('navbar').classList.toggle('visible', isProfile);
  document.body.classList.toggle('has-navbar', isProfile);
}

// ทำให้ goTo ใช้งานได้จาก onclick ใน HTML
window.goTo = goTo;

async function fillProfile(uid) {
  currentUID = uid;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;
  const data = snap.data();
  document.getElementById('pf-name').value  = data.displayName || data.username || '';
  document.getElementById('pf-phone').value = data.phone || '';
  document.getElementById('pf-email').value = data.email || '';

  const img  = document.getElementById('avatar-img');
  const icon = document.getElementById('avatar-default-icon');
  if (data.avatarURL) {
    img.src = data.avatarURL;
    img.style.display = 'block';
    icon.style.display = 'none';
  } else {
    img.style.display = 'none';
    icon.style.display = '';
  }
}

/* ════════════════════════════════════════════
   EYE TOGGLE
════════════════════════════════════════════ */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp  = document.getElementById(btn.dataset.target);
    const icon = document.getElementById(btn.dataset.icon);
    const shown = inp.type === 'text';
    inp.type = shown ? 'password' : 'text';
    icon.innerHTML = shown ? EYE_OPEN : EYE_CLOSE;
  });
});

document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('input', () => inp.classList.remove('error'));
});

document.getElementById('su-confirm').addEventListener('input', () => {
  const p = document.getElementById('su-pass').value;
  const c = document.getElementById('su-confirm').value;
  const h = document.getElementById('hint-confirm');
  if (!c) { h.textContent = ''; h.className = 'hint'; return; }
  if (p === c) { h.textContent = '✅ รหัสผ่านตรงกัน'; h.className = 'hint ok'; }
  else         { h.textContent = '❌ รหัสผ่านไม่ตรงกัน'; h.className = 'hint err'; }
});

/* ════════════════════════════════════════════
   SIGN IN
════════════════════════════════════════════ */
document.getElementById('si-login-btn').addEventListener('click', async () => {
  const uInp = document.getElementById('si-user');
  const pInp = document.getElementById('si-pass');
  uInp.classList.remove('error');
  pInp.classList.remove('error');

  let err = false;
  if (!uInp.value.trim()) { uInp.classList.add('error'); err = true; }
  if (!pInp.value)        { pInp.classList.add('error'); err = true; }
  if (err) { showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return; }

  try {
    const cred = await signInWithEmailAndPassword(auth, uInp.value.trim(), pInp.value);
    await fillProfile(cred.user.uid);
    showToast('✅ เข้าสู่ระบบสำเร็จ!', 'success');
    setTimeout(() => goTo('page-profile'), 1000);
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

document.getElementById('si-forgot-btn').addEventListener('click', () => {
  goTo('page-forgot');
});

/* ════════════════════════════════════════════
   FORGOT PASSWORD
════════════════════════════════════════════ */
document.getElementById('fp-send-btn').addEventListener('click', async () => {
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
    setTimeout(() => goTo('page-signin'), 2500);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      showToast('❌ ไม่พบ Email นี้ในระบบ', 'error');
    } else {
      showToast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }
});

/* ════════════════════════════════════════════
   SIGN UP
════════════════════════════════════════════ */
document.getElementById('su-submit-btn').addEventListener('click', async () => {
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
    h.textContent = '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    h.className = 'hint err';
    hasErr = true;
  }
  if (!c || p !== c) { cInp.classList.add('error'); hasErr = true; }
  if (hasErr) { showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน', 'error'); return; }

  try {
    // 1. สร้าง account ใน Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, e, p);

    // 2. บันทึกข้อมูล user ลง Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      username:    u,
      email:       e,
      phone:       '',
      displayName: u,
      avatarURL:   '',
      createdAt:   new Date().toISOString()
    });

    showToast('✅ สมัครสมาชิกสำเร็จ!', 'success');
    setTimeout(() => goTo('page-signin'), 2000);
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

/* ════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════ */

// Avatar upload → Firebase Storage
document.getElementById('avatar-file-input').addEventListener('change', async function () {
  const file = this.files[0];
  if (!file || !currentUID) return;

  const reader = new FileReader();
  reader.onload = async e => {
    const img  = document.getElementById('avatar-img');
    const icon = document.getElementById('avatar-default-icon');

    try {
      // อัปโหลดรูปไป Firebase Storage
      const storageRef = ref(storage, `avatars/${currentUID}`);
      await uploadString(storageRef, e.target.result, 'data_url');
      const url = await getDownloadURL(storageRef);

      // อัปเดต URL ลง Firestore
      await updateDoc(doc(db, 'users', currentUID), { avatarURL: url });

      img.src = url;
      img.style.display = 'block';
      icon.style.display = 'none';
      showToast('✅ อัปโหลดรูปโปรไฟล์แล้ว!', 'success');
    } catch (err) {
      showToast('❌ อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  };
  reader.readAsDataURL(file);
});

// Save profile → Firestore
document.getElementById('save-profile-btn').addEventListener('click', async () => {
  const name  = document.getElementById('pf-name').value.trim();
  const phone = document.getElementById('pf-phone').value.trim();

  if (!name) {
    document.getElementById('pf-name').classList.add('error');
    showToast('⚠️ กรุณากรอกชื่อ-นามสกุล', 'error');
    return;
  }

  try {
    await updateDoc(doc(db, 'users', currentUID), {
      displayName: name,
      phone:       phone
    });
    showToast('✅ บันทึกข้อมูลเรียบร้อยแล้ว!', 'success');
  } catch (e) {
    showToast('❌ บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  currentUID = null;
  showToast('👋 ออกจากระบบแล้ว', 'success');
  setTimeout(() => goTo('page-signin'), 1200);
});

// Enter key
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const siActive = document.getElementById('page-signin').classList.contains('active');
  if (siActive) document.getElementById('si-login-btn').click();
  else          document.getElementById('su-submit-btn').click();
});