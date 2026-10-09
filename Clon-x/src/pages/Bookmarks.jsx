import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { RiBookmarkLine } from "react-icons/ri";
import { useAuth } from "../context/auth-context";
import { db } from "../firebase/config";
import { useUserProfile } from "../hooks/useUserProfile";
import Tweet from "../components/Tweet";

export default function Bookmarks() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user.uid);
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bookmarkIds = profile?.bookmarks || [];
  const username =
    profile?.username ||
    user.email?.split("@")[0] ||
    user.displayName?.replace(/\s+/g, "").toLowerCase() ||
    "usuario";

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tweets"),
      (snapshot) => {
        setTweets(
          snapshot.docs
            .map((tweetDoc) => ({ id: tweetDoc.id, ...tweetDoc.data() }))
            .sort((first, second) => {
              const firstDate = first.createdAt?.toMillis?.() || 0;
              const secondDate = second.createdAt?.toMillis?.() || 0;
              return secondDate - firstDate;
            }),
        );
        setError("");
        setLoading(false);
      },
      () => {
        setError("No se pudieron cargar tus posts guardados.");
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const savedTweetIds = new Set(bookmarkIds);
  const savedTweets = tweets.filter((tweet) => savedTweetIds.has(tweet.id));

  return (
    <>
      <header className="sticky top-0 z-20 h-[54px] border-b border-zinc-200 bg-white/85 px-4 pt-2 backdrop-blur-md">
        <h1 className="truncate text-lg font-bold">
          {profile?.displayName || user.displayName || "Perfil"}
        </h1>
        <p className="truncate text-xs text-zinc-500">
          @{username.replace(/^@/, "")}
        </p>
      </header>
      {error ? (
        <p className="p-5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : profileLoading || loading ? (
        <p className="p-8 text-center text-sm text-zinc-500">
          Cargando tus posts guardados...
        </p>
      ) : savedTweets.length ? (
        savedTweets.map((tweet) => (
          <Tweet
            key={tweet.id}
            profile={profile}
            tweet={tweet}
            user={user}
          />
        ))
      ) : (
        <div className="mx-auto max-w-[360px] px-6 py-14">
          <RiBookmarkLine aria-hidden="true" className="mb-4 text-[#1d9bf0]" size={34} />
          <h2 className="text-3xl font-extrabold">Guarda posts para después</h2>
          <p className="mt-2 text-sm leading-5 text-zinc-500">
            No dejes que los posts interesantes se pierdan en el feed. Guárdalos
            para encontrarlos fácilmente más adelante.
          </p>
        </div>
      )}
    </>
  );
}
