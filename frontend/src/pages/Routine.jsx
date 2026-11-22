import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
const Vacio = ({ go }) => <div className="card empty"><h3>Aún no tienes rutina</h3><p className="mu">Completa tu perfil y la generamos al instante.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>;

export function Routine({ go }) {
  const { data: r, cargando, error } = useLoad(() => api.rutina());
  if (cargando || error) return <Cargando error={error} />;
  if (!r) return <Vacio go={go} />;
  return (
    <>
      <h2>Mi rutina</h2>
      <div className="grid3">
        {r.map((d, k) => (
          <article key={k} className="card">
            <small className="mu">{d.dia}</small><h3>{d.nombre}</h3>
            <ul className="ex">{d.ejercicios.map((e) => (
              <li key={e.id_ejercicio}>
                {e.imagen_url && <img className="thumb" src={e.imagen_url} alt="" loading="lazy" />}
                <b>{e.nombre}</b>
                <span className="mu">{e.series} series · {e.repeticiones} reps · descanso {e.descanso_segundos} s{e.carga_sugerida ? ` · carga sugerida ${e.carga_sugerida} kg` : ""}</span>
                <em className="mu">{e.instrucciones}</em>
              </li>))}</ul>
            <button className="btn sm" onClick={() => go("entrenar", k)}>Registrar entrenamiento</button>
          </article>
        ))}
      </div>
    </>
  );
}

export function Train({ go, dia }) {
  const { data: r, cargando, error } = useLoad(() => api.rutina());
  if (cargando || error) return <Cargando error={error} />;
  if (!r || !r[dia]) return <Vacio go={go} />;
  return <Registro d={r[dia]} go={go} />;
}

function Registro({ d, go }) {
  const [ej, setEj] = useState(d.ejercicios.map((e) => ({ id: e.id_ejercicio, nombre: e.nombre, sugerida: e.carga_sugerida, hecho: false, reps: "", carga: "" })));
  const [esfuerzo, setEsfuerzo] = useState(5);
  const [err, setErr] = useState("");
  const cambiar = (i, k, v) => setEj(ej.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const guardar = async () => {
    try {
      await api.guardarSesion({ dia_entrenamiento: d.dia, nombre_entrenamiento: d.nombre, esfuerzo_percibido: esfuerzo,
        ejercicios: ej.map((e) => ({ id_ejercicio: e.id, realizado: e.hecho, repeticiones_realizadas: e.reps === "" ? null : +e.reps, peso: e.carga === "" ? null : +e.carga })) });
      go("historial");
    } catch (x) { setErr(x.message); }
  };
  return (
    <div className="narrow">
      <h2>{d.nombre} <small className="mu">· {d.dia}</small></h2>
      {ej.map((e, i) => (
        <div key={e.id} className={"card train" + (e.hecho ? " done" : "")}>
          <label className="check"><input type="checkbox" checked={e.hecho} onChange={(x) => cambiar(i, "hecho", x.target.checked)} /><b>{e.nombre}</b></label>
          {e.hecho && <div className="two"><label>Repeticiones<input type="number" min="0" value={e.reps} onChange={(x) => cambiar(i, "reps", x.target.value)} /></label><label>Carga (kg, opcional){e.sugerida ? ` · sugerida ${e.sugerida}` : ""}<input type="number" min="0" value={e.carga} onChange={(x) => cambiar(i, "carga", x.target.value)} /></label></div>}
        </div>
      ))}
      <div className="card form"><label>¿Qué tan difícil fue? <b>{esfuerzo}/10</b><input type="range" min="1" max="10" value={esfuerzo} onChange={(x) => setEsfuerzo(+x.target.value)} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn lg" onClick={guardar}>Guardar sesión</button></div>
    </div>
  );
}
