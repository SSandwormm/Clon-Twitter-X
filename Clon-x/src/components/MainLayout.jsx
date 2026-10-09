import { Link, Outlet, useLocation } from "react-router-dom";
import {
  RiBookmarkFill,
  RiBookmarkLine,
  RiCompass3Fill,
  RiCompass3Line,
  RiHome7Fill,
  RiHome7Line,
  RiMailFill,
  RiMailLine,
  RiMoreFill,
  RiNotification3Fill,
  RiNotification3Line,
  RiSearchLine,
  RiUser3Fill,
  RiUser3Line,
  RiUserFollowFill,
  RiUserFollowLine,
  RiVerifiedBadgeFill,
  RiVerifiedBadgeLine,
} from "react-icons/ri";
import { useAuth } from "../context/auth-context";
import { useUserProfile } from "../hooks/useUserProfile";
import RightPanel from "./RightPanel";
import Sidebar from "./Sidebar";

const primaryNavigation = [
  { label: "Inicio", path: "/inicio", Icon: RiHome7Line, ActiveIcon: RiHome7Fill },
  { label: "Explorar", path: "/explorar", Icon: RiCompass3Line, ActiveIcon: RiCompass3Fill },
  { label: "Notificaciones", path: "/notificaciones", Icon: RiNotification3Line, ActiveIcon: RiNotification3Fill },
  { label: "Seguir", path: "/seguir", Icon: RiUserFollowLine, ActiveIcon: RiUserFollowFill },
  { label: "Chat", path: "/chat", Icon: RiMailLine, ActiveIcon: RiMailFill },
  { label: "Guardados", path: "/guardados", Icon: RiBookmarkLine, ActiveIcon: RiBookmarkFill },
  { label: "Premium", path: "/premium", Icon: RiVerifiedBadgeLine, ActiveIcon: RiVerifiedBadgeFill },
  { label: "Perfil", path: "/perfil", Icon: RiUser3Line, ActiveIcon: RiUser3Fill },
  { label: "Más", path: "/seguir", Icon: RiMoreFill, ActiveIcon: RiMoreFill },
];

const mobileNavigation = [
  { label: "Inicio", path: "/inicio", Icon: RiHome7Line, ActiveIcon: RiHome7Fill },
  { label: "Buscar", path: "/explorar", Icon: RiSearchLine, ActiveIcon: RiSearchLine },
  { label: "Notificaciones", path: "/notificaciones", Icon: RiNotification3Line, ActiveIcon: RiNotification3Fill },
  { label: "Perfil", path: "/perfil", Icon: RiUser3Line, ActiveIcon: RiUser3Fill },
];

function pathIsActive(pathname, path) {
  if (path === "/perfil") {
    return pathname === "/perfil" || (
      pathname.startsWith("/") &&
      ![
        "/inicio",
        "/explorar",
        "/notificaciones",
        "/seguir",
        "/chat",
        "/guardados",
        "/premium",
        "/buscar",
        "/tweet",
        "/login",
      ].some((knownPath) => pathname === knownPath || pathname.startsWith(`${knownPath}/`))
    );
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { profile } = useUserProfile(user.uid);
  const { pathname } = useLocation();

  const navigation = primaryNavigation.map((item) => ({
    ...item,
    active: item.label !== "Más" && pathIsActive(pathname, item.path),
  }));
  const mobileItems = mobileNavigation.map((item) => ({
    ...item,
    active: pathIsActive(pathname, item.path),
  }));

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto grid min-h-screen w-full max-w-[1225px] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_250px] xl:grid-cols-[275px_600px_350px]">
        <Sidebar
          navigation={navigation}
          onLogout={logout}
          profile={profile}
          user={user}
        />
        <section className="min-w-0 border-x border-zinc-200 pb-16 lg:pb-0">
          <Outlet />
        </section>
        <RightPanel />
      </div>
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-30 grid h-14 grid-cols-4 border-t border-zinc-200 bg-white lg:hidden"
      >
        {mobileItems.map(({ label, path, Icon, ActiveIcon, active }) => {
          const NavigationIcon = active ? ActiveIcon : Icon;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`grid place-items-center ${active ? "text-black" : "text-zinc-500"}`}
              key={label}
              to={path}
            >
              <NavigationIcon aria-hidden="true" size={25} />
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
