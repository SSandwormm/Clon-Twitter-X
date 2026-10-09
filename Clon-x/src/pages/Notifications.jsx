import { useState } from "react";
import {
  RiChat3Fill,
  RiHeartFill,
  RiRepeatFill,
  RiUserFollowFill,
} from "react-icons/ri";
import notificationItems from "../data/notifications.json";
import Avatar from "../components/Avatar";

const tabs = ["Todas", "Verificadas", "Menciones"];

const notificationStyles = {
  like: { Icon: RiHeartFill, color: "text-rose-500" },
  follow: { Icon: RiUserFollowFill, color: "text-[#1d9bf0]" },
  repost: { Icon: RiRepeatFill, color: "text-emerald-500" },
  reply: { Icon: RiChat3Fill, color: "text-[#1d9bf0]" },
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("Todas");
  const visibleItems =
    activeTab === "Menciones"
      ? notificationItems.filter((item) => item.type === "reply")
      : activeTab === "Verificadas"
        ? []
        : notificationItems;

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md">
        <div className="flex h-[54px] items-center px-4">
          <h1 className="text-xl font-extrabold">Notificaciones</h1>
        </div>
        <nav
          aria-label="Filtros de notificaciones"
          className="grid h-[54px] grid-cols-3 border-b border-zinc-200"
        >
          {tabs.map((tab) => (
            <button
              aria-pressed={activeTab === tab}
              className="relative flex items-center justify-center text-sm hover:bg-zinc-100"
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              <span className={activeTab === tab ? "font-bold" : "text-zinc-500"}>
                {tab}
              </span>
              {activeTab === tab && (
                <span className="absolute bottom-0 h-1 w-14 rounded-full bg-[#1d9bf0]" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {visibleItems.length ? (
        <section aria-label={activeTab}>
          {visibleItems.map((item) => {
            const { Icon, color } = notificationStyles[item.type];
            return (
              <article
                className="flex gap-3 border-b border-zinc-100 px-4 py-4 transition hover:bg-zinc-50"
                key={item.id}
              >
                <div className={`ml-1 shrink-0 pt-1 ${color}`}>
                  <Icon aria-hidden="true" size={25} />
                </div>
                <div className="min-w-0 flex-1">
                  <Avatar name={item.name} size="size-9" />
                  <p className="mt-2 text-[15px] leading-5">
                    <span className="font-bold">{item.name}</span>{" "}
                    {item.text}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">@{item.username}</p>
                  {item.tweetPreview && (
                    <p className="mt-2 line-clamp-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-500">
                      {item.tweetPreview}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="mx-auto max-w-[360px] px-6 py-14">
          <h2 className="text-3xl font-extrabold">Aún no hay nada aquí</h2>
          <p className="mt-2 text-sm leading-5 text-zinc-500">
            {activeTab === "Verificadas"
              ? "Cuando una cuenta verificada interactúe contigo, aparecerá aquí."
              : "Cuando alguien te mencione, verás sus respuestas aquí."}
          </p>
        </div>
      )}
    </>
  );
}
