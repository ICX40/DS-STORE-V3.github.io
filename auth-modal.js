// auth-modal.js (ESM)
// مودال واحد للحساب: Login / Sign up / Reset + Logout داخل المودال

import { onAuth, loginEmail, signupEmail, resetPassword, logout, loginGoogle } from "./firebase.js";

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, String(v));
  }
  for (const c of children) n.appendChild(c);
  return n;
}

function ensureStyles() {
  if (document.getElementById("ds-auth-style")) return;
  const style = el("style", { id: "ds-auth-style" });
  style.textContent = `
    .ds-auth-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:99999;padding:16px}
    .ds-auth-modal{width:min(520px,96vw);background:#121212;border:1px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.7);overflow:hidden;font-family:Cairo,system-ui}
    .ds-auth-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.10)}
    .ds-auth-title{font-weight:900;color:#ffd700;margin:0;font-size:16px}
    .ds-auth-close{background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1}
    .ds-auth-body{padding:14px 16px}
    .ds-auth-tabs{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
    .ds-auth-tab{border:1px solid rgba(255,255,255,.12);background:#1a1a1a;color:#fff;padding:8px 10px;border-radius:999px;cursor:pointer;font-weight:800}
    .ds-auth-tab[aria-selected="true"]{border-color:#ffd700;box-shadow:0 0 0 3px rgba(255,215,0,.12)}
    .ds-auth-field{width:100%;box-sizing:border-box;margin:8px 0;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#1a1a1a;color:#fff;outline:none}
    .ds-auth-field:focus{border-color:#ffd700;box-shadow:0 0 0 3px rgba(255,215,0,.12)}
    .ds-auth-row{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
    .ds-auth-btn{flex:1;min-width:140px;padding:12px;border:0;border-radius:12px;font-weight:900;cursor:pointer}
    .ds-auth-btn.primary{background:#ffd700;color:#000}
    .ds-auth-btn.ghost{background:#222;color:#fff;border:1px solid rgba(255,255,255,.12)}
    .ds-auth-btn.danger{background:#2b0f12;color:#ffb3b9;border:1px solid rgba(255,255,255,.12)}
    .ds-auth-msg{min-height:22px;margin-top:10px;font-weight:900}
    .ds-header-user{display:none;align-items:center;gap:10px;margin-inline-start:10px}
    .ds-header-user img{width:36px;height:36px;border-radius:999px;border:2px solid rgba(255,215,0,.6);object-fit:cover}
    .ds-header-user .name{display:flex;flex-direction:column;line-height:1}
    .ds-header-user .name span{font-size:12px;color:#fff;font-weight:900}
    .ds-header-user .name small{font-size:11px;color:rgba(255,255,255,.7);margin-top:3px}
    @media (max-width:600px){.ds-auth-modal{border-radius:20px}.ds-auth-backdrop{align-items:flex-end}.ds-auth-modal{width:100%;max-height:85vh;border-radius:20px 20px 0 0}}
  `;
  document.head.appendChild(style);
}

