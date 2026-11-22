import { useState } from "react";
import api from "../services/api";
export default function Auth({ modo, go, onAuth }) {
  const reg = modo === "registro";
  const [f, setF] = useState({ email: "", password: "", consent: false });
  const [err, setErr] = useState("");
  const set = (k, v) => setF({ ...f, [k]: v });
  const enviar = async (e) => {
    e.preventDefault(); setErr("");
    try { reg ? await api.registro(f.email, f.password, f.consent) : await api.login(f.email, f.password); await onAuth(); go(reg ? "perfil" : "dashboard"); }
    catch (x) { setErr(x.message); }
  };
  return (
    <form className="card narrow form" onSubmit={enviar}>
      <h2>{reg ? "Crea tu cuenta" : "Inicia sesión"}</h2>
      <label>Correo electrónico<input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
      <label>Contraseña<input type="password" required minLength={6} value={f.password} onChange={(e) => set("password", e.target.value)} /></label>
      {reg && <label className="check"><input type="checkbox" required checked={f.consent} onChange={(e) => set("consent", e.target.checked)} /> Acepto la política de tratamiento de datos personales.</label>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn lg">{reg ? "Crear cuenta" : "Entrar"}</button>
      <button type="button" className="link" onClick={() => go(reg ? "login" : "registro")}>{reg ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}</button>
    </form>
  );
}
