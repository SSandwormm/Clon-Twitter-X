import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiBarChartLine,
  RiBookmarkFill,
  RiBookmarkLine,
  RiChat3Line,
  RiCloseLine,
  RiHeartFill,
  RiHeartLine,
  RiMoreFill,
  RiRepeatLine,
  RiShareLine,
} from "react-icons/ri";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Avatar from "./Avatar";

function relativeDate(createdAt) {
  const date =
    createdAt instanceof Date ? createdAt : createdAt?.toDate?.();
  if (!date) return "ahora";

  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

function getHandle(tweet) {
  return (tweet.username || "usuario").replace(/^@/, "").replace(/\s+/g, "");
}

function linkedTweetText(text) {
  const parts = text.split(/(#[\p{L}\p{N}_]+|@[a-zA-Z0-9_]{1,20})/gu);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <Link
          className="text-[#1d9bf0] hover:underline"
          key={`${index}-${part}`}
          onClick={(event) => event.stopPropagation()}
          to={`/buscar?q=${encodeURIComponent(part)}`}
        >
          {part}
        </Link>
      );
    }

    if (part.startsWith("@")) {
      return (
        <Link
          className="text-[#1d9bf0] hover:underline"
          key={`${index}-${part}`}
          onClick={(event) => event.stopPropagation()}
          to={`/${part.slice(1)}`}
        >
          {part}
        </Link>
      );
    }

    return part;
  });
}

