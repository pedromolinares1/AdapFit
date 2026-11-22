// CONTRATO CON EL BACKEND (FastAPI). Cada función = un endpoint. Nombres de campos = columnas del modelo de datos.
// Autenticación: el backend devuelve un token; se envía como "Authorization: Bearer <token>".
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const REPDB = "https://exercise-dataset.com"; // RepDB: archivos estáticos (no es una API con llaves)

async function http(ruta, metodo = "GET", cuerpo) {
  const t = localStorage.getItem("adaptfit_token");
  let r;
  try {
    r = await fetch(BASE + ruta, { method: metodo, headers: { "Content-Type": "application/json", ...(t && { Authorization: `Bearer ${t}` }) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  } catch { throw new Error("No hay conexión con el servidor."); }
  if (r.status === 204) return null;
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : "No se pudo completar la solicitud.");
  return d;
}
const guardarToken = (d) => { localStorage.setItem("adaptfit_token", d.token); return d.usuario; };

// ---- RepDB: se descarga el JSON una vez y se traduce al formato de nuestra tabla "ejercicio" ----
let cacheRepdb = null;
const NIVEL = { beginner: "principiante", intermediate: "intermedio", advanced: "avanzado" };
const equipo = (e) => (!e || /body/.test(e) ? "peso corporal" : /dumbbell|kettlebell/.test(e) ? "mancuernas" : /band/.test(e) ? "bandas elásticas" : "gimnasio");
const aNuestro = (x) => ({
  repdb_id: x.id, nombre: x.name_es || x.name_en, descripcion: x.description_es || "", grupo_muscular: x.body_part || "",
  dificultad: NIVEL[x.difficulty] || "principiante", equipamiento: equipo(x.equipment),
  instrucciones: (x.instructions_es || []).join(" "), imagen_url: `${REPDB}/${x.images?.flat?.start || x.images?.flat?.main || ""}`,
});

const api = {
  hayToken: () => !!localStorage.getItem("adaptfit_token"),
  // Caso 1 y 2
  registro: (correo, contrasena, acepta_politica) => http("/auth/registro", "POST", { correo, contrasena, acepta_politica }).then(guardarToken), // POST /auth/registro
  login: (correo, contrasena) => http("/auth/login", "POST", { correo, contrasena }).then(guardarToken),                                        // POST /auth/login
  logout: () => localStorage.removeItem("adaptfit_token"),
  me: () => http("/usuarios/yo"),                                  // GET  -> {id_usuario,nombre,correo,rol,estado,fecha_autorizacion}
  actualizarUsuario: (d) => http("/usuarios/yo", "PUT", d),        // PUT  {nombre,correo}
  // Caso 3
  perfil: () => http("/perfil").catch(() => null),                 // GET  -> {objetivo,nivel,dias_disponibles[],equipamiento[],tipo_alimentacion,alimentos_evitar} | 404
  guardarPerfil: async ({ nombre, ...perfil }) => { await http("/usuarios/yo", "PUT", { nombre }); return http("/perfil", "PUT", perfil); },
  // Caso 4: el backend genera y archiva la anterior
  generarRutina: () => http("/rutina/generar", "POST"),
  rutina: () => http("/rutina/activa").then((r) => r.entrenamientos).catch(() => null), // -> [{nombre,dia,ejercicios:[{id_ejercicio,nombre,imagen_url,series,repeticiones,descanso_segundos,carga_sugerida,instrucciones}]}]
  // Caso 5
  guardarSesion: (s) => http("/sesiones", "POST", s),              // {dia_entrenamiento,nombre_entrenamiento,esfuerzo_percibido,ejercicios:[{id_ejercicio,realizado,repeticiones_realizadas,peso}]}
  sesiones: () => http("/sesiones"),                               // -> [{id_sesion,fecha,dia_entrenamiento,nombre_entrenamiento,esfuerzo_percibido,ejercicios_realizados,ejercicios_total}]
  // Caso 6
  solicitudes: () => http("/solicitudes"),                         // -> [{id_solicitud,tipo,estado,fecha}]
  solicitarEliminacion: () => http("/solicitudes", "POST", { tipo: "eliminacion" }),
  cancelarSolicitud: (id) => http(`/solicitudes/${id}`, "DELETE"),
  // Caso 7 (solo rol admin)
  ejercicios: () => http("/ejercicios"),
  crearEjercicio: (e) => http("/ejercicios", "POST", e),
  editarEjercicio: (id, e) => http(`/ejercicios/${id}`, "PUT", e),
  activarEjercicio: (id, activo) => http(`/ejercicios/${id}/activo`, "PATCH", { activo }),
  buscarRepdb: async (texto) => {
    if (!cacheRepdb) { try { cacheRepdb = (await (await fetch(`${REPDB}/exercises.json`)).json()).exercises; } catch { throw new Error("No se pudo cargar el catálogo de RepDB."); } }
    const q = texto.toLowerCase();
    return cacheRepdb.filter((x) => [x.name_es, x.name_en, x.body_part, x.equipment].join(" ").toLowerCase().includes(q)).slice(0, 12).map(aNuestro);
  },
  // IA (si falla, el resto de la app sigue funcionando)
  recomendaciones: () => http("/recomendaciones").catch(() => []), // -> [{id_recomendacion,categoria,titulo,descripcion,motivo,accion_sugerida}]
};
export default api;
