import { useState } from "react";
import { Link } from "react-router-dom";
import { RiMoreLine } from "react-icons/ri";
import Avatar from "./Avatar";

function XLogo({ className = "" }) {
  return (
    <svg
      aria-label="X"
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Sidebar({ navigation, onLogout, profile, user }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const displayName = profile?.displayName || user.displayName || user.email || "Usuario";
  const username =
    profile?.username ||
    (user.displayName || user.email?.split("@")[0] || "usuario")
      .replace(/\s+/g, "")
      .toLowerCase();

  return (
    <aside className="sticky top-0 hidden h-screen flex-col px-2 py-2 lg:flex xl:px-3">
      <div className="flex size-12 items-center justify-center rounded-full transition hover:bg-zinc-100">
        <XLogo className="size-7" />
      </div>

      <nav aria-label="Navegación principal" className="mt-2 space-y-1">
        {navigation.map(({ label, path, Icon, ActiveIcon, active }) => {
          const NavigationIcon = active ? ActiveIcon : Icon;
          const target =
            label === "Perfil"
              ? `/${profile?.username || username}`
              : path;
          if (label === "Más") {
            return (
              <div className="relative w-fit" key={label}>
                {moreMenuOpen && (
                  <div className="absolute bottom-full left-0 z-40 mb-2 w-[290px] overflow-hidden rounded-2xl bg-white py-2 shadow-[0_0_20px_rgba(0,0,0,0.24)]">
                    {[
                      ["Listas", "/listas"],
                      ["Comunidades", "/comunidades"],
                      ["Creator Studio", "/creator-studio"],
                      ["Configuración y privacidad", "/configuracion"],
                      ["Centro de ayuda", "/ayuda"],
                    ].map(([itemLabel, itemPath]) => (
                      <Link
                        className="block px-5 py-3 text-sm font-bold hover:bg-zinc-100"
                        key={itemPath}
                        onClick={() => setMoreMenuOpen(false)}
                        to={itemPath}
                      >
                        {itemLabel}
                      </Link>
                    ))}
                    <button
                      className="w-full border-t border-zinc-100 px-5 py-3 text-left text-sm font-bold hover:bg-zinc-100"
                      onClick={onLogout}
                      type="button"
                    >
                      Cerrar sesión de @{username}
                    </button>
                  </div>
                )}
                <button
                  aria-expanded={moreMenuOpen}
                  className="flex w-fit items-center gap-4 rounded-full px-3 py-2.5 text-left text-lg transition hover:bg-zinc-100 xl:px-4"
                  onClick={() => setMoreMenuOpen((open) => !open)}
                  type="button"
                >
                  <NavigationIcon aria-hidden="true" className="shrink-0" size={27} />
                  <span>Más</span>
                </button>
              </div>
            );
          }
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="flex w-fit items-center gap-4 rounded-full px-3 py-2.5 text-left text-lg transition hover:bg-zinc-100 xl:px-4"
              key={label}
              to={target}
            >
              <NavigationIcon aria-hidden="true" className="shrink-0" size={27} />
              <span className={active ? "font-bold" : "font-normal"}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Link
        className="mt-4 flex h-[50px] w-full items-center justify-center rounded-full bg-black text-base font-bold text-white transition hover:bg-zinc-800"
        to="/inicio"
      >
        Postear
      </Link>

      <div className="relative mt-auto">
        {accountMenuOpen && (
          <div className="absolute right-0 bottom-full left-0 mb-2 rounded-xl bg-white py-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <button
              className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-zinc-100"
              onClick={onLogout}
              type="button"
            >
              Cerrar sesión de @{username}
            </button>
          </div>
        )}
        <button
          aria-expanded={accountMenuOpen}
          aria-label="Opciones de la cuenta"
          className="flex w-full items-center gap-2 rounded-full p-2 text-left transition hover:bg-zinc-100 xl:gap-3 xl:p-3"
          onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          <Avatar
            name={displayName}
            photoURL={profile?.photoURL || user.photoURL}
            size="size-10"
          />
          <span className="hidden min-w-0 flex-1 xl:block">
            <span className="block truncate text-sm font-bold">
              {displayName}
            </span>
            <span className="block truncate text-sm text-zinc-500">
              @{username}
            </span>
          </span>
          <RiMoreLine aria-hidden="true" className="hidden xl:block" size={20} />
        </button>
      </div>
    </aside>
  );
}
