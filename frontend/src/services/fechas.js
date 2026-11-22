// Lógica de semanas: una semana va de lunes a domingo. Un entrenamiento cuenta como hecho esa semana
// aunque se haya hecho otro día distinto al programado.
export const SEM = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const clave = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
export const dia0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const lunes = (d) => { const x = dia0(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
export const mismaSemana = (a, b) => clave(lunes(a)) === clave(lunes(b));
// Fecha en que estaba programado "dia" dentro de la semana de "ref"
export const fechaProgramada = (dia, ref) => { const x = lunes(ref); x.setDate(x.getDate() + ORDEN.indexOf(dia)); return x; };
// Para cada entrenamiento de la rutina: la sesión que lo cumplió esa semana (en cualquier día) o null
export const estadoSemana = (r, s, ref) => r.map((e, idx) => ({ e, idx, sesion: s.find((x) => x.nombre_entrenamiento === e.nombre && mismaSemana(new Date(x.fecha), ref)) || null }));
// Próximo entrenamiento: el primero de la rutina que aún no se hizo esta semana (si se atrasó, sigue saliendo hasta hacerlo)
export function proximo(r, s) {
  if (!r || !r.length) return null;
  const hoy = dia0(new Date());
  const pend = estadoSemana(r, s, hoy).filter((x) => !x.sesion);
  if (pend.length) {
    const f = fechaProgramada(pend[0].e.dia, hoy);
    return { idx: pend[0].idx, e: pend[0].e, f, hoy: clave(f) === clave(hoy), vencido: f < hoy, completa: false };
  }
  const f = fechaProgramada(r[0].dia, new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7));
  return { idx: 0, e: r[0], f, hoy: false, vencido: false, completa: true };
}
