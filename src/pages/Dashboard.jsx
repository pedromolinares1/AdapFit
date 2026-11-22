import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
import { proximo } from "../services/fechas";
const OBJ = { masa: "Ganar masa muscular", grasa: "Perder grasa", condicion: "Mejorar la condición física" };
const CAT = { entrenamiento: "Entrenamiento", alimentacion: "Alimentación", recuperacion: "Recuperación" };
export default function Dashboard({ user, go }) {
  const { data, cargando, error } = useLoad(async () => ({ p: await api.perfil(), r: await api.rutina(), s: await api.sesiones(), recs: await api.recomendaciones() }));
  if (cargando || error) return <Cargando error={error} />;
  const { p, r, s, recs } = data, prox = proximo(r, s);
  return (
    <>
      <h2>Hola, {user.nombre || "bienvenido"}</h2>
      {!p ? (
        <div className="card empty"><h3>Configura tu perfil</h3><p className="mu">Con tu objetivo, nivel y equipo armamos tu primera rutina.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>
      ) : (
        <div className="grid3">
          <article className="card"><small className="mu">Tu objetivo</small><h3>{OBJ[p.objetivo]}</h3><p className="mu">{r ? `${r.length} entrenamientos por semana` : ""}</p></article>
          <article className="card"><small className="mu">Próximo entrenamiento</small>{prox ? <><h3>{prox.e.nombre}</h3><p className="mu">{prox.hoy ? "Hoy" : prox.f.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} · {prox.e.ejercicios.length} ejercicios</p><button className="btn sm" onClick={() => go("entrenar", prox.idx)}>Empezar</button></> : <p className="mu">Aún sin entrenamientos programados.</p>}</article>
          <article className="card"><small className="mu">Últimas sesiones</small>{s.length ? s.slice(0, 3).map((x) => <p key={x.id_sesion}>{x.nombre_entrenamiento} <span className="mu">· esfuerzo {x.esfuerzo_percibido}/10</span></p>) : <p className="mu">Todavía no registras sesiones.</p>}</article>
        </div>
      )}
      <h3>Recomendaciones personalizadas</h3>
      {recs.length ? <div className="grid3">{recs.map((x) => <article key={x.id_recomendacion} className="card ia"><span className="pill">{CAT[x.categoria] || x.categoria}</span><h3>{x.titulo}</h3><p>{x.descripcion}</p><p className="mu"><b>Por qué:</b> {x.motivo}</p><p className="mu"><b>Qué hacer:</b> {x.accion_sugerida}</p></article>)}</div>
        : <article className="card ia"><p className="mu">Aún no hay recomendaciones. Aparecerán aquí cuando completes tu perfil y registres sesiones.</p></article>}
    </>
  );
}
