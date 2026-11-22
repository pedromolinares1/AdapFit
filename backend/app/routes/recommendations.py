# Recomendaciones personalizadas generadas con IA (complementan la rutina).
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import usuario_actual
from ..database import get_db
from ..models import RecomendacionIA, Usuario
from ..schemas import RecomendacionOut
from ..services.recommendation_service import generar_recomendaciones

router = APIRouter(prefix="/recomendaciones", tags=["Recomendaciones de IA"])


@router.get("", response_model=List[RecomendacionOut])
def mis_recomendaciones(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    return db.query(RecomendacionIA).filter_by(id_usuario=usuario.id_usuario).order_by(RecomendacionIA.id_recomendacion).all()


@router.post("/generar", response_model=List[RecomendacionOut])
def generar(usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    return generar_recomendaciones(db, usuario)
