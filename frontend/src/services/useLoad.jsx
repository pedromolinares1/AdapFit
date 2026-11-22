import { useEffect, useState } from "react";
// Carga datos de la API: devuelve {data, cargando, error}
export default function useLoad(fn, deps = []) {
  const [s, setS] = useState({ data: null, cargando: true, error: "" });
  useEffect(() => {
    let vivo = true;
    fn().then((data) => vivo && setS({ data, cargando: false, error: "" })).catch((e) => vivo && setS({ data: null, cargando: false, error: e.message }));
    return () => { vivo = false; };
  }, deps);
  return s;
}
export const Cargando = ({ error }) => (error ? <p className="err" role="alert">{error}</p> : <p className="mu">Cargando…</p>);
