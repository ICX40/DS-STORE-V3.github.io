// حماية الصفحة: لو مش عامل لوجين يوديك login.html
window.requireAuth = function () {
  if (!window.fb || typeof window.fb.onAuth !== "function") return;
  window.fb.onAuth((user) => {
    if (!user) window.location.href = "login.html";
  });
};

// ربط أزرار الهيدر: تسجيل دخول / خروج
window.setupAuthButtons = function () {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // fallback: لو الزر موجود خليه يفتح login.html حتى لو Firebase مش محمّل
  if (loginBtn && !loginBtn.__ds_bound) {
    loginBtn.__ds_bound = true;
    loginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }

  if (!window.fb || typeof window.fb.onAuth !== "function") return;

  window.fb.onAuth((user) => {
    if (loginBtn) loginBtn.style.display = user ? "none" : "flex";
    if (logoutBtn) logoutBtn.style.display = user ? "flex" : "none";
  });

  if (logoutBtn && !logoutBtn.__ds_bound) {
    logoutBtn.__ds_bound = true;
    logoutBtn.addEventListener("click", async () => {
      await window.fb.logout();
      location.reload();
    });
  }
};
