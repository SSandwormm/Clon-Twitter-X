import { useEffect, useRef, useState } from "react";
import { RiArrowLeftLine, RiSearchLine, RiSendPlaneFill } from "react-icons/ri";
import Avatar from "../components/Avatar";
import initialConversations from "../data/conversations.json";

export default function Chat() {
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState(() =>
    Object.fromEntries(
      initialConversations.map((conversation) => [
        conversation.id,
        conversation.messages,
      ]),
    ),
  );
  const [autoReplyState, setAutoReplyState] = useState({});
  const timers = useRef(new Set());
  const activeConversation = initialConversations.find(
    (conversation) => conversation.id === activeId,
  );
  const activeMessages = activeId ? messagesByConversation[activeId] || [] : [];
  const filteredConversations = initialConversations.filter((conversation) =>
    `${conversation.name} ${conversation.username}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeConversation) return;
    const conversationId = activeConversation.id;
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: [
        ...(current[conversationId] || []),
        { id: `local-${Date.now()}`, from: "me", text },
      ],
    }));
    setDraft("");
    setAutoReplyState((current) => ({ ...current, [conversationId]: true }));
    const timer = window.setTimeout(() => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [
          ...(current[conversationId] || []),
          {
            id: `auto-${Date.now()}`,
            from: "them",
            text: "¡Gracias por tu mensaje! Te responderé pronto.",
          },
        ],
      }));
      setAutoReplyState((current) => ({ ...current, [conversationId]: false }));
      timers.current.delete(timer);
    }, 2000);
    timers.current.add(timer);
  }

  return (
    <div className="flex h-[calc(100dvh-112px)] min-h-[400px] lg:h-screen">
      <aside
        className={`${activeId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-zinc-200 md:w-[230px] lg:w-[280px]`}
      >
        <header className="sticky top-0 z-10 flex h-[54px] items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md">
          <h1 className="text-xl font-extrabold">Mensajes</h1>
        </header>
        <label className="mx-3 my-3 flex h-10 items-center gap-2 rounded-full bg-zinc-100 px-3 focus-within:ring-1 focus-within:ring-[#1d9bf0]">
          <RiSearchLine aria-hidden="true" className="shrink-0 text-zinc-500" />
          <input
            aria-label="Buscar conversaciones"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar personas"
            value={search}
          />
        </label>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const messages = messagesByConversation[conversation.id] || [];
            const lastMessage = messages.at(-1)?.text || conversation.lastMessage;
            return (
              <button
                aria-pressed={activeId === conversation.id}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-zinc-100 ${activeId === conversation.id ? "bg-zinc-100" : ""}`}
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                type="button"
              >
                <Avatar
                  name={conversation.name}
                  photoURL={conversation.photoURL}
                  size="size-11"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">
                      {conversation.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {conversation.time}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-zinc-500">
                    {lastMessage}
                  </span>
                </span>
              </button>
            );
          })}
          {!filteredConversations.length && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              No encontramos conversaciones.
            </p>
          )}
        </div>
      </aside>

      <section
        aria-label="Conversación"
        className={`${activeId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}
      >
        {activeConversation ? (
          <>
            <header className="flex h-[54px] shrink-0 items-center gap-3 border-b border-zinc-200 px-3">
              <button
                aria-label="Volver a conversaciones"
                className="grid size-9 place-items-center rounded-full hover:bg-zinc-100 md:hidden"
                onClick={() => setActiveId("")}
                type="button"
              >
                <RiArrowLeftLine size={21} />
              </button>
              <Avatar
                name={activeConversation.name}
                photoURL={activeConversation.photoURL}
                size="size-9"
              />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">
                  {activeConversation.name}
                </h2>
                <p className="truncate text-xs text-zinc-500">
                  @{activeConversation.username}
                </p>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
              <p className="my-auto text-center text-xs text-zinc-500">
                Este es el comienzo de tu conversación con{" "}
                {activeConversation.name}.
              </p>
              {activeMessages.map((message) => (
                <div
                  className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
                  key={message.id}
                >
                  <p
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${message.from === "me" ? "rounded-br-md bg-[#1d9bf0] text-white" : "rounded-bl-md bg-zinc-100 text-black"}`}
                  >
                    {message.text}
                  </p>
                </div>
              ))}
              {autoReplyState[activeId] && (
                <p className="text-xs text-zinc-500">Escribiendo...</p>
              )}
            </div>
            <form
              className="m-3 flex min-h-11 items-center gap-2 rounded-full bg-zinc-100 px-3 focus-within:ring-1 focus-within:ring-[#1d9bf0]"
              onSubmit={sendMessage}
            >
              <input
                aria-label="Escribe un mensaje"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escribe un mensaje"
                value={draft}
              />
              <button
                aria-label="Enviar mensaje"
                className="grid size-8 shrink-0 place-items-center rounded-full text-[#1d9bf0] transition hover:bg-sky-100 disabled:text-zinc-400"
                disabled={!draft.trim()}
                type="submit"
              >
                <RiSendPlaneFill size={19} />
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto max-w-[300px] px-5">
            <h2 className="text-3xl font-extrabold">Selecciona un mensaje</h2>
            <p className="mt-2 text-sm leading-5 text-zinc-500">
              Elige una conversación para ver tus mensajes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
