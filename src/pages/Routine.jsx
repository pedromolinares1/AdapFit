import { useState } from "react";
import api from "../services/api";
const Vacio = ({ go }) => <div className="card empty"><h3>Aún no tienes rutina</h3><p className="mu">Completa tu perfil y la generamos al instante.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>;

export function Routine({ go }) {
  const r = api.routine();
  if (!r) return <Vacio go={go} />;
  return (
    <>
      <h2>Mi rutina</h2>
      <div className="grid3">
        {r.map((d, k) => (
          <article key={k} className="card">
            <small className="mu">{d.dia}</small><h3>{d.nombre}</h3>
            <ul className="ex">{d.ejercicios.map((e) => <li key={e.id}><b>{e.nombre}</b><span className="mu">{e.series} series · {e.reps} reps · descanso {e.descanso} s</span><em className="mu">{e.instrucciones}</em></li>)}</ul>
            <button className="btn sm" onClick={() => go("entrenar", k)}>Registrar entrenamiento</button>
          </article>
        ))}
      </div>
    </>
  );
}

export function Train({ go, dia }) {
  const r = api.routine();
  const d = r && r[dia];
  const [ej, setEj] = useState(d ? d.ejercicios.map((e) => ({ id: e.id, nombre: e.nombre, hecho: false, reps: "", carga: "" })) : []);
  const [esfuerzo, setEsfuerzo] = useState(5);
  if (!d) return <Vacio go={go} />;
  const cambiar = (i, k, v) => setEj(ej.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const guardar = () => { api.saveSession({ entrenamiento: d.nombre, dia: d.dia, ejercicios: ej, esfuerzo }); go("historial"); };
  return (
    <div className="narrow">
      <h2>{d.nombre} <small className="mu">· {d.dia}</small></h2>
      {ej.map((e, i) => (
        <div key={e.id} className={"card train" + (e.hecho ? " done" : "")}>
          <label className="check"><input type="checkbox" checked={e.hecho} onChange={(x) => cambiar(i, "hecho", x.target.checked)} /><b>{e.nombre}</b></label>
          {e.hecho && <div className="two"><label>Repeticiones<input type="number" min="0" value={e.reps} onChange={(x) => cambiar(i, "reps", x.target.value)} /></label><label>Carga (kg, opcional)<input type="number" min="0" value={e.carga} onChange={(x) => cambiar(i, "carga", x.target.value)} /></label></div>}
        </div>
      ))}
      <div className="card form"><label>¿Qué tan difícil fue? <b>{esfuerzo}/10</b><input type="range" min="1" max="10" value={esfuerzo} onChange={(x) => setEsfuerzo(+x.target.value)} /></label>
        <button className="btn lg" onClick={guardar}>Guardar sesión</button></div>
    </div>
  );
}
