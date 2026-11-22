# Casos de uso 1 y 2: registro con consentimiento, inicio de sesión y datos del usuario.
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import crear_token, hashear, usuario_actual, verificar
from ..database import get_db
from ..models import AutorizacionDatos, Usuario
from ..schemas import LoginIn, RegistroIn, TokenOut, UsuarioActualizar, UsuarioOut

auth_router = APIRouter(prefix="/auth", tags=["Autenticación"])
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def a_salida(u: Usuario, db: Session) -> UsuarioOut:
    aut = (db.query(AutorizacionDatos)
             .filter_by(id_usuario=u.id_usuario, autorizado=True)
             .order_by(AutorizacionDatos.fecha_autorizacion.desc()).first())
    return UsuarioOut(id_usuario=u.id_usuario, nombre=u.nombre, correo=u.correo, rol=u.rol,
                      estado=u.estado, fecha_autorizacion=aut.fecha_autorizacion if aut else None)


@auth_router.post("/registro", response_model=TokenOut)
def registro(datos: RegistroIn, db: Session = Depends(get_db)):
    # Sin consentimiento no se guarda ningún dato personal
    if not datos.acepta_politica:
        raise HTTPException(400, "Debes aceptar la política de tratamiento de datos para registrarte.")
    correo = datos.correo.lower()
    if db.query(Usuario).filter_by(correo=correo).first():
        raise HTTPException(400, "Ese correo ya está registrado. Inicia sesión.")
    usuario = Usuario(correo=correo, contrasena_hash=hashear(datos.contrasena))
    db.add(usuario)
    db.flush()  # genera el id_usuario sin cerrar la transacción
    db.add(AutorizacionDatos(id_usuario=usuario.id_usuario, autorizado=True, fecha_autorizacion=datetime.now()))
    db.commit()
    return TokenOut(token=crear_token(usuario.id_usuario), usuario=a_salida(usuario, db))


@auth_router.post("/login", response_model=TokenOut)
def login(datos: LoginIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter_by(correo=datos.correo.lower()).first()
    if not usuario or not verificar(datos.contrasena, usuario.contrasena_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos.")
    return TokenOut(token=crear_token(usuario.id_usuario), usuario=a_salida(usuario, db))


@router.get("/yo", response_model=UsuarioOut)
def mis_datos(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    return a_salida(usuario, db)


@router.put("/yo", response_model=UsuarioOut)
def actualizar_mis_datos(cambios: UsuarioActualizar, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    datos = cambios.model_dump(exclude_unset=True)
    if datos.get("correo"):
        nuevo = datos["correo"].lower()
        otro = db.query(Usuario).filter_by(correo=nuevo).first()
        if otro and otro.id_usuario != usuario.id_usuario:
            raise HTTPException(400, "Ese correo ya está en uso.")
        usuario.correo = nuevo
    if "nombre" in datos:
        usuario.nombre = datos["nombre"]
    db.commit()
    return a_salida(usuario, db)
