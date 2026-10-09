import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getFakeTweetPage, hasMoreFakeTweets } from "../services/fakeTweets";
import Tweet from "./Tweet";

function sortNewestFirst(tweets) {
  return tweets.sort(
    (tweetA, tweetB) =>
      timestampMillis(tweetB.createdAt) - timestampMillis(tweetA.createdAt),
  );
}

function timestampMillis(timestamp) {
  if (timestamp instanceof Date) return timestamp.getTime();
  return timestamp?.toMillis?.() || 0;
}

export default function Feed({
  user,
  profile,
  followingOnly = false,
  followingUids = [],
  authorUid,
  likedByUid,
  repliesOnly = false,
  multimediaOnly = false,
  emptyMessage,
  includeExamples = false,
}) {
  const [feedState, setFeedState] = useState({
    key: "",
    tweets: [],
    error: "",
  });
  const followKey = JSON.stringify(
    [...new Set(followingUids)]
      .filter((uid) => uid && uid !== user.uid)
      .sort(),
  );
  const feedKey = JSON.stringify([
    followingOnly,
    followKey,
    authorUid,
    likedByUid,
    repliesOnly,
    multimediaOnly,
    user.uid,
  ]);
  const followedUids = JSON.parse(followKey);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [fakeTweets, setFakeTweets] = useState([]);
  const [fakePage, setFakePage] = useState(0);
  const [fakeLoading, setFakeLoading] = useState(includeExamples);
  const [fakeError, setFakeError] = useState("");

  useEffect(() => {
    if (!includeExamples || fakePage !== 0) return undefined;
    let cancelled = false;
    getFakeTweetPage(0)
      .then((pageTweets) => {
        if (cancelled) return;
        setFakeTweets(sortNewestFirst(pageTweets));
        setFakePage(1);
        setFakeError("");
      })
      .catch(() => {
        if (!cancelled) {
          setFakeError("No se pudieron cargar los posts de ejemplo.");
        }
      })
      .finally(() => {
        if (!cancelled) setFakeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fakePage, includeExamples]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (
      !includeExamples ||
      fakePage === 0 ||
      fakeLoading ||
      fakeError ||
      !hasMoreFakeTweets(fakePage) ||
      !sentinel
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setFakeLoading(true);
        getFakeTweetPage(fakePage)
          .then((pageTweets) => {
            setFakeTweets((currentTweets) =>
              sortNewestFirst([...currentTweets, ...pageTweets]),
            );
            setFakePage((currentPage) => currentPage + 1);
            setFakeError("");
          })
          .catch(() => {
            setFakeError("No se pudieron cargar más posts de ejemplo.");
          })
          .finally(() => {
            loadingMoreRef.current = false;
            setFakeLoading(false);
          });
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fakePage, fakeLoading, fakeError, includeExamples]);

  useEffect(() => {
    let queries = [];
    if (followingOnly) {
      const queryFollowingUids = JSON.parse(followKey);
      if (!queryFollowingUids.length) {
        return undefined;
      }
      for (let index = 0; index < queryFollowingUids.length; index += 30) {
        queries.push(
          query(
            collection(db, "tweets"),
            where("uid", "in", queryFollowingUids.slice(index, index + 30)),
          ),
        );
      }
    } else if (authorUid) {
      queries = [
        query(collection(db, "tweets"), where("uid", "==", authorUid)),
      ];
    } else if (likedByUid) {
      queries = [
        query(
          collection(db, "tweets"),
          where("likes", "array-contains", likedByUid),
        ),
      ];
    } else {
      queries = [query(collection(db, "tweets"), orderBy("createdAt", "desc"))];
    }

    const snapshotsByQuery = new Map();
    const unsubscribers = queries.map((tweetsQuery, index) =>
      onSnapshot(
        tweetsQuery,
        (snapshot) => {
          snapshotsByQuery.set(
            index,
            snapshot.docs.map((tweetDoc) => ({
              id: tweetDoc.id,
              ...tweetDoc.data(),
            })),
          );
          const mergedTweets = new Map();
          snapshotsByQuery.forEach((queryTweets) => {
            queryTweets.forEach((tweet) => mergedTweets.set(tweet.id, tweet));
          });
          const tweets = [...mergedTweets.values()].filter((tweet) => {
            if (repliesOnly) return tweet.replyTo != null;
            if (multimediaOnly) {
              return Boolean(
                tweet.imageURL ||
                  tweet.imageUrl ||
                  tweet.videoURL ||
                  tweet.videoUrl ||
                  (Array.isArray(tweet.media) && tweet.media.length),
              );
            }
            return likedByUid ? true : tweet.replyTo == null;
          });
          setFeedState({
            key: feedKey,
            tweets: sortNewestFirst(tweets),
            error: "",
          });
        },
        () => {
          setFeedState({
            key: feedKey,
            tweets: [],
            error: "No se pudo cargar el feed. Inténtalo de nuevo.",
          });
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [
    authorUid,
    feedKey,
    followKey,
    followingOnly,
    likedByUid,
    multimediaOnly,
    repliesOnly,
  ]);

  const loading =
    feedState.key !== feedKey && !(followingOnly && !followedUids.length);
  const tweets =
    followingOnly && !followedUids.length
      ? []
      : feedState.key === feedKey
        ? feedState.tweets
        : [];
  const error = feedState.key === feedKey ? feedState.error : "";

  if (error) {
    return (
      <p className="p-8 text-center text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div>
      {loading && <FeedSkeleton />}
      {!loading &&
        !tweets.length &&
        !includeExamples && (
          <p className="p-8 text-center text-sm text-zinc-500">
            {emptyMessage ||
              (followingOnly
                ? "Todavía no sigues a nadie."
                : "Todavía no hay posts. ¡Sé el primero en postear!")}
          </p>
        )}
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} profile={profile} tweet={tweet} user={user} />
      ))}
      {includeExamples &&
        fakeTweets.map((tweet) => (
          <Tweet key={tweet.id} profile={profile} tweet={tweet} user={user} />
        ))}
      {fakeError && (
        <div className="px-4 py-5 text-center">
          <p className="text-sm text-red-600" role="alert">
            {fakeError}
          </p>
          <button
            className="mt-2 text-sm font-semibold text-[#1d9bf0] hover:underline"
            onClick={() => {
              setFakeError("");
              setFakeLoading(true);
              getFakeTweetPage(fakePage)
                .then((pageTweets) => {
                  setFakeTweets((currentTweets) =>
                    sortNewestFirst([...currentTweets, ...pageTweets]),
                  );
                  setFakePage((currentPage) => currentPage + 1);
                })
                .catch(() =>
                  setFakeError("No se pudieron cargar más posts de ejemplo."),
                )
                .finally(() => setFakeLoading(false));
            }}
            type="button"
          >
            Reintentar
          </button>
        </div>
      )}
      {includeExamples &&
        (fakeLoading || (fakePage === 0 && !fakeError)) && <FeedSkeleton />}
      {includeExamples && hasMoreFakeTweets(fakePage) && (
        <div aria-hidden="true" className="h-2" ref={loadMoreRef} />
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div aria-label="Cargando posts" className="animate-pulse border-b border-zinc-200 px-4 py-4">
      <div className="flex gap-3">
        <div className="size-10 shrink-0 rounded-full bg-zinc-200" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3 w-2/5 rounded bg-zinc-200" />
          <div className="h-3 w-full rounded bg-zinc-200" />
          <div className="h-3 w-4/5 rounded bg-zinc-200" />
          <div className="h-3 w-1/3 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
