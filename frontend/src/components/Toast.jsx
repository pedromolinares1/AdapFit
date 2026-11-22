import { useEffect } from "react";
// Ventanita emergente que se cierra sola a los 3,5 s. tipo: "ok" | "aviso" | "error"
export default function Toast({ texto, tipo = "ok", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={"toast " + tipo} role="status" aria-live="polite">
      <span className="toast-ic">{tipo === "ok" ? "✓" : "!"}</span>
      <span>{texto}</span>
      <button onClick={onClose} aria-label="Cerrar aviso">×</button>
    </div>
  );
}
