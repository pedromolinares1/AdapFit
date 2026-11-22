import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
import { SEM, clave } from "../services/fechas";
const CAB = ["L", "M", "X", "J", "V", "S", "D"];

export default function Calendar({ go }) {
  const [mes, setMes] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const [sel, setSel] = useState(new Date());
  const { data, cargando, error } = useLoad(async () => ({ r: await api.rutina(), s: await api.sesiones() }));
  if (cargando || error) return <Cargando error={error} />;
  const { r, s } = data;
  const hechas = {};
  s.forEach((x) => { const k = clave(new Date(x.fecha)); hechas[k] = [...(hechas[k] || []), x]; });
  const info = (f) => ({ hechas: hechas[clave(f)] || [], idx: r ? r.findIndex((e) => e.dia === SEM[f.getDay()]) : -1 });
  const vacias = (mes.getDay() + 6) % 7, total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const dias = [...Array(vacias).fill(null), ...Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))];
  const mover = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));
  const det = info(sel);
  return (
    <div className="narrow">
      <h2>Calendario</h2>
      <div className="card">
        <div className="row between cal-h"><button className="btn ghost sm" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button><b className="mes">{mes.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}</b><button className="btn ghost sm" onClick={() => mover(1)} aria-label="Mes siguiente">›</button></div>
        <div className="cal">
          {CAB.map((c) => <small key={c} className="mu">{c}</small>)}
          {dias.map((f, i) => {
            if (!f) return <span key={i} />;
            const x = info(f);
            return <button key={i} onClick={() => setSel(f)} className={"dia" + (x.hechas.length ? " hecho" : x.idx >= 0 ? " toca" : "") + (clave(f) === clave(new Date()) ? " hoy" : "") + (clave(f) === clave(sel) ? " sel" : "")}>{f.getDate()}</button>;
          })}
        </div>
        <p className="leyenda mu"><span className="pt hecho" /> Entrenaste <span className="pt toca" /> Te toca entrenar</p>
      </div>
      <div className="card">
        <small className="mu">{sel.toLocaleDateString("es-CO", { dateStyle: "full" })}</small>
        {det.hechas.map((x) => <p key={x.id_sesion}><b>{x.nombre_entrenamiento}</b> <span className="mu">· {x.ejercicios_realizados}/{x.ejercicios_total} ejercicios · esfuerzo {x.esfuerzo_percibido}/10</span></p>)}
        {!det.hechas.length && (det.idx >= 0
          ? <><h3>{r[det.idx].nombre}</h3><p className="mu">{r[det.idx].ejercicios.length} ejercicios programados.</p><button className="btn sm" onClick={() => go("entrenar", det.idx)}>Registrar entrenamiento</button></>
          : <p className="mu">Día de descanso.</p>)}
      </div>
    </div>
  );
}
