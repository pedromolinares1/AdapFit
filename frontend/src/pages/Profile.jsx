import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const EQUIPO = ["gimnasio", "mancuernas", "bandas elásticas", "peso corporal"];
const BASE = { objetivo: "masa", nivel: "principiante", dias_disponibles: [], equipamiento: [], edad: "", peso_kg: "", altura_cm: "", tipo_alimentacion: "", alimentos_evitar: "" };

const num = (x) => (x === "" || x == null ? null : +x);

export default function Profile(props) {
  const { data, cargando, error } = useLoad(() => api.perfil());
  if (cargando || error) return <Cargando error={error} />;
  return <Form {...props} inicial={{ ...BASE, ...data, nombre: props.user.nombre || "" }} />;
}
function Form({ inicial, go, refresh }) {
  const [f, setF] = useState(inicial);
  const [err, setErr] = useState("");
  const alternar = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const guardar = async (e) => {
    e.preventDefault();
    if (!f.dias_disponibles.length || !f.equipamiento.length) return setErr("Elige al menos un día y un tipo de equipamiento.");
    try { await api.guardarPerfil({ ...f, edad: num(f.edad), peso_kg: num(f.peso_kg), altura_cm: num(f.altura_cm) }); await api.generarRutina(); await refresh(); go("rutina"); } catch (x) { setErr(x.message); }
  };
  const chips = (k, lista) => <div className="chips">{lista.map((d) => <label key={d} className={"chip" + (f[k].includes(d) ? " on" : "")}><input type="checkbox" checked={f[k].includes(d)} onChange={() => alternar(k, d)} />{d}</label>)}</div>;
  return (
    <form className="card narrow form" onSubmit={guardar}>
      <h2>Tu perfil de entrenamiento</h2>
      <label>Nombre<input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
      <label>Objetivo
        <select value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })}>
          <option value="masa">Ganar masa muscular</option><option value="grasa">Perder grasa</option><option value="fuerza">Mejorar la fuerza</option><option value="resistencia">Mejorar la resistencia</option><option value="condicion">Mejorar la condición física</option>
        </select></label>
      <label>Nivel de experiencia
        <select value={f.nivel} onChange={(e) => setF({ ...f, nivel: e.target.value })}>
          <option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
        </select></label>
      <fieldset><legend>Días disponibles</legend>{chips("dias_disponibles", DIAS)}</fieldset>
      <fieldset><legend>Equipamiento</legend>{chips("equipamiento", EQUIPO)}</fieldset>
      <div className="three">
        <label>Edad<input required type="number" min="14" max="100" value={f.edad ?? ""} onChange={(e) => setF({ ...f, edad: e.target.value })} /></label>
        <label>Peso en kg (opcional)<input type="number" min="30" max="300" step="0.1" value={f.peso_kg ?? ""} onChange={(e) => setF({ ...f, peso_kg: e.target.value })} /></label>
        <label>Altura en cm (opcional)<input type="number" min="100" max="250" value={f.altura_cm ?? ""} onChange={(e) => setF({ ...f, altura_cm: e.target.value })} /></label>
      </div>
      <label>Tipo de alimentación (opcional)<input value={f.tipo_alimentacion} placeholder="Ej: vegetariana" onChange={(e) => setF({ ...f, tipo_alimentacion: e.target.value })} /></label>
      <label>Alimentos que prefieres evitar (opcional)<input value={f.alimentos_evitar} onChange={(e) => setF({ ...f, alimentos_evitar: e.target.value })} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn lg">Guardar perfil</button>
    </form>
  );
}
