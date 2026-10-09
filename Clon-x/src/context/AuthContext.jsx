import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { AuthContext } from "./auth-context";
import { ensureUserProfile } from "../lib/userProfiles";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfileError("");
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await ensureUserProfile(currentUser);
      } catch {
        setProfileError("No se pudo cargar tu perfil. Recarga la página.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function register(email, password, username) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(credential.user, { displayName: username });
    await ensureUserProfile(credential.user, username);
    setUser(credential.user);
    return credential.user;
  }

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(credential.user);
    setUser(credential.user);
    return credential.user;
  }

  async function loginWithGoogle() {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(credential.user);
    setUser(credential.user);
    return credential.user;
  }

  async function requestPhoneCode(phoneNumber, recaptchaContainer) {
    const verifier = new RecaptchaVerifier(auth, recaptchaContainer, {
      size: "invisible",
    });

    try {
      return await signInWithPhoneNumber(auth, phoneNumber, verifier);
    } finally {
      verifier.clear();
    }
  }

  async function confirmPhoneCode(confirmationResult, code) {
    const credential = await confirmationResult.confirm(code);
    const phoneUser = credential.user;

    if (!phoneUser.displayName) {
      await updateProfile(phoneUser, {
        displayName: phoneUser.phoneNumber || "Usuario",
      });
    }

    await ensureUserProfile(phoneUser);
    setUser(phoneUser);
    return phoneUser;
  }

  function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profileError,
        register,
        login,
        loginWithGoogle,
        requestPhoneCode,
        confirmPhoneCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}