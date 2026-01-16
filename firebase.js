// firebase.js (ESM)
// Auth: Email/Password + Google (مع fallback للـ Redirect لتفادي مشاكل الـ Popup)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  // FacebookAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ✅ Firebase config (Project: ds2store4games)
const firebaseConfig = {
  apiKey: "AIzaSyBYfa1AUBXBy9DDGQq274hrpvqjqKveMCo",
  authDomain: "ds2store4games.firebaseapp.com",
  projectId: "ds2store4games",
  storageBucket: "ds2store4games.firebasestorage.app",
  messagingSenderId: "49178158787",
  appId: "1:49178158787:web:b973b6659d835032a9a476",
  measurementId: "G-Y30LP4M2RG",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ✅ مهم لو استخدمت Redirect: يكمّل العملية بعد الرجوع للموقع
// لو ما فيش Redirect pending، هيتجاهل بهدوء
getRedirectResult(auth).catch(() => {});

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signupEmail(email, pass, displayName = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  // حفظ الاسم (اختياري) علشان يظهر في الهيدر
  if (displayName && cred?.user) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      console.warn("updateProfile failed", e);
    }
  }
  return cred;
}

export function loginEmail(email, pass) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export function logout() {
  return signOut(auth);
}

// ✅ Google login: جرّب Popup، ولو اتقفل/اتلغى/اتبلوك استخدم Redirect كحل نهائي
export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    await signInWithPopup(auth, provider);
    return { redirect: false };
  } catch (e) {
    const code = e?.code || "";
    const fallbackCodes = [
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
    ];

    if (fallbackCodes.includes(code)) {
      // Redirect بيشتغل حتى لو المتصفح مانع Popups
      await signInWithRedirect(auth, provider);
      return { redirect: true };
    }

    // unauthorized-domain / invalid-api-key ... إلخ لازم تتصلح من Firebase Console
    throw e;
  }
}

// Reset password
// NOTE: لازم الدومين يكون موجود في Firebase Auth -> Settings -> Authorized domains
export function resetPassword(email) {
  const actionCodeSettings = {
    // يرجّع المستخدم لصفحة اللوجين بعد ما يغيّر الباسورد
    url: `${window.location.origin}/login.html`,
    handleCodeInApp: false,
  };
  return sendPasswordResetEmail(auth, email, actionCodeSettings);
}

// ✅ Backward compatibility مع أي كود قديم بيستخدم window.fb
window.fb = {
  onAuth,
  signup: (email, pass) => signupEmail(email, pass, ""),
  login: loginEmail,
  logout,
  loginGoogle,
  resetPassword,
};
