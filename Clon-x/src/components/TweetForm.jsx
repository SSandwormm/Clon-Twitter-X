import { useState } from "react";
import {
  RiEmotionLine,
  RiFileGifLine,
  RiImageLine,
  RiMapPinLine,
} from "react-icons/ri";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import Avatar from "./Avatar";

const composeIcons = [
  { label: "Añadir imagen", Icon: RiImageLine },
  { label: "Añadir GIF", Icon: RiFileGifLine },
  { label: "Añadir emoji", Icon: RiEmotionLine },
  { label: "Añadir ubicación", Icon: RiMapPinLine },
];

export default function TweetForm({ user, profile }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || !profile || posting) return;

    setPosting(true);
    setError("");

    try {
      await addDoc(collection(db, "tweets"), {
        text: trimmedText,
        uid: user.uid,
        username:
          profile?.username ||
          user.displayName?.replace(/\s+/g, "").toLowerCase() ||
          user.email ||
          "usuario",
        displayName: profile?.displayName || user.displayName || "Usuario",
        photoURL: profile?.photoURL || user.photoURL || "",
        createdAt: serverTimestamp(),
        likes: [],
        replyCount: 0,
        replyTo: null,
      });
      setText("");
    } catch {
      setError("No se pudo publicar el post. Inténtalo de nuevo.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <form
      className="border-b border-zinc-200 px-4 pt-4 pb-3"
      onSubmit={handleSubmit}
    >
      <div className="flex gap-3">
        <Avatar
          name={user.displayName || user.email}
          photoURL={profile?.photoURL || user.photoURL}
          size="size-10"
        />
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="tweet-text">
            ¿Qué está pasando?
          </label>
          <textarea
            className="min-h-[68px] w-full resize-none bg-transparent py-2 text-xl outline-none placeholder:text-zinc-500"
            id="tweet-text"
            maxLength={280}
            onChange={(event) => setText(event.target.value)}
            placeholder="¿Qué está pasando?"
            value={text}
          />
          <div className="flex min-h-10 items-center justify-between">
            <div className="flex items-center gap-1 text-[#1d9bf0]">
              {composeIcons.map(({ label, Icon }) => (
                <button
                  aria-label={label}
                  className="grid size-8 place-items-center rounded-full transition hover:bg-sky-50"
                  key={label}
                  type="button"
                >
                  <Icon aria-hidden="true" size={18} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {text.length > 0 && (
                <span
                  aria-label={`${text.length} de 280 caracteres`}
                  className={`text-xs ${text.length >= 260 ? "text-orange-500" : "text-zinc-500"}`}
                >
                  {text.length}/280
                </span>
              )}
              <button
                className="rounded-full bg-[#1d9bf0] px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                disabled={!text.trim() || !profile || posting}
                type="submit"
              >
                {posting ? "Publicando..." : "Postear"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}