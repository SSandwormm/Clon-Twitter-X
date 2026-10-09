import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RiCheckLine,
  RiMoreFill,
  RiSearchLine,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "../context/auth-context";
import { useUserProfile } from "../hooks/useUserProfile";
import { db } from "../firebase/config";
import Avatar from "./Avatar";
import { fakeTweetSources } from "../services/fakeTweets";

const exampleTrends = [
  { tag: "#Bogotá", count: 12400, category: "Tendencias · Colombia" },
  { tag: "#FelizMiércoles", count: 8321, category: "Tendencias" },
  { tag: "#React", count: 5610, category: "Tecnología · Tendencias" },
  {
    tag: "#SelecciónColombia",
    count: 3204,
    category: "Tendencias · Deportes",
  },
  { tag: "#Música", count: 2900, category: "Tendencias" },
  { tag: "#Cine", count: 2400, category: "Entretenimiento · Tendencias" },
  { tag: "#Tecnología", count: 2100, category: "Tecnología · Tendencias" },
  { tag: "#Deportes", count: 1800, category: "Tendencias" },
  { tag: "#Actualidad", count: 1500, category: "Tendencias" },
  { tag: "#Comunidad", count: 1100, category: "Tendencias" },
];

function formatPostCount(count) {
  if (count >= 1000) {
    return `${new Intl.NumberFormat("es", {
      maximumFractionDigits: 1,
    }).format(count / 1000)} mil posts`;
  }
  return `${count} posts`;
}

function getUsername(profile) {
  return profile.username || profile.displayName?.replace(/\s+/g, "").toLowerCase() || "usuario";
}

