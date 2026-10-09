import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { normalizeUsername } from "../lib/userProfiles";

export function useUserProfile(uid) {
  const [state, setState] = useState({
    uid: null,
    profile: null,
    error: "",
  });

  useEffect(() => {
    if (!uid) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        setState({
          uid,
          profile: snapshot.exists() ? { uid, ...snapshot.data() } : null,
          error: "",
        });
      },
      () => {
        setState({ uid, profile: null, error: "No se pudo cargar el perfil." });
      },
    );

    return unsubscribe;
  }, [uid]);

  return {
    profile: state.uid === uid ? state.profile : null,
    loading: Boolean(uid) && state.uid !== uid,
    error: state.uid === uid ? state.error : "",
  };
}

export function useProfileByUsername(username) {
  const [state, setState] = useState({
    username: null,
    profile: null,
    error: "",
  });
  const normalizedUsername = normalizeUsername(username);

  useEffect(() => {
    const profileQuery = query(
      collection(db, "users"),
      where("username", "==", normalizedUsername),
      limit(1),
    );
    const unsubscribe = onSnapshot(
      profileQuery,
      (snapshot) => {
        const result = snapshot.docs[0];
        setState({
          username: normalizedUsername,
          profile: result ? { uid: result.id, ...result.data() } : null,
          error: "",
        });
      },
      () => {
        setState({
          username: normalizedUsername,
          profile: null,
          error: "No se pudo cargar el perfil.",
        });
      },
    );

    return unsubscribe;
  }, [normalizedUsername]);

  return {
    profile:
      state.username === normalizedUsername ? state.profile : null,
    loading: state.username !== normalizedUsername,
    error: state.username === normalizedUsername ? state.error : "",
  };
}
