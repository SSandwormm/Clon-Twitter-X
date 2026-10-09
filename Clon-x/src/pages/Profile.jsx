import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RiArrowLeftLine, RiCalendarLine, RiCloseLine } from "react-icons/ri";
import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Avatar from "../components/Avatar";
import Feed from "../components/Feed";
import { useAuth } from "../context/auth-context";
import { auth, db } from "../firebase/config";
import { useProfileByUsername, useUserProfile } from "../hooks/useUserProfile";

function EditProfileModal({ profile, onClose }) {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveProfile(event) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("El nombre no puede estar vacío.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", profile.uid), {
        displayName: name,
        bio: bio.trim(),
      });
      onClose();
    } catch {
      setError("No se pudo actualizar el perfil. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section
        aria-labelledby="edit-profile-title"
        aria-modal="true"
        className="w-full max-w-[600px] rounded-2xl bg-white p-4 shadow-xl sm:p-6"
        role="dialog"
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-full hover:bg-zinc-100"
            onClick={onClose}
            type="button"
          >
            <RiCloseLine aria-hidden="true" size={22} />
          </button>
          <h2 className="text-xl font-bold" id="edit-profile-title">
            Editar perfil
          </h2>
        </div>
        <form className="space-y-4" onSubmit={saveProfile}>
          <label className="block text-sm text-zinc-500">
            Nombre
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-3 text-base text-black outline-none focus:border-[#1d9bf0]"
              maxLength={50}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              value={displayName}
            />
          </label>
          <label className="block text-sm text-zinc-500">
            Bio
            <textarea
              className="mt-1 min-h-24 w-full resize-y rounded border border-zinc-300 px-3 py-3 text-base text-black outline-none focus:border-[#1d9bf0]"
              maxLength={160}
              onChange={(event) => setBio(event.target.value)}
              value={bio}
            />
          </label>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfileByUsername(username);
  const { profile: currentProfile } = useUserProfile(user.uid);
  const [activeTab, setActiveTab] = useState("Posts");
  const [editOpen, setEditOpen] = useState(false);
  const [followingBusy, setFollowingBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const isOwnProfile = profile?.uid === user.uid;
  const isFollowing =
    currentProfile?.following?.includes(profile?.uid) || false;

  async function toggleFollow() {
    if (!profile || !currentProfile || followingBusy) return;
    setFollowingBusy(true);
    setActionError("");

    const batch = writeBatch(db);
    const currentUserRef = doc(db, "users", user.uid);
    const targetUserRef = doc(db, "users", profile.uid);

    if (isFollowing) {
      batch.update(currentUserRef, {
        following: arrayRemove(profile.uid),
      });
      batch.update(targetUserRef, { followers: arrayRemove(user.uid) });
    } else {
      batch.update(currentUserRef, {
        following: arrayUnion(profile.uid),
      });
      batch.update(targetUserRef, { followers: arrayUnion(user.uid) });
    }

    try {
      await batch.commit();
    } catch {
      setActionError("No se pudo actualizar el seguimiento. Inténtalo de nuevo.");
    } finally {
      setFollowingBusy(false);
    }
  }

  if (profileLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-[600px] border-x border-zinc-200 p-8 text-center text-zinc-500">
        Cargando perfil...
      </main>
    );
  }

  if (profileError || !profile) {
    return (
      <main className="mx-auto min-h-screen max-w-[600px] border-x border-zinc-200 px-4 py-5">
        <Link
          className="inline-flex items-center gap-2 font-bold hover:underline"
          to="/"
        >
          <RiArrowLeftLine aria-hidden="true" size={21} />
          Volver
        </Link>
        <p className="mt-12 text-center text-lg font-bold">
          {profileError || "No se encontró este perfil."}
        </p>
      </main>
    );
  }

  const likedQuery = activeTab === "Me gusta";
  const repliesQuery = activeTab === "Respuestas";
  const mediaQuery = activeTab === "Multimedia";
  const createdDate =
    profile.createdAt instanceof Date
      ? profile.createdAt
      : profile.createdAt?.toDate?.();

  return (
    <main className="mx-auto min-h-screen max-w-[600px] border-x border-zinc-200 bg-white text-black">
      <header className="sticky top-0 z-20 flex h-[54px] items-center gap-6 bg-white/85 px-4 backdrop-blur-md">
        <Link
          aria-label="Volver al inicio"
          className="grid size-9 place-items-center rounded-full hover:bg-zinc-100"
          to="/inicio"
        >
          <RiArrowLeftLine aria-hidden="true" size={22} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{profile.displayName}</h1>
          <p className="text-xs text-zinc-500">Posts</p>
        </div>
      </header>

      <div className="h-[200px] bg-zinc-200" />
      <section className="border-b border-zinc-200 px-4 pb-4">
        <div className="flex min-h-[74px] items-start justify-between">
          <div className="-mt-[68px] rounded-full border-4 border-white">
            <Avatar
              name={profile.displayName}
              photoURL={profile.photoURL}
              size="size-[134px]"
            />
          </div>
          {isOwnProfile ? (
            <button
              className="mt-3 rounded-full border border-zinc-300 px-4 py-2 text-sm font-bold hover:bg-zinc-100"
              onClick={() => setEditOpen(true)}
              type="button"
            >
              Editar perfil
            </button>
          ) : (
            <button
              className={`mt-3 rounded-full px-4 py-2 text-sm font-bold transition ${isFollowing ? "border border-zinc-300 bg-white text-black hover:border-red-300 hover:bg-red-50 hover:text-red-600" : "bg-black text-white hover:bg-zinc-800"}`}
              disabled={!currentProfile || followingBusy}
              onClick={toggleFollow}
              type="button"
            >
              {followingBusy ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
            </button>
          )}
        </div>

        <h2 className="text-xl font-extrabold">{profile.displayName}</h2>
        <p className="text-sm text-zinc-500">@{profile.username}</p>
        {profile.bio && (
          <p className="mt-3 whitespace-pre-wrap text-[15px]">{profile.bio}</p>
        )}
        {createdDate && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500">
            <RiCalendarLine aria-hidden="true" size={17} />
            Se unió en{" "}
            {createdDate.toLocaleDateString("es", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        <div className="mt-3 flex gap-5 text-sm">
          <span>
            <strong>{profile.following?.length || 0}</strong>{" "}
            <span className="text-zinc-500">Siguiendo</span>
          </span>
          <span>
            <strong>{profile.followers?.length || 0}</strong>{" "}
            <span className="text-zinc-500">Seguidores</span>
          </span>
        </div>
        {actionError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {actionError}
          </p>
        )}
      </section>

      <div className="grid h-[54px] grid-cols-4 border-b border-zinc-200">
        {["Posts", "Respuestas", "Multimedia", "Me gusta"].map((tab) => (
          <button
            aria-pressed={activeTab === tab}
            className="relative flex items-center justify-center text-sm hover:bg-zinc-100"
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            <span
              className={activeTab === tab ? "font-bold" : "text-zinc-500"}
            >
              {tab}
            </span>
            {activeTab === tab && (
              <span className="absolute bottom-0 h-1 w-14 rounded-full bg-[#1d9bf0]" />
            )}
          </button>
        ))}
      </div>

      <Feed
        emptyMessage={
          likedQuery
            ? "Todavía no hay posts que le gusten."
            : repliesQuery
              ? "Todavía no hay respuestas."
              : mediaQuery
                ? "Todavía no hay contenido multimedia."
                : "Todavía no hay posts."
        }
        authorUid={likedQuery ? undefined : profile.uid}
        likedByUid={likedQuery ? profile.uid : undefined}
        multimediaOnly={mediaQuery}
        profile={currentProfile}
        repliesOnly={repliesQuery}
        user={user}
      />

      {editOpen && (
        <EditProfileModal
          onClose={() => setEditOpen(false)}
          profile={profile}
        />
      )}
    </main>
  );
}
