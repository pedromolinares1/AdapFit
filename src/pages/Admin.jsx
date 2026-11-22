import { useState } from "react";
import api from "../services/api";
import useLoad, { Cargando } from "../services/useLoad";
const VACIO = { nombre: "", descripcion: "", grupo_muscular: "", dificultad: "principiante", equipamiento: "peso corporal", instrucciones: "" };
export default function Admin({ user }) {
  const [v, setV] = useState(0);
  const { data: lista, cargando, error } = useLoad(() => api.ejercicios(), [v]);
  const [f, setF] = useState(VACIO), [msg, setMsg] = useState(""), [q, setQ] = useState(""), [res, setRes] = useState([]);
  if (user.rol !== "admin") return <div className="card empty"><h3>Sección solo para administradores</h3></div>;
  const run = async (fn, ok) => { try { await fn(); setV(v + 1); setMsg(ok); } catch (x) { setMsg(x.message); } };
  const guardar = (e) => { e.preventDefault(); run(async () => { f.id_ejercicio ? await api.editarEjercicio(f.id_ejercicio, f) : await api.crearEjercicio(f); setF(VACIO); }, "Ejercicio guardado."); };
  const buscar = async (e) => { e.preventDefault(); try { setRes(await api.buscarRepdb(q)); setMsg(""); } catch (x) { setMsg(x.message); } };
  const campo = (k, t) => <label>{t}<input required={k === "nombre" || k === "grupo_muscular"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <>
      <h2>Catálogo de ejercicios</h2>
      {msg && <p role="status" className="ok">{msg}</p>}
      <form className="card form" onSubmit={buscar}>
        <h3>Importar desde RepDB</h3>
        <div className="row"><input value={q} placeholder="Busca por nombre, músculo o equipo (en inglés o español)" onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} /><button className="btn">Buscar</button></div>
        <div className="grid3">{res.map((x) => <article key={x.repdb_id} className="card"><img className="thumb" src={x.imagen_url} alt="" loading="lazy" /><b>{x.nombre}</b><p className="mu">{x.grupo_muscular} · {x.dificultad} · {x.equipamiento}</p><button type="button" className="btn sm" onClick={() => run(() => api.crearEjercicio(x), "Ejercicio agregado desde RepDB.")}>Agregar al catálogo</button></article>)}</div>
      </form>
      <form className="card form" onSubmit={guardar}>
        <h3>{f.id_ejercicio ? "Editar ejercicio" : "Nuevo ejercicio"}</h3>
        <div className="two">{campo("nombre", "Nombre")}{campo("grupo_muscular", "Grupo muscular")}</div>
        <div className="two">
          <label>Dificultad<select value={f.dificultad} onChange={(e) => setF({ ...f, dificultad: e.target.value })}><option>principiante</option><option>intermedio</option><option>avanzado</option></select></label>
          <label>Equipamiento<select value={f.equipamiento} onChange={(e) => setF({ ...f, equipamiento: e.target.value })}><option>peso corporal</option><option>mancuernas</option><option>bandas elásticas</option><option>gimnasio</option></select></label>
        </div>
        {campo("descripcion", "Descripción")}{campo("instrucciones", "Instrucciones")}
        <div className="row"><button className="btn">Guardar ejercicio</button>{f.id_ejercicio && <button type="button" className="btn ghost" onClick={() => setF(VACIO)}>Cancelar</button>}</div>
      </form>
      {cargando || error ? <Cargando error={error} /> : (
        <div className="scroll"><table><thead><tr><th>Ejercicio</th><th>Grupo</th><th>Dificultad</th><th>Equipo</th><th>Estado</th><th></th></tr></thead>
          <tbody>{lista.map((e) => <tr key={e.id_ejercicio} className={e.activo ? "" : "off"}><td>{e.nombre}</td><td>{e.grupo_muscular}</td><td>{e.dificultad}</td><td>{e.equipamiento}</td><td>{e.activo ? "Activo" : "Inactivo"}</td>
            <td className="row"><button className="btn sm ghost" onClick={() => { setF(e); window.scrollTo(0, 0); }}>Editar</button><button className="btn sm ghost" onClick={() => run(() => api.activarEjercicio(e.id_ejercicio, !e.activo), "Estado actualizado.")}>{e.activo ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div>
      )}
    </>
  );
}
