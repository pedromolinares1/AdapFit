# Caso de uso 5: registrar sesiones de entrenamiento y consultar el historial (solo las propias).
from datetime import date, datetime, time
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import usuario_actual
from ..database import get_db
from ..models import Ejercicio, RegistroEjercicio, Rutina, SesionEntrenamiento, Usuario
from ..schemas import SesionIn, SesionOut

router = APIRouter(prefix="/sesiones", tags=["Sesiones de entrenamiento"])


def a_salida(s: SesionEntrenamiento) -> SesionOut:
    return SesionOut(id_sesion=s.id_sesion, fecha=s.fecha, dia_entrenamiento=s.dia_entrenamiento, nombre_entrenamiento=s.nombre_entrenamiento,
                     esfuerzo_percibido=s.esfuerzo_percibido, ejercicios_realizados=sum(1 for r in s.registros if r.realizado),
                     ejercicios_total=len(s.registros))


@router.post("", response_model=SesionOut)
def registrar(datos: SesionIn, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    ids = {r.id_ejercicio for r in datos.ejercicios}
    if db.query(Ejercicio).filter(Ejercicio.id_ejercicio.in_(ids)).count() != len(ids):
        raise HTTPException(400, "Alguno de los ejercicios no existe.")
    # El usuario puede indicar que hizo el entrenamiento otro día (por ejemplo, lo movió del lunes al martes)
    hoy = date.today()
    if datos.fecha and datos.fecha > hoy:
        raise HTTPException(400, "La fecha del entrenamiento no puede ser futura.")
    if datos.fecha and (hoy - datos.fecha).days > 30:
        raise HTTPException(400, "Solo puedes registrar entrenamientos de los últimos 30 días.")
    momento = datetime.now() if (not datos.fecha or datos.fecha == hoy) else datetime.combine(datos.fecha, time(12, 0))
    rutina = db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa").order_by(Rutina.fecha_creacion.desc()).first()
    sesion = SesionEntrenamiento(id_usuario=usuario.id_usuario, id_rutina=rutina.id_rutina if rutina else None, fecha=momento,
                                 dia_entrenamiento=datos.dia_entrenamiento, nombre_entrenamiento=datos.nombre_entrenamiento,
                                 duracion_minutos=datos.duracion_minutos, esfuerzo_percibido=datos.esfuerzo_percibido)
    sesion.registros = [RegistroEjercicio(**r.model_dump()) for r in datos.ejercicios]
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return a_salida(sesion)


@router.get("", response_model=List[SesionOut])
def historial(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    sesiones = db.query(SesionEntrenamiento).filter_by(id_usuario=usuario.id_usuario).order_by(SesionEntrenamiento.fecha.desc()).all()
    return [a_salida(s) for s in sesiones]


@router.get("/{id_sesion}")
def detalle(id_sesion: int, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    """Detalle de una sesión propia: lo registrado en cada ejercicio y, para comparar, el último registro anterior del mismo ejercicio."""
    s = db.query(SesionEntrenamiento).filter_by(id_sesion=id_sesion, id_usuario=usuario.id_usuario).first()
    if not s:
        raise HTTPException(404, "La sesión no existe.")
    filas = []
    for r in s.registros:
        ej = db.get(Ejercicio, r.id_ejercicio)
        previo = (db.query(RegistroEjercicio, SesionEntrenamiento)
                    .join(SesionEntrenamiento, RegistroEjercicio.id_sesion == SesionEntrenamiento.id_sesion)
                    .filter(SesionEntrenamiento.id_usuario == usuario.id_usuario, RegistroEjercicio.id_ejercicio == r.id_ejercicio,
                            RegistroEjercicio.realizado == True, SesionEntrenamiento.fecha < s.fecha)  # noqa: E712
                    .order_by(SesionEntrenamiento.fecha.desc()).first())
        filas.append({"id_ejercicio": r.id_ejercicio, "nombre": ej.nombre if ej else "Ejercicio eliminado", "realizado": r.realizado,
                      "series_realizadas": r.series_realizadas, "repeticiones_realizadas": r.repeticiones_realizadas, "peso": r.peso,
                      "anterior": {"fecha": previo[1].fecha, "series_realizadas": previo[0].series_realizadas,
                                   "repeticiones_realizadas": previo[0].repeticiones_realizadas, "peso": previo[0].peso} if previo else None})
    return {"id_sesion": s.id_sesion, "fecha": s.fecha, "nombre_entrenamiento": s.nombre_entrenamiento, "dia_entrenamiento": s.dia_entrenamiento,
            "esfuerzo_percibido": s.esfuerzo_percibido, "ejercicios": filas}