export default function Tweet({ tweet, user, profile }) {
  const [likeError, setLikeError] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [localLiked, setLocalLiked] = useState(false);
  const [localRetweeted, setLocalRetweeted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarkError, setBookmarkError] = useState("");
  const isFake = tweet.id.startsWith("fake-");
  const likes = Array.isArray(tweet.likes) ? tweet.likes : [];
  const liked = isFake ? localLiked : likes.includes(user.uid);
  const isSaved = isFake
    ? saved
    : (profile?.bookmarks || []).includes(tweet.id);
  const likeCount = (tweet.fakeLikeCount || 0) + (isFake ? Number(localLiked) : likes.length);
  const retweetCount =
    (tweet.retweetCount || 0) + Number(isFake && localRetweeted);
  const createdAtDate =
    tweet.createdAt instanceof Date
      ? tweet.createdAt
      : tweet.createdAt?.toDate?.();
  const handle = getHandle(tweet);
  const displayName = tweet.displayName || tweet.username || "Usuario";
  const ownTweet = tweet.uid === user.uid;

  async function toggleLike() {
    if (isFake) {
      setLocalLiked((wasLiked) => !wasLiked);
      return;
    }

    setLikeError("");
    const tweetRef = doc(db, "tweets", tweet.id);

    try {
      await updateDoc(
        tweetRef,
        liked
          ? { likes: arrayRemove(user.uid) }
          : { likes: arrayUnion(user.uid) },
      );
    } catch {
      setLikeError("No se pudo actualizar el Me gusta. Inténtalo de nuevo.");
    }
  }

  async function submitReply(event) {
    event.preventDefault();
    const text = replyText.trim();
    if (!text || replying) return;

    setReplying(true);
    setReplyError("");
    const replyRef = doc(collection(db, "tweets"));
    const originalRef = doc(db, "tweets", tweet.id);

    try {
      await runTransaction(db, async (transaction) => {
        const originalSnapshot = await transaction.get(originalRef);
        if (!originalSnapshot.exists()) {
          throw new Error("tweet-not-found");
        }

        transaction.set(replyRef, {
          text,
          uid: user.uid,
          username: profile?.username || user.displayName || "usuario",
          displayName: profile?.displayName || user.displayName || "Usuario",
          photoURL: profile?.photoURL || user.photoURL || "",
          createdAt: serverTimestamp(),
          likes: [],
          replyCount: 0,
          replyTo: tweet.id,
        });
        transaction.update(originalRef, { replyCount: increment(1) });
      });
      setReplyText("");
      setReplyOpen(false);
    } catch {
      setReplyError("No se pudo publicar la respuesta. Inténtalo de nuevo.");
    } finally {
      setReplying(false);
    }
  }

  async function removeTweet() {
    setDeleteError("");
    setMenuOpen(false);
    if (!window.confirm("¿Eliminar este post?")) return;

    try {
      await deleteDoc(doc(db, "tweets", tweet.id));
    } catch {
      setDeleteError("No se pudo eliminar el post. Inténtalo de nuevo.");
    }
  }

  async function toggleBookmark() {
    if (isFake) {
      setSaved((wasSaved) => !wasSaved);
      return;
    }
    if (!profile) {
      setBookmarkError("No se pudo cargar tu perfil para guardar este post.");
      return;
    }
    setBookmarkError("");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        bookmarks: isSaved ? arrayRemove(tweet.id) : arrayUnion(tweet.id),
      });
    } catch {
      setBookmarkError("No se pudo actualizar Guardados. Inténtalo de nuevo.");
    }
  }

  return (
    <>
      <article className="border-b border-zinc-200 px-4 py-3 transition hover:bg-zinc-50/60">
        <div className="flex gap-3">
          <Link
            aria-label={`Ver el perfil de ${displayName}`}
            className="h-fit"
            to={`/${handle}`}
          >
            <Avatar
              name={displayName}
              photoURL={tweet.photoURL}
              size="size-10"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1 text-[15px]">
              <Link
                className="truncate font-bold hover:underline"
                to={`/${handle}`}
              >
                {displayName}
              </Link>
              <Link
                className="truncate text-zinc-500 hover:underline"
                to={`/${handle}`}
              >
                @{handle}
              </Link>
              <span className="shrink-0 text-zinc-500">·</span>
              <Link
                className="shrink-0 text-zinc-500 hover:underline"
                to={`/tweet/${tweet.id}`}
              >
                <time dateTime={createdAtDate?.toISOString?.()}>
                  {relativeDate(tweet.createdAt)}
                </time>
              </Link>
              {ownTweet && (
                <div className="relative ml-auto">
                  <button
                    aria-label="Más opciones"
                    aria-expanded={menuOpen}
                    className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-sky-50 hover:text-[#1d9bf0]"
                    onClick={() => setMenuOpen((isOpen) => !isOpen)}
                    type="button"
                  >
                    <RiMoreFill aria-hidden="true" size={19} />
                  </button>
                  {menuOpen && (
                    <div className="absolute top-full right-0 z-10 w-36 rounded-lg bg-white py-1 shadow-[0_0_12px_rgba(0,0,0,0.2)]">
                      <button
                        className="w-full px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-zinc-100"
                        onClick={removeTweet}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-5 text-black">
              {linkedTweetText(tweet.text || "")}
            </p>

            <div className="mt-3 flex max-w-[425px] items-center justify-between text-zinc-500">
              <button
                aria-label={`Responder (${tweet.replyCount || 0})`}
                className="group flex items-center gap-1 text-xs transition hover:text-[#1d9bf0]"
                onClick={() => setReplyOpen(true)}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-full transition group-hover:bg-sky-50">
                  <RiChat3Line aria-hidden="true" size={18} />
                </span>
                {(tweet.replyCount || 0) > 0 && (
                  <span>{tweet.replyCount}</span>
                )}
              </button>
              <button
                aria-label="Repostear"
                aria-pressed={isFake ? localRetweeted : undefined}
                className={`group flex items-center gap-1.5 text-xs transition ${isFake && localRetweeted ? "text-emerald-600" : "hover:text-emerald-600"}`}
                onClick={() => {
                  if (isFake) setLocalRetweeted((wasRetweeted) => !wasRetweeted);
                }}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-full transition group-hover:bg-emerald-50">
                  <RiRepeatLine aria-hidden="true" size={18} />
                </span>
                {retweetCount > 0 && <span>{retweetCount}</span>}
              </button>
              <button
                aria-label={liked ? "Quitar Me gusta" : "Me gusta"}
                aria-pressed={liked}
                className={`group flex items-center gap-1 text-xs transition ${liked ? "text-rose-600" : "hover:text-rose-600"}`}
                onClick={toggleLike}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-full transition group-hover:bg-rose-50">
                  {liked ? (
                    <RiHeartFill aria-hidden="true" size={18} />
                  ) : (
                    <RiHeartLine aria-hidden="true" size={18} />
                  )}
                </span>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button
                aria-label="Vistas"
                className="group grid size-8 place-items-center rounded-full transition hover:bg-sky-50 hover:text-[#1d9bf0]"
                type="button"
              >
                <RiBarChartLine aria-hidden="true" size={18} />
              </button>
              <button
                aria-label="Compartir"
                className="group grid size-8 place-items-center rounded-full transition hover:bg-sky-50 hover:text-[#1d9bf0]"
                type="button"
              >
                <RiShareLine aria-hidden="true" size={18} />
              </button>
              <button
                aria-label={isSaved ? "Quitar de Guardados" : "Guardar"}
                aria-pressed={isSaved}
                className={`group grid size-8 place-items-center rounded-full transition ${isSaved ? "text-[#1d9bf0]" : "hover:bg-sky-50 hover:text-[#1d9bf0]"}`}
                onClick={toggleBookmark}
                type="button"
              >
                {isSaved ? (
                  <RiBookmarkFill aria-hidden="true" size={18} />
                ) : (
                  <RiBookmarkLine aria-hidden="true" size={18} />
                )}
              </button>
            </div>
            {(likeError || deleteError || bookmarkError) && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {likeError || deleteError || bookmarkError}
              </p>
            )}
          </div>
        </div>
      </article>

      {replyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section
            aria-labelledby={`reply-title-${tweet.id}`}
            aria-modal="true"
            className="w-full max-w-[600px] rounded-2xl bg-white p-4 shadow-xl sm:p-6"
            role="dialog"
          >
            <div className="mb-5 flex items-center">
              <button
                aria-label="Cerrar"
                className="grid size-9 place-items-center rounded-full text-xl hover:bg-zinc-100"
                onClick={() => setReplyOpen(false)}
                type="button"
              >
                <RiCloseLine aria-hidden="true" />
              </button>
              <h2
                className="ml-4 text-xl font-bold"
                id={`reply-title-${tweet.id}`}
              >
                Responder
              </h2>
            </div>
            <div className="mb-5 flex gap-3">
              <Avatar
                name={displayName}
                photoURL={tweet.photoURL}
                size="size-10"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {displayName}{" "}
                  <span className="font-normal text-zinc-500">@{handle}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                  {tweet.text}
                </p>
              </div>
            </div>
            <form onSubmit={submitReply}>
              <label className="sr-only" htmlFor={`reply-text-${tweet.id}`}>
                Escribe tu respuesta
              </label>
              <textarea
                autoFocus
                className="min-h-28 w-full resize-y border-t border-zinc-200 py-4 text-lg outline-none placeholder:text-zinc-500"
                id={`reply-text-${tweet.id}`}
                maxLength={280}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Postea tu respuesta"
                value={replyText}
              />
              {replyError && (
                <p className="mb-3 text-sm text-red-600" role="alert">
                  {replyError}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  className="rounded-full bg-[#1d9bf0] px-5 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!replyText.trim() || replying}
                  type="submit"
                >
                  {replying ? "Respondiendo..." : "Responder"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
