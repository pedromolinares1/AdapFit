import api from "../services/api";
export default function History({ go }) {
  const s = api.sessions();
  if (!s.length) return <div className="card empty"><h3>Todavía no hay sesiones</h3><p className="mu">Registra tu primer entrenamiento y aparecerá aquí.</p><button className="btn" onClick={() => go("rutina")}>Ir a mi rutina</button></div>;
  return (
    <div className="narrow"><h2>Historial</h2>
      {s.map((x) => <article key={x.id} className="card row between"><div><b>{x.entrenamiento}</b><p className="mu">{new Date(x.fecha).toLocaleDateString("es-CO", { dateStyle: "long" })} · {x.ejercicios.filter((e) => e.hecho).length} de {x.ejercicios.length} ejercicios</p></div><span className="pill">Esfuerzo {x.esfuerzo}/10</span></article>)}
    </div>
  );
}
