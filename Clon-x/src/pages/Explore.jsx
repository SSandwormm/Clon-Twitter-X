import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiFireLine,
  RiSearchLine,
} from "react-icons/ri";
import exploreData from "../data/explore.json";

const tabs = ["Para ti", "Tendencias", "Noticias", "Deportes", "Entretenimiento"];

function ExploreNewsCard({ item }) {
  return (
    <article className="flex min-h-[126px] items-center gap-3 border-b border-zinc-100 px-4 py-3 transition hover:bg-zinc-50">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">
          {item.category} · {item.time}
        </p>
        <h2 className="mt-1 text-[15px] leading-5 font-bold">{item.title}</h2>
        <p className="mt-2 text-xs text-zinc-500">{item.posts} posts</p>
      </div>
      <div
        aria-hidden="true"
        className={`grid size-[88px] shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.imageTone}`}
      >
        <RiFireLine className="text-black/40" size={30} />
      </div>
    </article>
  );
}

function TrendItem({ trend, index }) {
  return (
    <article className="border-b border-zinc-100 px-4 py-4 transition hover:bg-zinc-50">
      <p className="text-xs text-zinc-500">
        {index + 1} · {trend.category}
      </p>
      <h2 className="mt-1 text-[15px] font-bold">{trend.tag}</h2>
      <p className="mt-1 text-xs text-zinc-500">{trend.posts} posts</p>
    </article>
  );
}

export default function Explore() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const news =
    activeTab === "Para ti"
      ? exploreData.news
      : exploreData.news.filter((item) => item.category === activeTab);
  const trends = exploreData.trends;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        <div className="flex h-[54px] items-center gap-4 px-4">
          <h1 className="shrink-0 text-xl font-extrabold">Explorar</h1>
          <form
            className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-full bg-zinc-100 px-4 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1d9bf0]"
            onSubmit={(event) => {
              event.preventDefault();
              if (search.trim()) {
                navigate(`/buscar?q=${encodeURIComponent(search.trim())}`);
              }
            }}
          >
            <RiSearchLine aria-hidden="true" className="shrink-0 text-zinc-500" />
            <input
              aria-label="Buscar"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar"
              value={search}
            />
          </form>
        </div>
        <nav aria-label="Explorar" className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              aria-pressed={activeTab === tab}
              className="relative min-w-fit flex-1 px-4 py-4 text-sm hover:bg-zinc-100"
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              <span className={activeTab === tab ? "font-bold" : "text-zinc-500"}>
                {tab}
              </span>
              {activeTab === tab && (
                <span className="absolute inset-x-1/3 bottom-0 h-1 rounded-full bg-[#1d9bf0]" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "Tendencias" ? (
        <section aria-label="Tendencias">
          {trends.map((trend, index) => (
            <TrendItem index={index} key={trend.id} trend={trend} />
          ))}
        </section>
      ) : news.length ? (
        <section aria-label={`Noticias: ${activeTab}`}>
          {news.map((item) => (
            <ExploreNewsCard item={item} key={item.id} />
          ))}
        </section>
      ) : (
        <p className="px-5 py-12 text-center text-sm text-zinc-500">
          Todavía no hay noticias en esta categoría.
        </p>
      )}
    </>
  );
}
