import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
import Toast from "../components/Toast";
import { proximo } from "../services/fechas";
const OBJ = { masa: "Ganar masa muscular", grasa: "Perder grasa", fuerza: "Mejorar la fuerza", resistencia: "Mejorar la resistencia", condicion: "Mejorar la condición física" };
const CAT = { entrenamiento: "Entrenamiento", alimentacion: "Alimentación", recuperacion: "Recuperación" };

export default function Dashboard({ user, go }) {
  const [v, setV] = useState(0), [toast, setToast] = useState(null), [generando, setGenerando] = useState(false);
  const { data, cargando, error } = useLoad(async () => ({ p: await api.perfil(), r: await api.rutina(), s: await api.sesiones(), recs: await api.recomendaciones() }), [v]);
  if (cargando || error) return <Cargando error={error} />;
  const { p, r, s, recs } = data, prox = proximo(r, s);
  const aviso = (texto, tipo) => setToast({ texto, tipo, id: Date.now() });
  const generar = async () => {
    setGenerando(true);
    try { await api.generarRecomendaciones(); setV(v + 1); aviso("Recomendaciones actualizadas.", "ok"); } catch (x) { aviso(x.message, "error"); }
    setGenerando(false);
  };
  const cuando = prox && (prox.completa ? `Próxima semana · ${prox.f.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}`
    : prox.vencido ? `Pendiente del ${prox.e.dia.toLowerCase()}` : prox.hoy ? "Hoy" : prox.f.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }));
  return (
    <>
      {toast && <Toast key={toast.id} {...toast} onClose={() => setToast(null)} />}
      <h2>Hola, {user.nombre || "bienvenido"}</h2>
      {!p ? (
        <div className="card empty"><h3>Configura tu perfil</h3><p className="mu">Con tu objetivo, nivel y equipo armamos tu primera rutina.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>
      ) : (
        <div className="grid3">
          <article className="card"><small className="mu">Tu objetivo</small><h3>{OBJ[p.objetivo]}</h3><p className="mu">{r ? `${r.length} entrenamientos por semana` : ""}</p></article>
          <article className="card"><small className="mu">Próximo entrenamiento</small>
            {prox ? <>
              {prox.completa && <p className="ok">¡Completaste tu semana!</p>}
              <h3>{prox.e.nombre}</h3>
              <p className="mu">{cuando} · {prox.e.ejercicios.length} ejercicios</p>
              {!prox.completa && <button className="btn sm" onClick={() => go("entrenar", prox.idx)}>{prox.vencido ? "Hacerlo ahora" : "Empezar"}</button>}
            </> : <p className="mu">Aún sin entrenamientos programados.</p>}
          </article>
          <article className="card"><small className="mu">Últimas sesiones</small>{s.length ? s.slice(0, 3).map((x) => <p key={x.id_sesion}>{x.nombre_entrenamiento} <span className="mu">· esfuerzo {x.esfuerzo_percibido}/10</span></p>) : <p className="mu">Todavía no registras sesiones.</p>}</article>
        </div>
      )}
      <div className="row between" style={{ margin: "1.5rem 0 .8rem" }}>
        <h3 style={{ margin: 0 }}>Recomendaciones personalizadas</h3>
        {p && <button className="btn sm" disabled={generando} onClick={generar}>{generando ? "Generando…" : recs.length ? "Actualizar con IA" : "Generar con IA"}</button>}
      </div>
      {recs.length ? <div className="grid3">{recs.map((x) => <article key={x.id_recomendacion} className="card ia"><span className="pill">{CAT[x.categoria] || x.categoria}</span><h3 style={{ marginTop: ".6rem" }}>{x.titulo}</h3><p>{x.descripcion}</p><p className="mu"><b>Por qué:</b> {x.motivo}</p><p className="mu"><b>Qué hacer:</b> {x.accion_sugerida}</p></article>)}</div>
        : <article className="card ia"><p className="mu">{p ? "Aún no tienes recomendaciones. Pulsa «Generar con IA» para recibirlas." : "Configura tu perfil para recibir recomendaciones."}</p></article>}
      <p className="mu"><small>Las recomendaciones las genera una IA y son orientativas: no reemplazan a un profesional de la salud.</small></p>
    </>
  );
}
