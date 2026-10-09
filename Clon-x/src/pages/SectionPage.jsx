export default function SectionPage({ title, description }) {
  return (
    <>
      <header className="sticky top-0 z-20 flex h-[54px] items-center border-b border-zinc-200 bg-white/85 px-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold">{title}</h1>
      </header>
      <div className="mx-auto max-w-[360px] px-6 py-14">
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <p className="mt-2 text-sm leading-5 text-zinc-500">
          {description || "Esta sección está lista para que descubras más en X."}
        </p>
      </div>
    </>
  );
}
