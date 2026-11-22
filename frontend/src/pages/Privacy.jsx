import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
const fecha = (d) => new Date(d).toLocaleDateString("es-CO", { dateStyle: "long" });
export default function Privacy({ user, refresh }) {
  const [f, setF] = useState({ nombre: user.nombre || "", correo: user.correo });
  const [msg, setMsg] = useState(""), [v, setV] = useState(0);
  const { data: sol, cargando, error } = useLoad(() => api.solicitudes(), [v]);
  const run = async (fn, ok) => { try { await fn(); setMsg(ok); setV(v + 1); } catch (x) { setMsg(x.message); } };
  const guardar = (e) => { e.preventDefault(); run(async () => { await api.actualizarUsuario(f); await refresh(); }, "Datos actualizados."); };
  const pendiente = sol && sol.find((s) => s.tipo === "eliminacion" && s.estado === "pendiente");
  return (
    <div className="narrow">
      <h2>Configuración y privacidad</h2>
      {msg && <p role="status" className="ok">{msg}</p>}
      <form className="card form" onSubmit={guardar}>
        <label>Nombre<input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
        <label>Correo electrónico<input type="email" required value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} /></label>
        {user.fecha_autorizacion && <p className="mu">Autorizaste el tratamiento de datos el {fecha(user.fecha_autorizacion)}.</p>}
        <button className="btn">Guardar cambios</button>
      </form>
      <div className="card">
        <h3>Eliminar mis datos</h3>
        {cargando || error ? <Cargando error={error} /> : pendiente
          ? <><p className="mu">Solicitud registrada el {fecha(pendiente.fecha)}. Está pendiente de gestión.</p><button className="btn ghost" onClick={() => run(() => api.cancelarSolicitud(pendiente.id_solicitud), "Solicitud cancelada.")}>Cancelar solicitud</button></>
          : <><p className="mu">Puedes pedir que borremos tu cuenta y tu información.</p><button className="btn ghost" onClick={() => confirm("¿Quieres solicitar la eliminación de tus datos?") && run(() => api.solicitarEliminacion(), "Solicitud registrada.")}>Solicitar eliminación</button></>}
      </div>
    </div>
  );
}
