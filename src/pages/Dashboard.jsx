import api from "../services/api";
const OBJ = { masa: "Ganar masa muscular", grasa: "Perder grasa", condicion: "Mejorar la condición física" };
export default function Dashboard({ user, go }) {
  const r = api.routine(), s = api.sessions();
  const proximo = r ? r[s.length % r.length] : null;
  return (
    <>
      <h2>Hola, {user.email.split("@")[0]}</h2>
      {!user.perfil ? (
        <div className="card empty"><h3>Configura tu perfil</h3><p className="mu">Con tu objetivo, nivel y equipo armamos tu primera rutina.</p><button className="btn" onClick={() => go("perfil")}>Configurar perfil</button></div>
      ) : (
        <div className="grid3">
          <article className="card"><small className="mu">Tu objetivo</small><h3>{OBJ[user.perfil.objetivo]}</h3><p className="mu">{r ? `${r.length} entrenamientos por semana` : ""}</p></article>
          <article className="card"><small className="mu">Próximo entrenamiento</small>{proximo ? <><h3>{proximo.nombre}</h3><p className="mu">{proximo.dia} · {proximo.ejercicios.length} ejercicios</p><button className="btn sm" onClick={() => go("entrenar", s.length % r.length)}>Empezar</button></> : <p className="mu">Aún sin ejercicios disponibles.</p>}</article>
          <article className="card"><small className="mu">Últimas sesiones</small>{s.length ? s.slice(0, 3).map((x) => <p key={x.id}>{x.entrenamiento} <span className="mu">· esfuerzo {x.esfuerzo}/10</span></p>) : <p className="mu">Todavía no registras sesiones.</p>}</article>
        </div>
      )}
      <article className="card ia"><small className="pill">Recomendaciones de IA</small><p className="mu">Aquí aparecerán tus recomendaciones de entrenamiento, alimentación y recuperación cuando conectemos el backend con la IA.</p></article>
    </>
  );
}
