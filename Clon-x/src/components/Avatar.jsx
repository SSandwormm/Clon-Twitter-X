export default function Avatar({ name, photoURL, size = "size-10" }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 font-bold text-sky-700`}
    >
      {photoURL ? (
        <img alt="" className="size-full object-cover" src={photoURL} />
      ) : (
        initial
      )}
    </div>
  );
}
