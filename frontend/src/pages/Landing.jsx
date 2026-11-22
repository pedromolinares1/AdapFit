const PASOS = [
  ["Perfil inicial", "Empieza en un minuto", "Indicas tu nivel, tu objetivo y los días que tienes disponibles. Nada de formularios eternos."],
  ["Registro simple", "Anota lo que sentiste", "Series, repeticiones y qué tan difícil fue el entrenamiento. Eso es todo lo que necesitamos."],
  ["Ajuste automático", "Tu plan se recalibra solo", "La semana siguiente, la rutina ya refleja tu progreso real, sin que tengas que reprogramarla tú."],
];
export default function Landing({ go }) {
  return (
    <>
      <section className="hero">
        <div>
          <h1>Tu rutina se adapta a ti, no al revés.</h1>
          <p className="lead">Cuéntale a AdaptFit tu nivel, tu objetivo y tu equipo disponible. Cada semana, tu plan se recalibra solo según lo que registraste, sin que tengas que pensarlo.</p>
          <div className="row">
            <button className="btn lg" onClick={() => go("registro")}>Comenzar gratis</button>
            <button className="btn ghost lg" onClick={() => document.getElementById("como").scrollIntoView({ behavior: "smooth" })}>Ver cómo funciona</button>
          </div>
        </div>
        <div className="card chart">
          <span className="pill">+18% carga en 4 semanas</span>
          <div className="chart-h"><small>Progreso de tu rutina</small><b>Semana 4</b></div>
          <div className="bars">{[38, 58, 74, 100].map((h, i) => <div key={i} className="bar-c"><div className="bar" style={{ "--h": h + "%", "--d": i * 0.15 + "s" }} /><small>Sem {i + 1}</small></div>)}</div>
        </div>
      </section>
      <section id="como" className="grid3">
        {PASOS.map(([a, t, d]) => <article key={t} className="card step"><small className="mu">{a}</small><h3>{t}</h3><p className="mu">{d}</p></article>)}
      </section>
    </>
  );
}
