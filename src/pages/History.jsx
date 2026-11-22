import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
export default function History({ go }) {
  const { data: s, cargando, error } = useLoad(() => api.sesiones());
  if (cargando || error) return <Cargando error={error} />;
  if (!s.length) return <div className="card empty"><h3>Todavía no hay sesiones</h3><p className="mu">Registra tu primer entrenamiento y aparecerá aquí.</p><button className="btn" onClick={() => go("rutina")}>Ir a mi rutina</button></div>;
  return (
    <div className="narrow"><h2>Historial</h2>
      {s.map((x) => <article key={x.id_sesion} className="card row between"><div><b>{x.nombre_entrenamiento}</b><p className="mu">{new Date(x.fecha).toLocaleDateString("es-CO", { dateStyle: "long" })} · {x.ejercicios_realizados} de {x.ejercicios_total} ejercicios</p></div><span className="pill">Esfuerzo {x.esfuerzo_percibido}/10</span></article>)}
    </div>
  );
}
