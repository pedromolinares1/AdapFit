# Caso de uso 4: generar (o volver a generar) y consultar la rutina recomendada.
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import usuario_actual
from ..database import get_db
from ..models import Rutina, Usuario
from ..schemas import GenerarRutinaIn
from ..services.routine_service import ORDEN_DIAS, describir_plan, generar_rutina

router = APIRouter(prefix="/rutina", tags=["Rutina"])


@router.post("/generar")
def generar(opciones: Optional[GenerarRutinaIn] = None, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    """Sin cuerpo: genera la rutina por defecto. Con cuerpo: permite elegir otra distribución o cambiar los ejercicios."""
    o = opciones or GenerarRutinaIn()
    rutina = generar_rutina(db, usuario, o.distribucion, o.cambiar_ejercicios, o.mas_suave)
    return {"id_rutina": rutina.id_rutina}


@router.get("/activa")
def activa(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    rutina = (db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa")
                .order_by(Rutina.fecha_creacion.desc()).first())
    if not rutina:
        raise HTTPException(404, "Aún no tienes una rutina.")
    # Solo se muestran ejercicios activos: si el administrador desactiva uno, deja de aparecer
    detalles = sorted((d for d in rutina.detalles if d.ejercicio.activo), key=lambda d: (ORDEN_DIAS.index(d.dia_entrenamiento), d.orden))
    entrenamientos = {}
    for d in detalles:
        t = entrenamientos.setdefault((d.nombre_entrenamiento, d.dia_entrenamiento),
                                      {"nombre": d.nombre_entrenamiento, "dia": d.dia_entrenamiento, "ejercicios": []})
        t["ejercicios"].append({"id_ejercicio": d.id_ejercicio, "nombre": d.ejercicio.nombre, "grupo_muscular": d.ejercicio.grupo_muscular,
                                "imagen_url": d.ejercicio.imagen_url, "series": d.series, "repeticiones": d.repeticiones,
                                "descanso_segundos": d.descanso_segundos, "carga_sugerida": d.carga_sugerida, "instrucciones": d.ejercicio.instrucciones})
    n_dias = len({d.dia_entrenamiento for d in rutina.detalles})
    return {"id_rutina": rutina.id_rutina, "nombre": rutina.nombre, "estado": rutina.estado, "fecha_creacion": rutina.fecha_creacion,
            "plan": describir_plan(n_dias, rutina.distribucion), "entrenamientos": list(entrenamientos.values())}
