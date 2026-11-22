import { useState, useEffect } from "react";
import api from "./services/api";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import { Routine, Train } from "./pages/Routine";
import History from "./pages/History";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Calendar from "./pages/Calendar";

export const Logo = () => (
  <span className="logo">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
  </span>
);

const MENU = [["dashboard", "Inicio"], ["rutina", "Mi rutina"], ["calendario", "Calendario"], ["entrenar", "Entrenar"], ["historial", "Historial"], ["perfil", "Perfil"], ["privacidad", "Privacidad"]];

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("adaptfit_theme") || "dark");
  const [user, setUser] = useState(null);
  const [listo, setListo] = useState(false);
  const [page, setPage] = useState("landing");
  const [ctx, setCtx] = useState(0);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("adaptfit_theme", theme); }, [theme]);

  const go = (p, c = 0) => { setPage(p); setCtx(c); window.scrollTo(0, 0); };
  const cargar = () => api.me().then((u) => { setUser(u); return u; }).catch(() => { api.logout(); setUser(null); return null; });
  useEffect(() => { if (api.hayToken()) cargar().then((u) => { if (u) setPage("dashboard"); setListo(true); }); else setListo(true); }, []);
  const onAuth = cargar;
  const logout = () => { api.logout(); setUser(null); go("landing"); };
  const publicas = ["landing", "login", "registro"];
  const actual = !user && !publicas.includes(page) ? "login" : page;
  const menu = user?.rol === "admin" ? [...MENU, ["admin", "Catálogo"]] : MENU;
  const p = { go, user, onAuth, refresh: cargar };
  if (!listo) return null;

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <button className="brand" onClick={() => go(user ? "dashboard" : "landing")}><Logo /><b>AdaptFit</b></button>
          {user ? (
            <nav className="links app">{menu.map(([k, t]) => <button key={k} className={actual === k ? "on" : ""} onClick={() => go(k)}>{t}</button>)}</nav>
          ) : (
            <nav className="links"><button onClick={() => { go("landing"); setTimeout(() => document.getElementById("como")?.scrollIntoView({ behavior: "smooth" }), 50); }}>Cómo funciona</button><button onClick={() => go("login")}>Iniciar sesión</button></nav>
          )}
          <div className="nav-r">
            <div className="toggle" role="group" aria-label="Tema">
              <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>Versión negra</button>
              <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>Versión verde</button>
            </div>
            {user ? <button className="btn sm" onClick={logout}>Cerrar sesión</button> : <button className="btn sm" onClick={() => go("registro")}>Empezar gratis</button>}
          </div>
        </div>
      </header>
      <main className="wrap" key={actual}>
        {actual === "landing" && <Landing {...p} />}
        {actual === "login" && <Auth modo="login" {...p} />}
        {actual === "registro" && <Auth modo="registro" {...p} />}
        {actual === "calendario" && <Calendar {...p} />}
        {actual === "dashboard" && <Dashboard {...p} />}
        {actual === "perfil" && <Profile {...p} />}
        {actual === "rutina" && <Routine {...p} />}
        {actual === "entrenar" && <Train {...p} dia={ctx} />}
        {actual === "historial" && <History {...p} />}
        {actual === "admin" && <Admin {...p} />}
        {actual === "privacidad" && <Privacy {...p} logout={logout} />}
      </main>
      <footer className="wrap foot"><a href="https://repdb.co" target="_blank" rel="noreferrer">Exercise data by RepDB (repdb.co)</a></footer>
    </>
  );
}
