import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useAuth } from "../context/auth-context";
import { db } from "../firebase/config";
import { useUserProfile } from "../hooks/useUserProfile";
import Tweet from "../components/Tweet";
import { getAllFakeTweets } from "../services/fakeTweets";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const { user } = useAuth();
  const { profile } = useUserProfile(user.uid);
  const [state, setState] = useState({
    tweets: [],
    loading: true,
    error: "",
  });
  const [exampleTweets, setExampleTweets] = useState([]);
  const [examplesReady, setExamplesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllFakeTweets()
      .then((examples) => {
        if (!cancelled) setExampleTweets(examples);
      })
      .catch(() => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            error: "No se pudieron cargar los posts de ejemplo.",
          }));
        }
      })
      .finally(() => {
        if (!cancelled) setExamplesReady(true);
      });

    const tweetsQuery = query(
      collection(db, "tweets"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      tweetsQuery,
      (snapshot) => {
        setState({
          tweets: snapshot.docs.map((tweetDoc) => ({
            id: tweetDoc.id,
            ...tweetDoc.data(),
          })),
          loading: false,
          error: "",
        });
      },
      () => {
        setState({
          tweets: [],
          loading: false,
          error: "No se pudieron cargar los resultados. Inténtalo de nuevo.",
        });
      },
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const searchTerms = normalizedSearch
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/^#/, ""));
  const matchingTweets = [...state.tweets, ...exampleTweets].filter((tweet) => {
    if (tweet.replyTo != null) return false;
    const text = (tweet.text || "").toLocaleLowerCase();
    if (normalizedSearch.startsWith("#")) {
      return text.includes(`#${searchTerms[0]}`);
    }
    return searchTerms.every((term) => text.includes(term));
  });

  return (
    <main className="mx-auto min-h-screen max-w-[600px] border-x border-zinc-200 bg-white text-black">
      <header className="sticky top-0 z-20 flex h-[54px] items-center gap-5 border-b border-zinc-200 bg-white/85 px-4 backdrop-blur-md">
        <Link
          aria-label="Volver al inicio"
          className="grid size-9 place-items-center rounded-full hover:bg-zinc-100"
          to="/"
        >
          ←
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Buscar</h1>
          <p className="truncate text-xs text-zinc-500">{search}</p>
        </div>
      </header>

      {state.loading || !examplesReady ? (
        <p className="p-8 text-center text-sm text-zinc-500">
          Buscando publicaciones...
        </p>
      ) : state.error ? (
        <p className="p-8 text-center text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : matchingTweets.length ? (
        matchingTweets.map((tweet) => (
          <Tweet key={tweet.id} profile={profile} tweet={tweet} user={user} />
        ))
      ) : (
        <div className="px-8 py-12 text-center">
          <h2 className="text-xl font-extrabold">No hay resultados</h2>
          <p className="mt-2 text-sm text-zinc-500">
            No encontramos publicaciones que coincidan con «{search}».
          </p>
        </div>
      )}
    </main>
  );
}