export default function RightPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile } = useUserProfile(user.uid);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState({
    query: "",
    users: [],
    hashtags: [],
  });
  const [tweets, setTweets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [moreTrends, setMoreTrends] = useState(false);
  const [hiddenTrends, setHiddenTrends] = useState([]);
  const [openTrendMenu, setOpenTrendMenu] = useState("");
  const [followBusy, setFollowBusy] = useState("");
  const [followError, setFollowError] = useState("");
  const [followedSuggestionIds, setFollowedSuggestionIds] = useState([]);

  useEffect(() => {
    const unsubscribeTweets = onSnapshot(
      collection(db, "tweets"),
      (snapshot) => {
        setTweets(
          snapshot.docs.map((tweetDoc) => ({
            id: tweetDoc.id,
            ...tweetDoc.data(),
          })),
        );
      },
      () => setLoadError("No se pudieron cargar las tendencias."),
    );
    const usersQuery = query(collection(db, "users"), limit(100));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        setUsers(
          snapshot.docs.map((userDoc) => ({
            uid: userDoc.id,
            ...userDoc.data(),
          })),
        );
      },
      () => setLoadError("No se pudieron cargar las sugerencias de cuentas."),
    );

    return () => {
      unsubscribeTweets();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = search.trim().replace(/^@/, "").toLocaleLowerCase();
    if (!normalizedQuery) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const matchingUsers = users
        .filter(
          (candidate) =>
            candidate.uid !== user.uid &&
            `${candidate.username || ""} ${candidate.displayName || ""}`
              .toLocaleLowerCase()
              .includes(normalizedQuery),
        )
        .slice(0, 4);
      const matchingHashtags = collectTrends(tweets)
        .map((trend) => trend.tag)
        .filter((tag) => tag.toLocaleLowerCase().includes(normalizedQuery))
        .slice(0, 3);

      setSearchResults({
        query: normalizedQuery,
        users: matchingUsers,
        hashtags: matchingHashtags,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search, tweets, users, user.uid]);

  const trends = useMemo(
    () => collectTrends(tweets, fakeTweetSources),
    [tweets],
  );
  const visibleTrends = useMemo(() => {
    const available = trends.filter((trend) => !hiddenTrends.includes(trend.tag));
    return available.slice(0, moreTrends ? 10 : 4);
  }, [hiddenTrends, moreTrends, trends]);
  const followed = profile?.following || [];
  const peopleToFollow = users
    .filter((candidate) => {
      const alreadyFollowed = followed.includes(candidate.uid);
      return (
        candidate.uid !== user.uid &&
        (!alreadyFollowed || followedSuggestionIds.includes(candidate.uid))
      );
    })
    .slice(0, 3);
  const showSearchDropdown =
    Boolean(search.trim()) && searchResults.query ===
      search.trim().replace(/^@/, "").toLocaleLowerCase();

  function goToSearch(value = search) {
    const queryValue = value.trim();
    if (!queryValue) return;
    navigate(`/buscar?q=${encodeURIComponent(queryValue)}`);
    setSearch("");
    setSearchResults({ query: "", users: [], hashtags: [] });
  }

  async function toggleFollow(candidate) {
    if (!profile || followBusy) return;
    const isFollowing = followed.includes(candidate.uid);
    setFollowBusy(candidate.uid);
    setFollowError("");
    const batch = writeBatch(db);
    const myProfileRef = doc(db, "users", user.uid);
    const candidateRef = doc(db, "users", candidate.uid);

    batch.update(myProfileRef, {
      following: isFollowing
        ? arrayRemove(candidate.uid)
        : arrayUnion(candidate.uid),
    });
    batch.update(candidateRef, {
      followers: isFollowing ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });

    try {
      await batch.commit();
      if (!isFollowing) {
        setFollowedSuggestionIds((ids) =>
          ids.includes(candidate.uid) ? ids : [...ids, candidate.uid],
        );
      }
    } catch {
      setFollowError("No se pudo actualizar el seguimiento. Inténtalo de nuevo.");
    } finally {
      setFollowBusy("");
    }
  }

  return (
    <>
    <aside className="sticky top-0 hidden h-screen overflow-y-auto px-4 py-2 lg:block xl:px-7">
      <div className="relative">
        <form
          className="flex h-[42px] items-center gap-3 rounded-full bg-zinc-100 px-4 text-zinc-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1d9bf0]"
          onSubmit={(event) => {
            event.preventDefault();
            goToSearch();
          }}
        >
          <RiSearchLine aria-hidden="true" size={19} />
          <input
            aria-label="Buscar"
            className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-zinc-500"
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchResults({ query: "", users: [], hashtags: [] });
            }}
            placeholder="Buscar"
            type="search"
            value={search}
          />
        </form>

        {showSearchDropdown && (
          <div className="absolute top-full right-0 left-0 z-40 mt-1 overflow-hidden rounded-xl bg-white shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            {searchResults.users.map((candidate) => (
              <Link
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50"
                key={candidate.uid}
                onClick={() => setSearch("")}
                to={`/${getUsername(candidate)}`}
              >
                <Avatar
                  name={candidate.displayName}
                  photoURL={candidate.photoURL}
                  size="size-9"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {candidate.displayName || getUsername(candidate)}
                  </span>
                  <span className="block truncate text-sm text-zinc-500">
                    @{getUsername(candidate)}
                  </span>
                </span>
              </Link>
            ))}
            {searchResults.hashtags.map((tag) => (
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-zinc-50"
                key={tag}
                onClick={() => goToSearch(tag)}
                type="button"
              >
                <RiSearchLine aria-hidden="true" className="text-zinc-500" />
                Buscar {tag}
              </button>
            ))}
            <button
              className="w-full border-t border-zinc-100 px-4 py-3 text-left text-sm text-[#1d9bf0] hover:bg-zinc-50"
              onClick={() => goToSearch()}
              type="button"
            >
              Buscar «{search.trim()}»
            </button>
          </div>
        )}
      </div>

      <section className="mt-4 rounded-2xl border border-zinc-200 p-4">
        <h2 className="text-xl font-extrabold">Suscríbete a Premium</h2>
        <p className="mt-2 text-sm leading-5">
          Suscríbete para disfrutar de nuevas funciones y recibir una parte de
          los ingresos.
        </p>
        <button
          className="mt-3 rounded-full bg-[#1d9bf0] px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600"
          onClick={() => setPremiumOpen(true)}
          type="button"
        >
          Suscribirse
        </button>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
        <h2 className="px-4 pt-3 pb-2 text-xl font-extrabold">
          Qué está pasando
        </h2>
        {loadError && (
          <p className="px-4 py-2 text-xs text-red-600" role="alert">
            {loadError}
          </p>
        )}
        {visibleTrends.map((trend) => (
          <div
            className="relative flex items-start justify-between gap-2 px-4 py-3 transition hover:bg-zinc-50"
            key={trend.tag}
          >
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => goToSearch(trend.tag)}
              type="button"
            >
              <span className="block truncate text-xs text-zinc-500">
                {trend.category}
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold">
                {trend.tag}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                {formatPostCount(trend.count)}
              </span>
            </button>
            <button
              aria-label={`Más opciones para ${trend.tag}`}
              aria-expanded={openTrendMenu === trend.tag}
              className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-sky-50 hover:text-[#1d9bf0]"
              onClick={() =>
                setOpenTrendMenu((open) => (open === trend.tag ? "" : trend.tag))
              }
              type="button"
            >
              <RiMoreFill aria-hidden="true" size={18} />
            </button>
            {openTrendMenu === trend.tag && (
              <div className="absolute top-10 right-3 z-10 w-36 rounded-lg bg-white py-1 shadow-[0_0_12px_rgba(0,0,0,0.2)]">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                  onClick={() => {
                    setHiddenTrends((hidden) =>
                      hidden.includes(trend.tag)
                        ? hidden
                        : [...hidden, trend.tag],
                    );
                    setOpenTrendMenu("");
                  }}
                  type="button"
                >
                  No me interesa
                </button>
              </div>
            )}
          </div>
        ))}
        {visibleTrends.length === 0 && (
          <p className="px-4 py-3 text-sm text-zinc-500">
            No hay tendencias disponibles.
          </p>
        )}
        {trends.filter((trend) => !hiddenTrends.includes(trend.tag)).length >
          4 && (
          <button
            className="w-full px-4 py-4 text-left text-sm text-[#1d9bf0] hover:bg-zinc-50"
            onClick={() => setMoreTrends((expanded) => !expanded)}
            type="button"
          >
            {moreTrends ? "Mostrar menos" : "Mostrar más"}
          </button>
        )}
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
        <h2 className="px-4 pt-3 pb-2 text-xl font-extrabold">
          A quién seguir
        </h2>
        {peopleToFollow.map((candidate) => {
          const username = getUsername(candidate);
          return (
            <div
              className="flex items-center gap-2 px-4 py-3 hover:bg-zinc-50"
              key={candidate.uid}
            >
              <Link className="shrink-0" to={`/${username}`}>
                <Avatar
                  name={candidate.displayName}
                  photoURL={candidate.photoURL}
                  size="size-10"
                />
              </Link>
              <Link className="min-w-0 flex-1" to={`/${username}`}>
                <span className="block truncate text-sm font-bold hover:underline">
                  {candidate.displayName || username}
                </span>
                <span className="block truncate text-sm text-zinc-500">
                  @{username}
                </span>
              </Link>
              <button
                className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${followed.includes(candidate.uid) ? "border border-zinc-300 bg-white text-black" : "bg-black text-white hover:bg-zinc-800"}`}
                disabled={!profile || followBusy === candidate.uid}
                onClick={() => toggleFollow(candidate)}
                type="button"
              >
                {followed.includes(candidate.uid) ? (
                  <>
                    <RiCheckLine aria-hidden="true" />
                    Siguiendo
                  </>
                ) : followBusy === candidate.uid ? (
                  "..."
                ) : (
                  "Seguir"
                )}
              </button>
            </div>
          );
        })}
        {!peopleToFollow.length && (
          <p className="px-4 py-3 text-sm text-zinc-500">
            Ya sigues a todas las cuentas sugeridas.
          </p>
        )}
        {followError && (
          <p className="px-4 pb-3 text-xs text-red-600" role="alert">
            {followError}
          </p>
        )}
      </section>

      <p className="px-4 py-4 text-xs leading-5 text-zinc-500">
        Términos de Servicio · Política de Privacidad · Política de cookies ·
        Accesibilidad · © 2026 X Corp.
        <RiVerifiedBadgeFill className="ml-1 inline text-[#1d9bf0]" size={13} />
      </p>

    </aside>
    {premiumOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <section
          aria-labelledby="premium-modal-title"
          aria-modal="true"
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
        >
          <h2 className="text-xl font-bold" id="premium-modal-title">
            Premium no disponible en esta versión
          </h2>
          <button
            className="mt-5 w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-zinc-800"
            onClick={() => setPremiumOpen(false)}
            type="button"
          >
            Cerrar
          </button>
        </section>
      </div>
    )}
    </>
  );
}

function collectTrends(tweets, examplePosts) {
  const counts = new Map();
  const hashtagPattern = /#[\p{L}\p{N}_]+/gu;

  [...tweets, ...examplePosts.map((post) => ({ text: post.body }))].forEach(
    (tweet) => {
    if (tweet.replyTo != null) return;
    const seenInTweet = new Set();
    for (const match of tweet.text?.matchAll(hashtagPattern) || []) {
      const tag = match[0];
      const key = tag.toLocaleLowerCase();
      if (seenInTweet.has(key)) continue;
      seenInTweet.add(key);
      const existing = counts.get(key);
      counts.set(key, {
        tag: existing?.tag || tag,
        count: (existing?.count || 0) + 1,
        category: "Tendencias",
        },
      );
    }
  });

  const realTrends = [...counts.values()].sort(
    (trendA, trendB) => trendB.count - trendA.count,
  );
  const realTags = new Set(realTrends.map((trend) => trend.tag.toLowerCase()));
  const fallbackTrends = exampleTrends.filter(
    (trend) => !realTags.has(trend.tag.toLowerCase()),
  );

  return [...realTrends, ...fallbackTrends];
}