function getAvatar(user) {
  if (user?.photoURL) return user.photoURL;
  const base = user?.displayName || user?.email || "U";
  const first = String(base).trim().charAt(0).toUpperCase() || "U";
  // Avatar بسيط (بدون اعتماد على خدمات خارجية)
  const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
    <rect width='100%' height='100%' rx='48' ry='48' fill='#1f1f1f'/>
    <text x='50%' y='56%' text-anchor='middle' font-family='Arial' font-size='46' fill='#ffd700'>${first}</text>
  </svg>`);
  return `data:image/svg+xml,${svg}`;
}

function displayName(user) {
  if (!user) return "";
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split("@")[0];
  return "User";
}

function ensureHeaderUI() {
  // لو عندك loginBtn موجود في الهيدر نخليه يفتح المودال
  const loginBtn = document.getElementById("loginBtn") || document.getElementById("login-btn") || document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.removeAttribute("onclick");
    loginBtn.type = "button";
    loginBtn.textContent = "الحساب";
    loginBtn.dataset.dsAuthOpen = "1";
  }

  // احذف/اخفي logoutBtn من الهيدر (المطلوب: يكون في المودال)
  const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.style.display = "none";

  // نضيف بلوك user جنب زر الحساب لو مش موجود
  let userBox = document.getElementById("dsHeaderUser");
  if (!userBox && loginBtn && loginBtn.parentElement) {
    userBox = el("div", { id: "dsHeaderUser", class: "ds-header-user" }, [
      el("img", { id: "dsHeaderAvatar", alt: "avatar" }),
      el("div", { class: "name" }, [
        el("span", { id: "dsHeaderName", text: "" }),
        el("small", { text: "مسجل دخول" }),
      ]),
    ]);
    loginBtn.parentElement.insertBefore(userBox, loginBtn);
  }

  return { loginBtn, userBox };
}

function ensureModal() {
  if (document.getElementById("dsAuthBackdrop")) return;

  const backdrop = el("div", { id: "dsAuthBackdrop", class: "ds-auth-backdrop", role: "dialog", "aria-modal": "true" });
  const modal = el("div", { class: "ds-auth-modal" });

  const close = () => (backdrop.style.display = "none");
  const open = () => (backdrop.style.display = "flex");
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  const head = el("div", { class: "ds-auth-head" }, [
    el("h3", { class: "ds-auth-title", text: "حسابك" }),
    el("button", { class: "ds-auth-close", type: "button", text: "×", onclick: close }),
  ]);

  // Tabs
  const tabs = el("div", { class: "ds-auth-tabs" }, [
    el("button", { class: "ds-auth-tab", id: "tabLogin", type: "button", text: "تسجيل دخول", "aria-selected": "true" }),
    el("button", { class: "ds-auth-tab", id: "tabSignup", type: "button", text: "إنشاء حساب", "aria-selected": "false" }),
    el("button", { class: "ds-auth-tab", id: "tabReset", type: "button", text: "نسيت كلمة المرور", "aria-selected": "false" }),
  ]);

  const msg = el("div", { class: "ds-auth-msg", id: "dsAuthMsg" });
  const setMsg = (t, ok = false) => {
    msg.textContent = t || "";
    msg.style.color = ok ? "#25D366" : "#ffb3b9";
  };

  const email = el("input", { class: "ds-auth-field", id: "dsAuthEmail", type: "email", placeholder: "Email" });
  const pass = el("input", { class: "ds-auth-field", id: "dsAuthPass", type: "password", placeholder: "Password" });
  const name = el("input", { class: "ds-auth-field", id: "dsAuthName", type: "text", placeholder: "اسمك (اختياري)" });

  const btnLogin = el("button", { class: "ds-auth-btn primary", id: "dsDoLogin", type: "button", text: "تسجيل دخول" });
  const btnSignup = el("button", { class: "ds-auth-btn primary", id: "dsDoSignup", type: "button", text: "إنشاء حساب" });
  const btnReset = el("button", { class: "ds-auth-btn primary", id: "dsDoReset", type: "button", text: "إرسال رابط إعادة التعيين" });

  const btnGoogle = el("button", { class: "ds-auth-btn ghost", id: "dsDoGoogle", type: "button", text: "تسجيل بواسطة Google" });
  const btnLogout = el("button", { class: "ds-auth-btn danger", id: "dsDoLogout", type: "button", text: "تسجيل خروج" });

  const accountBox = el("div", { id: "dsAccountBox", style: "display:none" }, [
    el("div", { style: "display:flex;align-items:center;gap:12px;margin:6px 0 10px" }, [
      el("img", { id: "dsAccountAvatar", style: "width:54px;height:54px;border-radius:999px;border:2px solid rgba(255,215,0,.6);object-fit:cover" }),
      el("div", {}, [
        el("div", { id: "dsAccountName", style: "font-weight:900" }),
        el("div", { id: "dsAccountEmail", style: "opacity:.8;font-size:12px;margin-top:4px" }),
      ]),
    ]),
    el("div", { class: "ds-auth-row" }, [btnLogout]),
  ]);

  const authBox = el("div", { id: "dsAuthBox" }, [
    tabs,
    name,
    email,
    pass,
    el("div", { class: "ds-auth-row" }, [btnLogin, btnSignup, btnReset]),
    el("div", { class: "ds-auth-row" }, [btnGoogle]),
    msg,
  ]);

  const body = el("div", { class: "ds-auth-body" }, [authBox, accountBox]);
  modal.appendChild(head);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Tab switching
  function selectTab(which) {
    const isLogin = which === "login";
    const isSignup = which === "signup";
    const isReset = which === "reset";
    document.getElementById("tabLogin").setAttribute("aria-selected", String(isLogin));
    document.getElementById("tabSignup").setAttribute("aria-selected", String(isSignup));
    document.getElementById("tabReset").setAttribute("aria-selected", String(isReset));
    // Show/hide fields
    name.style.display = isSignup ? "block" : "none";
    pass.style.display = isReset ? "none" : "block";
    btnLogin.style.display = isLogin ? "block" : "none";
    btnSignup.style.display = isSignup ? "block" : "none";
    btnReset.style.display = isReset ? "block" : "none";
    setMsg("");
  }
  tabs.addEventListener("click", (e) => {
    const id = e.target?.id;
    if (id === "tabLogin") selectTab("login");
    if (id === "tabSignup") selectTab("signup");
    if (id === "tabReset") selectTab("reset");
  });
  selectTab("login");

  // Actions
  btnLogin.addEventListener("click", async () => {
    setMsg("");
    try {
      await loginEmail(email.value.trim(), pass.value);
      setMsg("تم تسجيل الدخول ✅", true);
      close();
    } catch (e) {
      setMsg(e?.message || "فشل تسجيل الدخول");
    }
  });

  btnSignup.addEventListener("click", async () => {
    setMsg("");
    try {
      await signupEmail(email.value.trim(), pass.value, name.value.trim());
      setMsg("تم إنشاء الحساب ✅", true);
      close();
    } catch (e) {
      setMsg(e?.message || "فشل إنشاء الحساب");
    }
  });

  btnGoogle.addEventListener("click", async () => {
    setMsg("");
    try {
      const res = await loginGoogle();
      // لو دخلنا Redirect، الصفحة هتعمل Reload فبنكتفي برسالة
      if (res && res.redirect) {
        setMsg("جاري فتح Google...", true);
        return;
      }
      setMsg("تم تسجيل الدخول بجوجل ✅", true);
      close();
    } catch (e) {
      setMsg(e?.message || "فشل تسجيل الدخول بجوجل");
    }
  });

  btnReset.addEventListener("click", async () => {
    setMsg("");
    const em = email.value.trim();
    if (!em) return setMsg("اكتب الإيميل الأول");
    try {
      await resetPassword(em);
      // ملاحظة مهمة: Firebase ممكن مايرسلش لو الإيميل مش موجود (حسب الإعدادات)؛ ومع ذلك بنعرض رسالة عامة.
      setMsg("لو الإيميل صحيح هيوصلك رابط إعادة تعيين الباسورد. افحص Spam/Promotions. ✅", true);
    } catch (e) {
      setMsg(e?.message || "فشل إرسال رسالة إعادة التعيين");
    }
  });

  btnLogout.addEventListener("click", async () => {
    setMsg("");
    try {
      await logout();
      // استنى onAuthStateChanged يحدث الواجهة (مهم عشان مشكلتك)
      setMsg("تم تسجيل الخروج ✅", true);
      close();
    } catch (e) {
      setMsg(e?.message || "فشل تسجيل الخروج");
    }
  });

  // expose open/close
  window.DSAuthModal = { open, close, setMsg };
}

export function initAuthUI() {
  ensureStyles();
  ensureModal();
  const { loginBtn } = ensureHeaderUI();

  // فتح المودال من زر الحساب في الهيدر
  if (loginBtn && !loginBtn.__ds_bound) {
    loginBtn.__ds_bound = true;
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.DSAuthModal?.open?.();
    });
  }

  // تحديث الهيدر والمودال حسب حالة الدخول
  onAuth((user) => {
    const userBox = document.getElementById("dsHeaderUser");
    const avatar = document.getElementById("dsHeaderAvatar");
    const name = document.getElementById("dsHeaderName");

    const authBox = document.getElementById("dsAuthBox");
    const accountBox = document.getElementById("dsAccountBox");

    if (user) {
      if (loginBtn) loginBtn.textContent = "الحساب";
      if (userBox) userBox.style.display = "flex";
      if (avatar) avatar.src = getAvatar(user);
      if (name) name.textContent = displayName(user);

      if (authBox) authBox.style.display = "none";
      if (accountBox) {
        accountBox.style.display = "block";
        const a = document.getElementById("dsAccountAvatar");
        const n = document.getElementById("dsAccountName");
        const em = document.getElementById("dsAccountEmail");
        if (a) a.src = getAvatar(user);
        if (n) n.textContent = displayName(user);
        if (em) em.textContent = user.email || "";
      }
    } else {
      if (userBox) userBox.style.display = "none";
      if (loginBtn) loginBtn.textContent = "تسجيل دخول";
      if (authBox) authBox.style.display = "block";
      if (accountBox) accountBox.style.display = "none";
    }
  });
}

// auto init
initAuthUI();
