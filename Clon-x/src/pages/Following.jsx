import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import suggestions from "../data/connections.json";

export default function Following() {
  const [following, setFollowing] = useState([]);

  function toggleFollow(id) {
    setFollowing((current) =>
      current.includes(id)
        ? current.filter((followedId) => followedId !== id)
        : [...current, id],
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[54px] items-center border-b border-zinc-200 bg-white/85 px-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold">Conectar</h1>
      </header>
      <h2 className="border-b border-zinc-200 px-4 py-4 text-xl font-extrabold">
        Cuentas sugeridas
      </h2>
      {suggestions.map((candidate) => {
        const username =
          candidate.username ||
          candidate.displayName?.replace(/\s+/g, "").toLowerCase() ||
          "usuario";
        const isFollowing = following.includes(candidate.id);
        return (
          <article
            className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 hover:bg-zinc-50"
            key={candidate.uid}
          >
            <Link className="shrink-0" to={`/${username}`}>
              <Avatar
                name={candidate.displayName}
                photoURL={candidate.photoURL}
                size="size-11"
              />
            </Link>
            <Link className="min-w-0 flex-1" to={`/${username}`}>
              <span className="block truncate text-sm font-bold hover:underline">
                {candidate.displayName || username}
              </span>
              <span className="block truncate text-sm text-zinc-500">
                @{username}
              </span>
              {candidate.bio && (
                <span className="mt-1 block line-clamp-2 text-sm">
                  {candidate.bio}
                </span>
              )}
            </Link>
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold disabled:opacity-60 ${isFollowing ? "border border-zinc-300 bg-white text-black" : "bg-black text-white hover:bg-zinc-800"}`}
              aria-pressed={isFollowing}
              onClick={() => toggleFollow(candidate.id)}
              type="button"
            >
              {isFollowing ? "Siguiendo" : "Seguir"}
            </button>
          </article>
        );
      })}
      {!suggestions.length && !error && (
        <p className="p-8 text-center text-sm text-zinc-500">
          No hay cuentas para mostrar todavía.
        </p>
      )}
    </>
  );
}
