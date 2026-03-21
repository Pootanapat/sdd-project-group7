/* ============================================
   app.js — JavaScript ทั้งหมดของระบบ Auth
   ============================================ */

const EYE_OPEN  = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSE = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;

let currentUser = null;

/* ── fillProfile: โหลดข้อมูล account มาใส่หน้า Profile ── */
function fillProfile(acc) {
  currentUser = acc.username;
  document.getElementById('pf-name').value  = acc.displayName || acc.username;
  document.getElementById('pf-phone').value = acc.phone || '';
  document.getElementById('pf-email').value = acc.email;

  const img  = document.getElementById('avatar-img');
  const icon = document.getElementById('avatar-default-icon');
  if (acc.avatar) {
    img.src = acc.avatar;
    img.style.display = 'block';
    icon.style.display = 'none';
  } else {
    img.style.display = 'none';
    icon.style.display = '';
  }
}

/* ── goTo: สลับหน้า ── */
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  const isProfile = pageId === 'page-profile';
  document.getElementById('navbar').classList.toggle('visible', isProfile);
  document.body.classList.toggle('has-navbar', isProfile);
}

/* ── showToast: แจ้งเตือน ── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3000);
}

/* ── Eye toggle (แสดง/ซ่อนรหัสผ่าน) ── */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp  = document.getElementById(btn.dataset.target);
    const icon = document.getElementById(btn.dataset.icon);
    const shown = inp.type === 'text';
    inp.type = shown ? 'password' : 'text';
    icon.innerHTML = shown ? EYE_OPEN : EYE_CLOSE;
  });
});

/* ── Reset กรอบแดงเมื่อพิมพ์ ── */
document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('input', () => inp.classList.remove('error'));
});

/* ── Live check: password ตรงกันไหม ── */
document.getElementById('su-confirm').addEventListener('input', () => {
  const p = document.getElementById('su-pass').value;
  const c = document.getElementById('su-confirm').value;
  const h = document.getElementById('hint-confirm');
  if (!c) { h.textContent = ''; h.className = 'hint'; return; }
  if (p === c) { h.textContent = '✅ รหัสผ่านตรงกัน'; h.className = 'hint ok'; }
  else         { h.textContent = '❌ รหัสผ่านไม่ตรงกัน'; h.className = 'hint err'; }
});

/* ════════════════ SIGN IN ════════════════ */
document.getElementById('si-login-btn').addEventListener('click', () => {
  const uInp = document.getElementById('si-user');
  const pInp = document.getElementById('si-pass');
  uInp.classList.remove('error');
  pInp.classList.remove('error');

  let err = false;
  if (!uInp.value.trim()) { uInp.classList.add('error'); err = true; }
  if (!pInp.value)        { pInp.classList.add('error'); err = true; }
  if (err) { showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return; }

  // TODO (Firebase): แทนที่ localStorage ด้วย Firebase Auth
  // firebase.auth().signInWithEmailAndPassword(uInp.value, pInp.value)
  //   .then(cred => { fillProfile(cred.user); goTo('page-profile'); })
  //   .catch(err => showToast('❌ ' + err.message, 'error'));

  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const found = accounts.find(a =>
    a.username === uInp.value.trim() || a.email === uInp.value.trim()
  );

  if (!found) {
    uInp.classList.add('error');
    showToast('❌ ไม่พบบัญชีนี้ในระบบ กรุณาสมัครสมาชิกก่อน', 'error');
    return;
  }
  if (found.password !== pInp.value) {
    pInp.classList.add('error');
    showToast('❌ รหัสผ่านไม่ถูกต้อง', 'error');
    return;
  }

  fillProfile(found);
  showToast('✅ เข้าสู่ระบบสำเร็จ!', 'success');
  setTimeout(() => goTo('page-profile'), 1000);
});

document.getElementById('si-forgot-btn').addEventListener('click', () => {
  goTo('page-forgot');
});

