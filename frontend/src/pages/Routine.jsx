import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
import Toast from "../components/Toast";
import { proximo } from "../services/fechas";
const Vacio = ({ go }) => <div className="card empty"><h3>Aún no tienes rutina</h3><p className="mu">Completa tu perfil y la generamos al instante.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>;

export function Routine({ go }) {
  const [v, setV] = useState(0);
  const { data, cargando, error } = useLoad(async () => ({ r: await api.rutinaCompleta(), p: await api.perfil() }), [v]);
  const [sel, setSel] = useState(null), [abierto, setAbierto] = useState(false), [toast, setToast] = useState(null), [trabajando, setTrabajando] = useState(false);
  const [op, setOp] = useState({ distribucion: "", mas_suave: false });
  if (cargando || error) return <Cargando error={error} />;
  const { r, p } = data;
  if (!r) return <Vacio go={go} />;
  const aviso = (texto, tipo) => setToast({ texto, tipo, id: Date.now() });
  const regenerar = async () => {
    setTrabajando(true);
    try { await api.generarRutina({ distribucion: op.distribucion || r.plan.clave, cambiar_ejercicios: true, mas_suave: op.mas_suave }); setSel(null); setV(v + 1); aviso("Rutina generada de nuevo.", "ok"); }
    catch (x) { aviso(x.message, "error"); }
    setTrabajando(false);
  };
  const grupos = (t) => [...new Set(t.ejercicios.map((e) => e.grupo_muscular))].join(" · ");
  const d = sel !== null ? r.entrenamientos[sel] : null;
  return (
    <>
      {toast && <Toast key={toast.id} {...toast} onClose={() => setToast(null)} />}
      <h2>Mi rutina</h2>
      {r.plan && <div className="card plan"><small className="mu">Tu plan semanal</small><h3>{r.plan.tipo}</h3><p>{r.plan.frecuencia}</p><p className="mu">{r.plan.motivo}</p></div>}
      <div className="card">
        <div className="row between">
          <div><b>¿Algún ejercicio te parece muy exigente?</b><p className="mu">Genérala de nuevo con otra distribución u otros ejercicios. Siempre se respeta tu nivel{p ? ` (${p.nivel})` : ""} y tu equipamiento. Para cambiar tus días, edita tu perfil.</p></div>
          <button className="btn ghost sm" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>{abierto ? "Cerrar" : "Cambiar mi rutina"}</button>
        </div>
        {abierto && (
          <div className="form" style={{ marginTop: "1rem" }}>
            <label>Distribución semanal<select value={op.distribucion || r.plan.clave} onChange={(e) => setOp({ ...op, distribucion: e.target.value })}>{r.plan.opciones.map((o) => <option key={o.clave} value={o.clave}>{o.nombre}</option>)}</select></label>
            {p && p.nivel !== "principiante" && <label className="check"><input type="checkbox" checked={op.mas_suave} onChange={(e) => setOp({ ...op, mas_suave: e.target.checked })} /> Prefiero ejercicios más accesibles (un nivel por debajo del mío)</label>}
            <button className="btn" disabled={trabajando} onClick={regenerar}>{trabajando ? "Generando…" : "Generar de nuevo"}</button>
          </div>
        )}
      </div>
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
  const { data, cargando, error } = useLoad(async () => ({ r: await api.rutina(), s: await api.sesiones() }));
  if (cargando || error) return <Cargando error={error} />;
  const { r, s } = data, prox = proximo(r, s);
  const idx = dia ?? (prox ? prox.idx : 0);   // sin elegir uno: el próximo pendiente de la semana
  if (!r || !r[idx]) return <Vacio go={go} />;
  return <Registro d={r[idx]} go={go} />;
}

function Registro({ d, go }) {
  const [ej, setEj] = useState(d.ejercicios.map((e) => ({ id: e.id_ejercicio, nombre: e.nombre, sugerida: e.carga_sugerida, series: e.series, hecho: false, reps: "", carga: "" })));
  const [esfuerzo, setEsfuerzo] = useState(5);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hoyIso = iso(new Date());
  const [fecha, setFecha] = useState(hoyIso);
  const [err, setErr] = useState("");
  const cambiar = (i, k, v) => setEj(ej.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const guardar = async () => {
    try {
      await api.guardarSesion({ fecha: fecha || undefined, dia_entrenamiento: d.dia, nombre_entrenamiento: d.nombre, esfuerzo_percibido: esfuerzo,
        ejercicios: ej.map((e) => ({ id_ejercicio: e.id, realizado: e.hecho, series_realizadas: e.series === "" || e.series == null ? null : +e.series, repeticiones_realizadas: e.reps === "" ? null : +e.reps, peso: e.carga === "" ? null : +e.carga })) });
      go("historial");
    } catch (x) { setErr(x.message); }
  };
  return (
    <div className="narrow">
      <h2>{d.nombre} <small className="mu">· {d.dia}</small></h2>
      {ej.map((e, i) => (
        <div key={e.id} className={"card train" + (e.hecho ? " done" : "")}>
          <label className="check"><input type="checkbox" checked={e.hecho} onChange={(x) => cambiar(i, "hecho", x.target.checked)} /><b>{e.nombre}</b></label>
          {e.hecho && <div className="three"><label>Series<input type="number" min="0" max="50" value={e.series} onChange={(x) => cambiar(i, "series", x.target.value)} /></label><label>Repeticiones por serie<input type="number" min="0" value={e.reps} onChange={(x) => cambiar(i, "reps", x.target.value)} /></label><label>Carga (kg, opcional){e.sugerida ? ` · sugerida ${e.sugerida}` : ""}<input type="number" min="0" value={e.carga} onChange={(x) => cambiar(i, "carga", x.target.value)} /></label></div>}
        </div>
      ))}
      <div className="card form"><label>¿Qué día hiciste este entrenamiento?<input type="date" max={hoyIso} value={fecha} onChange={(x) => setFecha(x.target.value)} /></label><p className="mu">Si no pudiste hacerlo el {d.dia.toLowerCase()} y lo pasaste a otro día, elige aquí el día real. Contará igual para esta semana.</p></div>
      <div className="card form"><label>¿Qué tan difícil fue? <b>{esfuerzo}/10</b><input type="range" min="1" max="10" value={esfuerzo} onChange={(x) => setEsfuerzo(+x.target.value)} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn lg" onClick={guardar}>Guardar sesión</button></div>
    </div>
  );
}
