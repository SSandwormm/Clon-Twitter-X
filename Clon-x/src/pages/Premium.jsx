import { useState } from "react";
import { RiCheckLine, RiCloseLine, RiVerifiedBadgeFill } from "react-icons/ri";

const planFeatures = {
  Básico: ["Insignia de verificación", "Publicaciones más largas", "Carpetas de elementos guardados"],
  Premium: ["Todo lo de Básico", "Menos anuncios", "Prioridad en respuestas", "Estadísticas de publicaciones"],
  "Premium+": ["Todo lo de Premium", "Sin anuncios", "Artículos", "Acceso a nuevas funciones"],
};

function SubscribeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section
        aria-labelledby="subscribe-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
      >
        <button
          aria-label="Cerrar"
          className="ml-auto grid size-9 place-items-center rounded-full hover:bg-zinc-100"
          onClick={onClose}
          type="button"
        >
          <RiCloseLine size={21} />
        </button>
        <h2 className="mt-2 text-2xl font-extrabold" id="subscribe-title">
          No disponible en esta versión
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Las suscripciones a Premium estarán disponibles próximamente.
        </p>
        <button
          className="mt-6 w-full rounded-full bg-black px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800"
          onClick={onClose}
          type="button"
        >
          Cerrar
        </button>
      </section>
    </div>
  );
}

export default function Premium() {
  const [annual, setAnnual] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const prices = annual
    ? { Básico: "$3.500", Premium: "$15.000", "Premium+": "$38.000" }
    : { Básico: "$4.000", Premium: "$18.000", "Premium+": "$45.000" };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[54px] items-center border-b border-zinc-200 bg-white/85 px-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold">Premium</h1>
      </header>
      <div className="px-4 py-5">
        <h2 className="text-2xl font-extrabold">Elige tu plan</h2>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 p-3">
          <div>
            <p className="text-sm font-bold">Facturación anual</p>
            <p className="text-xs text-zinc-500">Ahorra con un plan anual</p>
          </div>
          <button
            aria-checked={annual}
            aria-label="Facturación anual"
            className={`relative h-7 w-12 rounded-full transition ${annual ? "bg-[#1d9bf0]" : "bg-zinc-300"}`}
            onClick={() => setAnnual((isAnnual) => !isAnnual)}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white transition-all ${annual ? "left-6" : "left-1"}`}
            />
          </button>
        </div>
        <section className="mt-4 space-y-3">
          {Object.entries(planFeatures).map(([name, features]) => (
            <article
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-400"
              key={name}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-extrabold">
                  {name}
                  {name === "Premium+" && (
                    <RiVerifiedBadgeFill
                      aria-label="Premium Plus"
                      className="text-[#1d9bf0]"
                      size={17}
                    />
                  )}
                </h3>
                <p className="text-right">
                  <span className="block text-xl font-extrabold">{prices[name]}</span>
                  <span className="text-xs text-zinc-500">COP / mes</span>
                </p>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {annual ? "Facturado anualmente" : "Cancela cuando quieras"}
              </p>
              <ul className="mt-4 space-y-2">
                {features.map((feature) => (
                  <li className="flex items-start gap-2 text-sm" key={feature}>
                    <RiCheckLine
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-emerald-600"
                      size={17}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800"
                onClick={() => setModalOpen(true)}
                type="button"
              >
                Suscribirse
              </button>
            </article>
          ))}
        </section>
      </div>
      {modalOpen && <SubscribeModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
