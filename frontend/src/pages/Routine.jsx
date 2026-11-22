import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
const Vacio = ({ go }) => <div className="card empty"><h3>Aún no tienes rutina</h3><p className="mu">Completa tu perfil y la generamos al instante.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>;

export function Routine({ go }) {
  const { data: r, cargando, error } = useLoad(() => api.rutinaCompleta());
  const [sel, setSel] = useState(null);
  if (cargando || error) return <Cargando error={error} />;
  if (!r) return <Vacio go={go} />;
  const grupos = (t) => [...new Set(t.ejercicios.map((e) => e.grupo_muscular))].join(" · ");
  const d = sel !== null ? r.entrenamientos[sel] : null;
  return (
    <>
      <h2>Mi rutina</h2>
      {r.plan && <div className="card plan"><small className="mu">Tu plan semanal</small><h3>{r.plan.tipo}</h3><p>{r.plan.frecuencia}</p><p className="mu">{r.plan.motivo}</p></div>}
      <p className="mu">Toca un entrenamiento para ver sus ejercicios.</p>
      <div className="rgrid">
        {r.entrenamientos.map((t, k) => (
          <button key={k} className={"rcard" + (sel === k ? " on" : "")} onClick={() => setSel(sel === k ? null : k)} aria-expanded={sel === k}>
            <small className="mu">{t.dia}</small><h3>{t.nombre}</h3><span className="mu grupos">{grupos(t)}</span><span className="pill">{t.ejercicios.length} ejercicios</span>
          </button>
        ))}
      </div>
      {d && (
        <section className="card panel" key={sel}>
          <div className="row between"><h3>{d.nombre} · {d.dia}</h3><button className="btn sm" onClick={() => go("entrenar", sel)}>Registrar entrenamiento</button></div>
          <ul className="ex2">{d.ejercicios.map((e) => (
            <li key={e.id_ejercicio}>
              {e.imagen_url && <img className="thumb sm" src={e.imagen_url} alt="" loading="lazy" />}
              <div><b>{e.nombre}</b><p className="mu">{e.series} series · {e.repeticiones} reps · descanso {e.descanso_segundos} s{e.carga_sugerida ? ` · carga sugerida ${e.carga_sugerida} kg` : ""}</p>
                <details><summary>Cómo hacerlo</summary><p className="mu">{e.instrucciones}</p></details></div>
            </li>))}</ul>
        </section>
      )}
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
