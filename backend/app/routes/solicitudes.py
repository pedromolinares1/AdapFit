# Caso de uso 6: solicitudes de rectificación o eliminación de datos.
# El usuario las registra y puede cancelarlas; el administrador las atiende (la eliminación borra la cuenta y sus datos).
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import solo_admin, usuario_actual
from ..database import get_db
from ..models import (AutorizacionDatos, DetalleRutina, RecomendacionIA, RegistroEjercicio, Rutina, SesionEntrenamiento,
                      SolicitudDatos, Usuario)
from ..schemas import SolicitudAdminOut, SolicitudIn, SolicitudOut

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes de datos"])


def eliminar_datos(db: Session, u: Usuario):
    """Borra la cuenta y toda la información asociada al usuario."""
    sesiones = [s.id_sesion for s in db.query(SesionEntrenamiento).filter_by(id_usuario=u.id_usuario)]
    rutinas = [r.id_rutina for r in db.query(Rutina).filter_by(id_usuario=u.id_usuario)]
    if sesiones:
        db.query(RegistroEjercicio).filter(RegistroEjercicio.id_sesion.in_(sesiones)).delete(synchronize_session=False)
    db.query(SesionEntrenamiento).filter_by(id_usuario=u.id_usuario).delete()
    if rutinas:
        db.query(DetalleRutina).filter(DetalleRutina.id_rutina.in_(rutinas)).delete(synchronize_session=False)
    for modelo in (Rutina, AutorizacionDatos, RecomendacionIA):
        db.query(modelo).filter_by(id_usuario=u.id_usuario).delete()
    db.delete(u)  # el perfil se borra en cascada


@router.get("", response_model=List[SolicitudOut])
def mis_solicitudes(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    return db.query(SolicitudDatos).filter_by(id_usuario=usuario.id_usuario).order_by(SolicitudDatos.fecha.desc()).all()


@router.post("", response_model=SolicitudOut)
def solicitar(datos: SolicitudIn, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    if db.query(SolicitudDatos).filter_by(id_usuario=usuario.id_usuario, tipo=datos.tipo, estado="pendiente").first():
        raise HTTPException(400, "Ya tienes una solicitud pendiente de este tipo.")
    solicitud = SolicitudDatos(id_usuario=usuario.id_usuario, tipo=datos.tipo, estado="pendiente")
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return solicitud


@router.delete("/{id_solicitud}", status_code=204)
def cancelar(id_solicitud: int, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    solicitud = db.query(SolicitudDatos).filter_by(id_solicitud=id_solicitud, id_usuario=usuario.id_usuario, estado="pendiente").first()
    if not solicitud:
        raise HTTPException(404, "No hay una solicitud pendiente con ese número.")
    solicitud.estado = "cancelada"
    db.commit()


@router.get("/pendientes", response_model=List[SolicitudAdminOut], dependencies=[Depends(solo_admin)])
def pendientes(db: Session = Depends(get_db)):
    filas = (db.query(SolicitudDatos, Usuario).join(Usuario, SolicitudDatos.id_usuario == Usuario.id_usuario)
               .filter(SolicitudDatos.estado == "pendiente").order_by(SolicitudDatos.fecha).all())
    return [SolicitudAdminOut(id_solicitud=s.id_solicitud, tipo=s.tipo, estado=s.estado, fecha=s.fecha, correo=u.correo) for s, u in filas]


@router.post("/{id_solicitud}/atender", dependencies=[Depends(solo_admin)])
def atender(id_solicitud: int, db: Session = Depends(get_db)):
    solicitud = db.query(SolicitudDatos).filter_by(id_solicitud=id_solicitud, estado="pendiente").first()
    if not solicitud:
        raise HTTPException(404, "No hay una solicitud pendiente con ese número.")
    if solicitud.tipo == "eliminacion":
        usuario = db.get(Usuario, solicitud.id_usuario)
        if usuario:
            if usuario.rol == "admin":
                raise HTTPException(400, "No se puede eliminar una cuenta de administrador.")
            eliminar_datos(db, usuario)
    solicitud.estado = "atendida"   # se conserva como constancia de que se atendió
    db.commit()
    return {"estado": "atendida"}
