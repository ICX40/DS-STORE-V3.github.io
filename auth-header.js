// auth-header.js (module)
// Updates header UI based on Firebase Auth state (name + avatar + login/logout).

import { onUserChanged, logout } from "./firebase.js";

const avatarFallback = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=111827&color=F7C600&bold=true`;

function getName(user) {
  if (!user) return "";
  if (user.displayName && user.displayName.trim()) return user.displayName.trim();
  if (user.email && user.email.includes("@")) return user.email.split("@")[0];
  return "User";
}

function byId(id) {
  return document.getElementById(id);
}

function initHeaderAuth() {
  // We support both the newer ids (loginLink/userBox/...) and the existing ones (loginBtn/logoutBtn)
  const loginLink = byId("loginLink") || byId("loginBtn");
  const logoutBtn = byId("logoutBtn");
  const userBox = byId("userBox");
  const userAvatar = byId("userAvatar");
  const userName = byId("userName");

  // If this page has no header auth elements, do nothing.
  if (!loginLink && !logoutBtn && !userBox) return;

  // Make login control navigate to login page if it isn't already.
  if (loginLink && !loginLink.__ds_bound) {
    loginLink.__ds_bound = true;
    loginLink.addEventListener("click", (e) => {
      // If it's an <a href="login.html"> keep default. If it's a button, navigate.
      const isAnchor = loginLink.tagName?.toLowerCase() === "a";
      if (!isAnchor) {
        e.preventDefault();
        window.location.href = "login.html";
      }
    });
  }

  // React to auth state.
  onUserChanged((user) => {
    const loggedIn = !!user;
    const name = getName(user);
    const photo = user?.photoURL || avatarFallback(name);

    // Toggle login/logout
    if (loginLink) loginLink.style.display = loggedIn ? "none" : "flex";
    if (logoutBtn) logoutBtn.style.display = loggedIn ? "flex" : "none";

    // Profile box
    if (userBox) userBox.style.display = loggedIn ? "flex" : "none";
    if (userAvatar && loggedIn) userAvatar.src = photo;
    if (userName && loggedIn) userName.textContent = name;
  });

  // Logout
  if (logoutBtn && !logoutBtn.__ds_bound) {
    logoutBtn.__ds_bound = true;
    logoutBtn.addEventListener("click", async () => {
      try {
        logoutBtn.disabled = true;
        await logout();
        // Always go back to home after logout.
        window.location.href = "index.html";
      } catch (e) {
        alert(e?.message || "حصل خطأ أثناء تسجيل الخروج");
      } finally {
        logoutBtn.disabled = false;
      }
    });
  }
}

// Ensure DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeaderAuth);
} else {
  initHeaderAuth();
}
