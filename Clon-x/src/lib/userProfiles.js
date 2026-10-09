import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export function normalizeUsername(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

function usernameBase(user, preferredName) {
  const name =
    preferredName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    user.phoneNumber ||
    "usuario";
  return normalizeUsername(name) || "usuario";
}

export async function ensureUserProfile(user, preferredName) {
  const userRef = doc(db, "users", user.uid);
  const base = usernameBase(user, preferredName);

  return runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const existing = userSnapshot.exists() ? userSnapshot.data() : null;
    const preferredUsername = preferredName
      ? normalizeUsername(preferredName)
      : "";

    let oldClaimRef = null;
    let oldClaimSnapshot = null;
    if (existing?.username) {
      oldClaimRef = doc(db, "usernameClaims", existing.username);
      oldClaimSnapshot = await transaction.get(oldClaimRef);
    }

    if (
      existing?.username &&
      (!preferredUsername || existing.username === preferredUsername) &&
      (!oldClaimSnapshot.exists() ||
        oldClaimSnapshot.data().uid === user.uid)
    ) {
      if (!oldClaimSnapshot.exists()) {
        transaction.set(oldClaimRef, { uid: user.uid });
      }
      return existing;
    }

    let username = preferredUsername || base;
    let claimRef = doc(db, "usernameClaims", username);
    let claimSnapshot = await transaction.get(claimRef);

    if (claimSnapshot.exists() && claimSnapshot.data().uid !== user.uid) {
      let suffix = 2;
      do {
        username = `${(preferredUsername || base).slice(0, 20 - String(suffix).length)}${suffix}`;
        claimRef = doc(db, "usernameClaims", username);
        claimSnapshot = await transaction.get(claimRef);
        suffix += 1;
      } while (claimSnapshot.exists() && claimSnapshot.data().uid !== user.uid);
    }

    const profile = {
      displayName:
        preferredName?.trim() ||
        existing?.displayName ||
        user.displayName ||
        user.email ||
        user.phoneNumber ||
        "Usuario",
      username,
      photoURL: user.photoURL || existing?.photoURL || "",
      bio: existing?.bio || "",
      followers: existing?.followers || [],
      following: existing?.following || [],
      createdAt: existing?.createdAt || serverTimestamp(),
    };

    if (oldClaimRef && oldClaimRef.id !== username) {
      if (oldClaimSnapshot.exists() && oldClaimSnapshot.data().uid === user.uid) {
        transaction.delete(oldClaimRef);
      }
    }

    transaction.set(claimRef, { uid: user.uid });
    transaction.set(userRef, profile);
    return profile;
  });
}
