import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
import { SEM } from "../services/fechas";

const fecha = (f, o = { dateStyle: "long" }) => new Date(f).toLocaleDateString("es-CO", o);
const vol = (x) => (x.series_realizadas || 0) * (x.repeticiones_realizadas || 0) * (x.peso || 0); // volumen = series × repeticiones × peso
const linea = (x) => [x.series_realizadas != null && `${x.series_realizadas} series`, x.repeticiones_realizadas != null && `${x.repeticiones_realizadas} reps`, x.peso != null && `${x.peso} kg`].filter(Boolean).join(" · ") || "sin datos";

function comparacion(e) {
  const a = e.anterior, c = [];
  if (!a || !e.realizado) return c;
  if (e.peso != null && a.peso != null) c.push({ t: `Peso ${e.peso - a.peso > 0 ? "+" : ""}${+(e.peso - a.peso).toFixed(1)} kg`, s: Math.sign(e.peso - a.peso) });
  if (e.repeticiones_realizadas != null && a.repeticiones_realizadas != null) c.push({ t: `Reps ${e.repeticiones_realizadas - a.repeticiones_realizadas > 0 ? "+" : ""}${e.repeticiones_realizadas - a.repeticiones_realizadas}`, s: Math.sign(e.repeticiones_realizadas - a.repeticiones_realizadas) });
  if (vol(e) && vol(a)) { const p = Math.round(((vol(e) - vol(a)) / vol(a)) * 100); c.push({ t: `Volumen ${p > 0 ? "+" : ""}${p} %`, s: Math.sign(p) }); }
  return c;
}

function Detalle({ id }) {
  const { data: d, cargando, error } = useLoad(() => api.sesion(id));
  if (cargando || error) return <Cargando error={error} />;
  const total = d.ejercicios.reduce((s, e) => s + (e.realizado ? vol(e) : 0), 0);
  return (
    <div className="detalle">
      <p className="mu">Volumen total de la sesión: <b>{total ? `${+total.toFixed(1)} kg` : "sin datos de carga"}</b> (series × repeticiones × peso)</p>
      <ul className="det">
        {d.ejercicios.map((e) => (
          <li key={e.id_ejercicio} className={e.realizado ? "" : "off"}>
            <div className="row between"><b>{e.nombre}</b><span className="pill">{e.realizado ? "Realizado" : "No realizado"}</span></div>
            {e.realizado && <p>Esta sesión: {linea(e)}</p>}
            {e.realizado && (e.anterior
              ? <p className="mu">Anterior ({fecha(e.anterior.fecha, { day: "numeric", month: "short" })}): {linea(e.anterior)}</p>
              : <p className="mu">Primera vez que registras este ejercicio.</p>)}
            <div className="row">{comparacion(e).map((c) => <span key={c.t} className={"delta " + (c.s > 0 ? "up" : c.s < 0 ? "down" : "")}>{c.t}</span>)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function History({ go }) {
  const { data: s, cargando, error } = useLoad(() => api.sesiones());
  const [abierto, setAbierto] = useState(null);
  if (cargando || error) return <Cargando error={error} />;
  if (!s.length) return <div className="card empty"><h3>Todavía no hay sesiones</h3><p className="mu">Registra tu primer entrenamiento y aparecerá aquí.</p><button className="btn" onClick={() => go("rutina")}>Ir a mi rutina</button></div>;
  return (
    <div className="narrow"><h2>Historial</h2>
      <p className="mu">Toca una sesión para ver sus series, repeticiones y pesos, y compararla con la anterior.</p>
      {s.map((x) => (
        <article key={x.id_sesion} className="card">
          <button className="row between hist" onClick={() => setAbierto(abierto === x.id_sesion ? null : x.id_sesion)} aria-expanded={abierto === x.id_sesion}>
            <div><b>{x.nombre_entrenamiento}</b><p className="mu">{fecha(x.fecha)}{x.dia_entrenamiento && SEM[new Date(x.fecha).getDay()] !== x.dia_entrenamiento ? ` (programado el ${x.dia_entrenamiento.toLowerCase()})` : ""} · {x.ejercicios_realizados} de {x.ejercicios_total} ejercicios</p></div>
            <span className="pill">Esfuerzo {x.esfuerzo_percibido}/10</span>
          </button>
          {abierto === x.id_sesion && <Detalle id={x.id_sesion} />}
        </article>
      ))}
    </div>
  );
}
