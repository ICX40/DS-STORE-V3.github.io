import { onAuth, logout } from './firebase.js';

// يشتغل على كل الصفحات لو موجودة الأزرار
function qs(id){ return document.getElementById(id); }

const loginBtn = qs('login-btn') || qs('loginBtn') || qs('login-btn');
const logoutBtn = qs('logout-btn') || qs('logoutBtn');
const userEmailEl = qs('user-email') || qs('userEmail');

// زر تسجيل الدخول يروح لصفحة login.html
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await logout();
      // رجّع المستخدم للرئيسية بعد الخروج
      window.location.href = 'index.html';
    } catch (e) {
      console.error(e);
      alert('حصل خطأ أثناء تسجيل الخروج');
    }
  });
}

// تحكم في ظهور الأزرار حسب حالة المستخدم
onAuth((user) => {
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (userEmailEl) userEmailEl.textContent = user.email || '';
  } else {
    if (loginBtn) loginBtn.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userEmailEl) userEmailEl.textContent = '';

    // حماية اختيارية: لو الصفحة حاطة data-require-auth="true" يرجع للوجين
    if (document.body && document.body.dataset && document.body.dataset.requireAuth === 'true') {
      // استثني صفحة اللوجين نفسها
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
    }
  }
});
