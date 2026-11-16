// Capa de servicios. HOY guarda datos en localStorage para poder probar el frontend sin backend.
// Cuando exista FastAPI, solo se reemplaza el interior de cada función por un fetch() (mismos nombres).
// Admin de prueba: admin@adaptfit.com / Admin123
const K = "adaptfit_db";
const NIV = ["principiante", "intermedio", "avanzado"];
const EX = [
  ["Sentadilla con peso corporal", "piernas", "principiante", "peso corporal"],
  ["Flexiones", "pecho", "principiante", "peso corporal"],
  ["Plancha", "core", "principiante", "peso corporal"],
  ["Zancadas con mancuernas", "piernas", "intermedio", "mancuernas"],
  ["Press de pecho con mancuernas", "pecho", "principiante", "mancuernas"],
  ["Remo con mancuerna", "espalda", "principiante", "mancuernas"],
  ["Remo con banda elástica", "espalda", "principiante", "bandas elásticas"],
  ["Press militar con mancuernas", "hombros", "intermedio", "mancuernas"],
  ["Sentadilla con barra", "piernas", "intermedio", "gimnasio"],
  ["Peso muerto", "espalda", "avanzado", "gimnasio"],
  ["Jalón al pecho", "espalda", "principiante", "gimnasio"],
  ["Curl con banda elástica", "brazos", "principiante", "bandas elásticas"],
].map((e, i) => ({ id: i + 1, nombre: e[0], descripcion: "", grupo: e[1], nivel: e[2], equipo: e[3],
  instrucciones: "Controla el movimiento y mantén la espalda neutra.", activo: true }));
const PARAMS = { masa: { series: 4, reps: "8-12", descanso: 90 }, grasa: { series: 3, reps: "12-15", descanso: 60 }, condicion: { series: 3, reps: "15-20", descanso: 45 } };

const save = (d) => localStorage.setItem(K, JSON.stringify(d));
const db = () => {
  let d = JSON.parse(localStorage.getItem(K) || "null");
  if (!d) { d = { users: [{ id: 1, email: "admin@adaptfit.com", password: "Admin123", rol: "admin" }], sessions: [], exercises: EX, token: null }; save(d); }
  return d;
};
const cur = (d) => d.users.find((u) => u.id === d.token) || null;

const api = {
  me: () => cur(db()),
  register({ email, password, consent }) {
    const d = db();
    if (!consent) throw new Error("Debes aceptar la política de tratamiento de datos para registrarte.");
    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
    if (d.users.some((u) => u.email === email)) throw new Error("Ese correo ya está registrado. Inicia sesión.");
    const u = { id: Date.now(), email, password, rol: "usuario", consentimiento: new Date().toISOString(), perfil: null, eliminacion: null };
    d.users.push(u); d.token = u.id; save(d); return u;
  },
  login(email, password) {
    const d = db(); const u = d.users.find((x) => x.email === email && x.password === password);
    if (!u) throw new Error("Correo o contraseña incorrectos.");
    d.token = u.id; save(d); return u;
  },
  logout() { const d = db(); d.token = null; save(d); },
  updateUser(cambios) { const d = db(); const u = cur(d); Object.assign(u, cambios); save(d); return u; },
  // Rutina generada con reglas propias: filtra por nivel, equipo y ejercicios activos
  routine() {
    const d = db(); const u = cur(d); const p = u && u.perfil; if (!p || !p.dias.length) return null;
    const pool = d.exercises.filter((e) => e.activo && NIV.indexOf(e.nivel) <= NIV.indexOf(p.nivel) && (e.equipo === "peso corporal" || p.equipo.includes(e.equipo)));
    const n = p.dias.length, par = PARAMS[p.objetivo];
    return p.dias.map((dia, k) => {
      let lista = pool.filter((_, i) => i % n === k).slice(0, 4);
      if (!lista.length) lista = pool.slice(0, 4);
      return { nombre: `Entrenamiento ${String.fromCharCode(65 + k)}`, dia, ejercicios: lista.map((e) => ({ ...e, ...par })) };
    });
  },
  saveSession(s) { const d = db(); d.sessions.push({ ...s, id: Date.now(), userId: d.token, fecha: new Date().toISOString() }); save(d); },
  sessions() { const d = db(); return d.sessions.filter((s) => s.userId === d.token).reverse(); },
  exercises() { return db().exercises; },
  saveExercise(e) {
    const d = db(); if (cur(d)?.rol !== "admin") throw new Error("Sin permiso.");
    if (e.id) d.exercises = d.exercises.map((x) => (x.id === e.id ? { ...x, ...e } : x));
    else d.exercises.push({ ...e, id: Date.now(), activo: true });
    save(d);
  },
};
export default api;
