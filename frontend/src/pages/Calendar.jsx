import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
import { SEM, clave, dia0, estadoSemana, mismaSemana } from "../services/fechas";
const CAB = ["L", "M", "X", "J", "V", "S", "D"];
const larga = (f) => f.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

export default function Calendar({ go }) {
  const [mes, setMes] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const [sel, setSel] = useState(dia0(new Date()));
  const { data, cargando, error } = useLoad(async () => ({ c: await api.rutinaCompleta(), s: await api.sesiones() }));
  if (cargando || error) return <Cargando error={error} />;
  const { c, s } = data, r = c && c.entrenamientos, hoy = dia0(new Date()), desde = c ? dia0(new Date(c.fecha_creacion)) : null;
  // Qué pasa en cada fecha: sesiones hechas ese día y el entrenamiento programado (hecho otro día, pendiente o por hacer)
  const info = (f) => {
    const hechas = s.filter((x) => clave(new Date(x.fecha)) === clave(f));
    const plan = r && desde && f >= desde ? estadoSemana(r, s, f).find((x) => x.e.dia === SEM[f.getDay()]) : null;
    let estado = "";
    if (plan) estado = plan.sesion ? (clave(new Date(plan.sesion.fecha)) !== clave(f) ? "movido" : "") : f < hoy ? "pendiente" : "toca";
    return { hechas, plan, estado };
  };
  const vacias = (mes.getDay() + 6) % 7, total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const dias = [...Array(vacias).fill(null), ...Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))];
  const mover = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1));
  const det = info(sel), actual = mismaSemana(sel, hoy);
  return (
    <div className="narrow">
      <h2>Calendario</h2>
      <div className="card">
        <div className="row between cal-h"><button className="btn ghost sm" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button><b className="mes">{mes.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}</b><button className="btn ghost sm" onClick={() => mover(1)} aria-label="Mes siguiente">›</button></div>
        <div className="cal">
          {CAB.map((x) => <small key={x} className="mu">{x}</small>)}
          {dias.map((f, i) => {
            if (!f) return <span key={i} />;
            const x = info(f);
            return <button key={i} onClick={() => setSel(f)} className={"dia" + (x.hechas.length ? " hecho" : x.estado ? " " + x.estado : "") + (clave(f) === clave(hoy) ? " hoy" : "") + (clave(f) === clave(sel) ? " sel" : "")}>{f.getDate()}</button>;
          })}
        </div>
        <p className="leyenda mu"><span className="pt hecho" /> Entrenaste <span className="pt toca" /> Te toca <span className="pt pendiente" /> Pendiente <span className="pt movido" /> Hecho otro día</p>
      </div>
      <div className="card">
        <small className="mu" style={{ textTransform: "capitalize" }}>{larga(sel)}</small>
        {det.hechas.map((x) => <p key={x.id_sesion}><b>{x.nombre_entrenamiento}</b> <span className="mu">· {x.ejercicios_realizados}/{x.ejercicios_total} ejercicios · esfuerzo {x.esfuerzo_percibido}/10{x.dia_entrenamiento && x.dia_entrenamiento !== SEM[sel.getDay()] ? ` · estaba programado el ${x.dia_entrenamiento.toLowerCase()}` : ""}</span></p>)}
        {det.estado === "movido" && <p className="mu">Este día estaba programado <b>{det.plan.e.nombre}</b>, pero lo hiciste el {larga(new Date(det.plan.sesion.fecha))}.</p>}
        {(det.estado === "toca" || det.estado === "pendiente") && (
          <>
            <h3>{det.plan.e.nombre}</h3>
            <p className="mu">{det.estado === "pendiente" ? "Quedó pendiente. " : ""}{det.plan.e.ejercicios.length} ejercicios programados.{actual ? " Si lo haces otro día, regístralo con la fecha real y contará para esta semana." : ""}</p>
            {actual && <button className="btn sm" onClick={() => go("entrenar", det.plan.idx)}>Registrar entrenamiento</button>}
          </>
        )}
        {!det.hechas.length && !det.estado && <p className="mu">Día de descanso.</p>}
      </div>
    </div>
  );
}