/* ════════════════ FORGOT PASSWORD ════════════════ */
document.getElementById('fp-send-btn').addEventListener('click', () => {
  const eInp = document.getElementById('fp-email');
  const e = eInp.value.trim();
  eInp.classList.remove('error');

  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    eInp.classList.add('error');
    showToast('⚠️ กรุณากรอกอีเมลให้ถูกต้อง', 'error');
    return;
  }

  // TODO (Firebase):
  // firebase.auth().sendPasswordResetEmail(e)
  //   .then(() => goTo('page-signin'))
  //   .catch(err => showToast('❌ ' + err.message, 'error'));

  showToast('📧 ส่งลิงก์รีเซ็ตไปที่ ' + e + ' แล้ว!', 'success');
  eInp.value = '';
  setTimeout(() => goTo('page-signin'), 2500);
});

/* ════════════════ SIGN UP ════════════════ */
document.getElementById('su-submit-btn').addEventListener('click', () => {
  const uInp = document.getElementById('su-user');
  const eInp = document.getElementById('su-email');
  const pInp = document.getElementById('su-pass');
  const cInp = document.getElementById('su-confirm');
  [uInp, eInp, pInp, cInp].forEach(el => el.classList.remove('error'));

  const u = uInp.value.trim();
  const e = eInp.value.trim();
  const p = pInp.value;
  const c = cInp.value;
  let err = false;

  if (!u) { uInp.classList.add('error'); err = true; }
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { eInp.classList.add('error'); err = true; }
  if (p.length < 6) {
    pInp.classList.add('error');
    const h = document.getElementById('hint-pass');
    h.textContent = '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    h.className = 'hint err';
    err = true;
  }
  if (!c || p !== c) { cInp.classList.add('error'); err = true; }
  if (err) { showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน', 'error'); return; }

  // TODO (Firebase): แทนที่ localStorage ด้วย Firebase Auth
  // firebase.auth().createUserWithEmailAndPassword(e, p)
  //   .then(() => window.location.href = 'signin.html')
  //   .catch(err => showToast('❌ ' + err.message, 'error'));

  const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  const duplicate = accounts.find(a => a.username === u || a.email === e);
  if (duplicate) {
    showToast('❌ Username หรือ Email นี้ถูกใช้แล้ว', 'error');
    return;
  }
  accounts.push({ username: u, email: e, password: p, phone: '' });
  localStorage.setItem('accounts', JSON.stringify(accounts));

  showToast('✅ สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Sign In...', 'success');
  setTimeout(() => goTo('page-signin'), 2000);
});

/* ════════════════ PROFILE ════════════════ */

/* Avatar upload */
document.getElementById('avatar-file-input').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img  = document.getElementById('avatar-img');
    const icon = document.getElementById('avatar-default-icon');
    img.src = e.target.result;
    img.style.display = 'block';
    icon.style.display = 'none';

    // TODO (Firebase): อัปโหลดรูปไป Firebase Storage แทน localStorage
    if (currentUser) {
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const acc = accounts.find(a => a.username === currentUser);
      if (acc) {
        acc.avatar = e.target.result;
        localStorage.setItem('accounts', JSON.stringify(accounts));
      }
    }
    showToast('✅ อัปโหลดรูปโปรไฟล์แล้ว!', 'success');
  };
  reader.readAsDataURL(file);
});

/* Save profile */
document.getElementById('save-profile-btn').addEventListener('click', () => {
  const name  = document.getElementById('pf-name').value.trim();
  const phone = document.getElementById('pf-phone').value.trim();

  if (!name) {
    document.getElementById('pf-name').classList.add('error');
    showToast('⚠️ กรุณากรอกชื่อ-นามสกุล', 'error');
    return;
  }

  // TODO (Firebase): อัปเดตข้อมูลใน Firestore แทน localStorage
  if (currentUser) {
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const acc = accounts.find(a => a.username === currentUser);
    if (acc) {
      acc.displayName = name;
      acc.phone = phone;
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }
  }
  showToast('✅ บันทึกข้อมูลเรียบร้อยแล้ว!', 'success');
});

/* Logout */
document.getElementById('logout-btn').addEventListener('click', () => {
  currentUser = null;
  showToast('👋 ออกจากระบบแล้ว', 'success');
  setTimeout(() => goTo('page-signin'), 1200);
});

/* ── Enter key ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const siActive = document.getElementById('page-signin').classList.contains('active');
  if (siActive) document.getElementById('si-login-btn').click();
  else          document.getElementById('su-submit-btn').click();
});
