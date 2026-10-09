import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/auth-context";
import { useUserProfile } from "./hooks/useUserProfile";
import MainLayout from "./components/MainLayout";
import Bookmarks from "./pages/Bookmarks";
import Chat from "./pages/Chat";
import Explore from "./pages/Explore";
import Following from "./pages/Following";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import SearchResults from "./pages/SearchResults";
import SectionPage from "./pages/SectionPage";
import TweetDetail from "./pages/TweetDetail";

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-zinc-500">
        Cargando...
      </main>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function OwnProfileRedirect() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile(user.uid);
  if (loading) {
    return <p className="p-8 text-center text-sm text-zinc-500">Cargando perfil...</p>;
  }
  return profile?.username ? (
    <Navigate replace to={`/${profile.username}`} />
  ) : (
    <Navigate replace to="/inicio" />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Login />} path="/login" />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route element={<Navigate replace to="/inicio" />} path="/" />
          <Route element={<Home />} path="/inicio" />
          <Route element={<Explore />} path="/explorar" />
          <Route element={<Notifications />} path="/notificaciones" />
          <Route element={<Following />} path="/seguir" />
          <Route element={<Chat />} path="/chat" />
          <Route element={<Bookmarks />} path="/guardados" />
          <Route element={<Premium />} path="/premium" />
          <Route
            element={<SectionPage title="Listas" />}
            path="/listas"
          />
          <Route
            element={<SectionPage title="Comunidades" />}
            path="/comunidades"
          />
          <Route
            element={<SectionPage title="Creator Studio" />}
            path="/creator-studio"
          />
          <Route
            element={<SectionPage title="Configuración y privacidad" />}
            path="/configuracion"
          />
          <Route
            element={<SectionPage title="Centro de ayuda" />}
            path="/ayuda"
          />
          <Route element={<OwnProfileRedirect />} path="/perfil" />
          <Route element={<SearchResults />} path="/buscar" />
          <Route element={<TweetDetail />} path="/tweet/:id" />
          <Route element={<Profile />} path="/:username" />
          <Route element={<Navigate replace to="/inicio" />} path="*" />
        </Route>
      </Route>
    </Routes>
  );
}
