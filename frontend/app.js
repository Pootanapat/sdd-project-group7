/* ============================================
   app.js — JavaScript ทั้งหมดของระบบ Auth (ปรับแก้สำหรับแยกไฟล์ HTML)
   ============================================ */

const EYE_OPEN  = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSE = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;

// โหลดข้อมูลผู้ใช้จาก localStorage ตอนเปิดหน้ามา
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

/* ── fillProfile: โหลดข้อมูล account มาใส่หน้า Profile ── */
function fillProfile(acc) {
    if (!acc) return;
    
    // อัปเดต currentUser และบันทึกลง localStorage เพื่อให้จำได้เวลาเปลี่ยนหน้า
    currentUser = acc.username;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    const nameInput = document.getElementById('pf-name');
    const phoneInput = document.getElementById('pf-phone');
    const emailInput = document.getElementById('pf-email');
    const img  = document.getElementById('avatar-img');
    const icon = document.getElementById('avatar-default-icon');

    if (nameInput) nameInput.value  = acc.displayName || acc.username;
    if (phoneInput) phoneInput.value = acc.phone || '';
    if (emailInput) emailInput.value = acc.email;

    if (img && icon) {
        if (acc.avatar) {
            img.src = acc.avatar;
            img.style.display = 'block';
            icon.style.display = 'none';
        } else {
            img.style.display = 'none';
            icon.style.display = '';
        }
    }
}

/* ── showToast: แจ้งเตือน ── */
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
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
        if (!inp || !icon) return;
        const shown = inp.type === 'text';
        inp.type = shown ? 'password' : 'text';
        icon.innerHTML = shown ? EYE_OPEN : EYE_CLOSE;
    });
});

/* ── Reset กรอบแดงเมื่อพิมพ์ ── */
document.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => inp.classList.remove('error'));
});

/* ── Live check: password ตรงกันไหม (สำหรับหน้า Signup) ── */
const suConfirmInput = document.getElementById('su-confirm');
if (suConfirmInput) {
    suConfirmInput.addEventListener('input', () => {
        const p = document.getElementById('su-pass').value;
        const c = suConfirmInput.value;
        const h = document.getElementById('hint-confirm');
        if (!h) return;
        if (!c) { h.textContent = ''; h.className = 'hint'; return; }
        if (p === c) { h.textContent = '✅ รหัสผ่านตรงกัน'; h.className = 'hint ok'; }
        else         { h.textContent = '❌ รหัสผ่านไม่ตรงกัน'; h.className = 'hint err'; }
    });
}

/* ════════════════ SIGN IN ════════════════ */
const loginBtn = document.getElementById('si-login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const uInp = document.getElementById('si-user');
        const pInp = document.getElementById('si-pass');
        uInp.classList.remove('error');
        pInp.classList.remove('error');

        let err = false;
        if (!uInp.value.trim()) { uInp.classList.add('error'); err = true; }
        if (!pInp.value)        { pInp.classList.add('error'); err = true; }
        if (err) { showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return; }

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

        // เก็บข้อมูลคนล็อกอิน และพาไปหน้า Profile
        fillProfile(found);
        showToast('✅ เข้าสู่ระบบสำเร็จ!', 'success');
        setTimeout(() => window.location.href = 'profile.html', 1000);
    });
}

/* ════════════════ FORGOT PASSWORD ════════════════ */
const fpSendBtn = document.getElementById('fp-send-btn');
if (fpSendBtn) {
    fpSendBtn.addEventListener('click', () => {
        const eInp = document.getElementById('fp-email');
        const e = eInp.value.trim();
        eInp.classList.remove('error');

        if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
            eInp.classList.add('error');
            showToast('⚠️ กรุณากรอกอีเมลให้ถูกต้อง', 'error');
            return;
        }

        showToast('📧 ส่งลิงก์รีเซ็ตไปที่ ' + e + ' แล้ว!', 'success');
        eInp.value = '';
        setTimeout(() => {
            // ซ่อนหน้า forgot กลับมาหน้า signin (เพราะเราทำไว้ในไฟล์ Signin.html เดียวกัน)
            document.getElementById('page-forgot').classList.remove('active');
            document.getElementById('page-signin').classList.add('active');
        }, 2500);
    });
}

/* ════════════════ SIGN UP ════════════════ */
const suSubmitBtn = document.getElementById('su-submit-btn');
if (suSubmitBtn) {
    suSubmitBtn.addEventListener('click', () => {
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
            if (h) {
                h.textContent = '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
                h.className = 'hint err';
            }
            err = true;
        }
        if (!c || p !== c) { cInp.classList.add('error'); err = true; }
        if (err) { showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน', 'error'); return; }

        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const duplicate = accounts.find(a => a.username === u || a.email === e);
        if (duplicate) {
            showToast('❌ Username หรือ Email นี้ถูกใช้แล้ว', 'error');
            return;
        }
        
        // สมัครสมาชิกเสร็จ บันทึกลง localStorage
        accounts.push({ username: u, email: e, password: p, phone: '', avatar: null, displayName: '' });
        localStorage.setItem('accounts', JSON.stringify(accounts));

        showToast('✅ สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Sign In...', 'success');
        setTimeout(() => window.location.href = 'Signin.html', 2000);
    });
}

/* ════════════════ PROFILE ════════════════ */
// ถ้าเปิดหน้า Profile มา ให้โหลดข้อมูลจาก localStorage มาโชว์
if (window.location.pathname.includes('profile.html')) {
    if (currentUser) {
        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const acc = accounts.find(a => a.username === currentUser);
        if (acc) fillProfile(acc);
    } else {
        // ถ้ายังไม่ได้ล็อกอิน ให้เด้งกลับไปหน้า Signin
        window.location.href = 'Signin.html';
    }
}

/* Avatar upload */
const avatarInput = document.getElementById('avatar-file-input');
if (avatarInput) {
    avatarInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const img  = document.getElementById('avatar-img');
            const icon = document.getElementById('avatar-default-icon');
            if (img && icon) {
                img.src = e.target.result;
                img.style.display = 'block';
                icon.style.display = 'none';
            }

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
}

/* Save profile */
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('pf-name');
        const phoneInput = document.getElementById('pf-phone');
        if (!nameInput || !phoneInput) return;

        const name  = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name) {
            nameInput.classList.add('error');
            showToast('⚠️ กรุณากรอกชื่อ-นามสกุล', 'error');
            return;
        }

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
}

/* Logout */
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser'); // ลบสถานะการล็อกอิน
        showToast('👋 ออกจากระบบแล้ว', 'success');
        setTimeout(() => window.location.href = 'Signin.html', 1200);
    });
}

/* ── Enter key ── */
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (loginBtn && document.getElementById('page-signin').classList.contains('active')) {
        loginBtn.click();
    } else if (suSubmitBtn && document.getElementById('page-signup')) {
        suSubmitBtn.click();
    }
});