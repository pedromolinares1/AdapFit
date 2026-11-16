import { useState } from "react";
import api from "../services/api";
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const EQUIPO = ["gimnasio", "mancuernas", "bandas elásticas", "peso corporal"];
export default function Profile({ user, go, refresh }) {
  const [f, setF] = useState(user.perfil || { objetivo: "masa", nivel: "principiante", dias: [], equipo: [], alimentacion: "", evitar: "" });
  const [err, setErr] = useState("");
  const alternar = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const guardar = (e) => {
    e.preventDefault();
    if (!f.dias.length || !f.equipo.length) return setErr("Elige al menos un día y un tipo de equipamiento.");
    api.updateUser({ perfil: f }); refresh(); go("rutina");
  };
  return (
    <form className="card narrow form" onSubmit={guardar}>
      <h2>Tu perfil de entrenamiento</h2>
      <label>Objetivo
        <select value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })}>
          <option value="masa">Ganar masa muscular</option><option value="grasa">Perder grasa</option><option value="condicion">Mejorar la condición física</option>
        </select></label>
      <label>Nivel de experiencia
        <select value={f.nivel} onChange={(e) => setF({ ...f, nivel: e.target.value })}>
          <option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
        </select></label>
      <fieldset><legend>Días disponibles</legend><div className="chips">{DIAS.map((d) => <label key={d} className={"chip" + (f.dias.includes(d) ? " on" : "")}><input type="checkbox" checked={f.dias.includes(d)} onChange={() => alternar("dias", d)} />{d}</label>)}</div></fieldset>
      <fieldset><legend>Equipamiento</legend><div className="chips">{EQUIPO.map((d) => <label key={d} className={"chip" + (f.equipo.includes(d) ? " on" : "")}><input type="checkbox" checked={f.equipo.includes(d)} onChange={() => alternar("equipo", d)} />{d}</label>)}</div></fieldset>
      <label>Tipo de alimentación (opcional)<input value={f.alimentacion} placeholder="Ej: vegetariana" onChange={(e) => setF({ ...f, alimentacion: e.target.value })} /></label>
      <label>Alimentos que prefieres evitar (opcional)<input value={f.evitar} onChange={(e) => setF({ ...f, evitar: e.target.value })} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn lg">Guardar perfil</button>
    </form>
  );
}
