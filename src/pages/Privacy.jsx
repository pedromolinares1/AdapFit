import { useState } from "react";
import api from "../services/api";
export default function Privacy({ user, refresh }) {
  const [email, setEmail] = useState(user.email);
  const [msg, setMsg] = useState("");
  const guardar = (e) => { e.preventDefault(); api.updateUser({ email }); refresh(); setMsg("Datos actualizados."); };
  const solicitar = () => { if (confirm("¿Quieres solicitar la eliminación de tus datos?")) { api.updateUser({ eliminacion: new Date().toISOString() }); refresh(); } };
  const cancelar = () => { api.updateUser({ eliminacion: null }); refresh(); };
  return (
    <div className="narrow">
      <h2>Configuración y privacidad</h2>
      <form className="card form" onSubmit={guardar}>
        <label>Correo electrónico<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <p className="mu">Autorizaste el tratamiento de datos el {new Date(user.consentimiento || Date.now()).toLocaleDateString("es-CO", { dateStyle: "long" })}.</p>
        {msg && <p role="status" className="ok">{msg}</p>}
        <button className="btn">Guardar cambios</button>
      </form>
      <div className="card">
        <h3>Eliminar mis datos</h3>
        {user.eliminacion
          ? <><p className="mu">Solicitud registrada el {new Date(user.eliminacion).toLocaleDateString("es-CO", { dateStyle: "long" })}. Está pendiente de gestión.</p><button className="btn ghost" onClick={cancelar}>Cancelar solicitud</button></>
          : <><p className="mu">Puedes pedir que borremos tu cuenta y tu información.</p><button className="btn ghost" onClick={solicitar}>Solicitar eliminación</button></>}
      </div>
    </div>
  );
}
