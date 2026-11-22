# Caso de uso 3: perfil de entrenamiento del usuario (uno por usuario).
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import usuario_actual
from ..database import get_db
from ..models import PerfilEntrenamiento, Usuario
from ..schemas import PerfilIn, PerfilOut

router = APIRouter(prefix="/perfil", tags=["Perfil de entrenamiento"])


@router.get("", response_model=PerfilOut)
def consultar(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    perfil = db.query(PerfilEntrenamiento).filter_by(id_usuario=usuario.id_usuario).first()
    if not perfil:
        raise HTTPException(404, "Aún no configuras tu perfil.")
    return perfil


@router.put("", response_model=PerfilOut)
def guardar(datos: PerfilIn, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    """Crea el perfil si no existe; si existe, lo actualiza."""
    perfil = db.query(PerfilEntrenamiento).filter_by(id_usuario=usuario.id_usuario).first()
    if not perfil:
        perfil = PerfilEntrenamiento(id_usuario=usuario.id_usuario)
        db.add(perfil)
    for campo, valor in datos.model_dump().items():
        setattr(perfil, campo, valor)
    db.commit()
    db.refresh(perfil)
    return perfil
