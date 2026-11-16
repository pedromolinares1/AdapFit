import { useState } from "react";
import api from "../services/api";
const VACIO = { nombre: "", descripcion: "", grupo: "", nivel: "principiante", equipo: "peso corporal", instrucciones: "" };
export default function Admin({ user }) {
  const [lista, setLista] = useState(api.exercises());
  const [f, setF] = useState(VACIO);
  if (user.rol !== "admin") return <div className="card empty"><h3>Sección solo para administradores</h3></div>;
  const guardar = (e) => { e.preventDefault(); api.saveExercise(f); setLista(api.exercises()); setF(VACIO); };
  const alternar = (e) => { api.saveExercise({ id: e.id, activo: !e.activo }); setLista(api.exercises()); };
  const campo = (k, t) => <label>{t}<input required={k === "nombre" || k === "grupo"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <>
      <h2>Catálogo de ejercicios</h2>
      <form className="card form" onSubmit={guardar}>
        <h3>{f.id ? "Editar ejercicio" : "Nuevo ejercicio"}</h3>
        <div className="two">{campo("nombre", "Nombre")}{campo("grupo", "Grupo muscular")}</div>
        <div className="two">
          <label>Nivel<select value={f.nivel} onChange={(e) => setF({ ...f, nivel: e.target.value })}><option>principiante</option><option>intermedio</option><option>avanzado</option></select></label>
          <label>Equipamiento<select value={f.equipo} onChange={(e) => setF({ ...f, equipo: e.target.value })}><option>peso corporal</option><option>mancuernas</option><option>bandas elásticas</option><option>gimnasio</option></select></label>
        </div>
        {campo("descripcion", "Descripción")}{campo("instrucciones", "Instrucciones")}
        <div className="row"><button className="btn">Guardar ejercicio</button>{f.id && <button type="button" className="btn ghost" onClick={() => setF(VACIO)}>Cancelar</button>}</div>
      </form>
      <div className="scroll"><table><thead><tr><th>Ejercicio</th><th>Grupo</th><th>Nivel</th><th>Equipo</th><th>Estado</th><th></th></tr></thead>
        <tbody>{lista.map((e) => <tr key={e.id} className={e.activo ? "" : "off"}><td>{e.nombre}</td><td>{e.grupo}</td><td>{e.nivel}</td><td>{e.equipo}</td><td>{e.activo ? "Activo" : "Inactivo"}</td>
          <td className="row"><button className="btn sm ghost" onClick={() => { setF(e); window.scrollTo(0, 0); }}>Editar</button><button className="btn sm ghost" onClick={() => alternar(e)}>{e.activo ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div>
    </>
  );
}
