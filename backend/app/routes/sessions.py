# Caso de uso 5: registrar sesiones de entrenamiento y consultar el historial (solo las propias).
from datetime import datetime
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
    rutina = db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa").order_by(Rutina.fecha_creacion.desc()).first()
    sesion = SesionEntrenamiento(id_usuario=usuario.id_usuario, id_rutina=rutina.id_rutina if rutina else None, fecha=datetime.now(),
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
