import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RiArrowLeftLine } from "react-icons/ri";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import Tweet from "../components/Tweet";
import { useAuth } from "../context/auth-context";
import { db } from "../firebase/config";
import { useUserProfile } from "../hooks/useUserProfile";

export default function TweetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { profile } = useUserProfile(user.uid);
  const [tweetState, setTweetState] = useState({ id: null, tweet: null });
  const [replies, setReplies] = useState([]);
  const [requestState, setRequestState] = useState({
    id: null,
    error: "",
  });

  useEffect(() => {
    const unsubscribeTweet = onSnapshot(
      doc(db, "tweets", id),
      (snapshot) => {
        setTweetState({
          id,
          tweet: snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        });
        setRequestState({ id, error: "" });
      },
      () => {
        setRequestState({ id, error: "No se pudo cargar el post." });
      },
    );
    const repliesQuery = query(
      collection(db, "tweets"),
      where("replyTo", "==", id),
    );
    const unsubscribeReplies = onSnapshot(
      repliesQuery,
      (snapshot) => {
        setReplies(
          snapshot.docs
            .map((replyDoc) => ({ id: replyDoc.id, ...replyDoc.data() }))
            .sort(
              (replyA, replyB) =>
                (replyA.createdAt?.toMillis?.() || 0) -
                (replyB.createdAt?.toMillis?.() || 0),
            ),
        );
      },
      () =>
        setRequestState({
          id,
          error: "No se pudieron cargar las respuestas.",
        }),
    );

    return () => {
      unsubscribeTweet();
      unsubscribeReplies();
    };
  }, [id]);

  const loading = tweetState.id !== id;
  const tweet = tweetState.id === id ? tweetState.tweet : null;
  const error = requestState.id === id ? requestState.error : "";

  return (
    <main className="mx-auto min-h-screen max-w-[600px] border-x border-zinc-200 bg-white text-black">
      <header className="sticky top-0 z-20 flex h-[54px] items-center gap-6 bg-white/85 px-4 backdrop-blur-md">
        <Link
          aria-label="Volver"
          className="grid size-9 place-items-center rounded-full hover:bg-zinc-100"
          to="/"
        >
          <RiArrowLeftLine aria-hidden="true" size={22} />
        </Link>
        <h1 className="text-lg font-bold">Post</h1>
      </header>

      {loading ? (
        <p className="p-8 text-center text-zinc-500">Cargando post...</p>
      ) : error ? (
        <p className="p-8 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : !tweet ? (
        <p className="p-8 text-center text-zinc-500">
          Este post ya no está disponible.
        </p>
      ) : (
        <>
          <Tweet profile={profile} tweet={tweet} user={user} />
          {replies.length ? (
            replies.map((reply) => (
              <Tweet
                key={reply.id}
                profile={profile}
                tweet={reply}
                user={user}
              />
            ))
          ) : (
            <p className="p-8 text-center text-sm text-zinc-500">
              Todavía no hay respuestas.
            </p>
          )}
        </>
      )}
    </main>
  );
}
