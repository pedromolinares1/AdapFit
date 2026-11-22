export const SEM = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const clave = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
// Próximo entrenamiento según los días de la rutina y las sesiones ya hechas
export function proximo(r, s) {
  if (!r) return null;
  const hoy = new Date(), hecho = s.some((x) => clave(new Date(x.fecha)) === clave(hoy));
  for (let i = hecho ? 1 : 0; i < 8; i++) {
    const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    const idx = r.findIndex((e) => e.dia === SEM[f.getDay()]);
    if (idx >= 0) return { idx, e: r[idx], f, hoy: i === 0 };
  }
  return null;
}
