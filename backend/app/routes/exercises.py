# Caso de uso 7: mantener el catálogo de ejercicios. Todas las rutas exigen rol administrador.
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import solo_admin
from ..database import get_db
from ..models import Ejercicio
from ..schemas import EjercicioActivo, EjercicioIn, EjercicioOut

router = APIRouter(prefix="/ejercicios", tags=["Catálogo de ejercicios"], dependencies=[Depends(solo_admin)])


def buscar(db: Session, id_ejercicio: int) -> Ejercicio:
    ejercicio = db.get(Ejercicio, id_ejercicio)
    if not ejercicio:
        raise HTTPException(404, "El ejercicio no existe.")
    return ejercicio


@router.get("", response_model=List[EjercicioOut])
def listar(db: Session = Depends(get_db)):
    """Consultar: devuelve todos los ejercicios, activos e inactivos."""
    return db.query(Ejercicio).order_by(Ejercicio.nombre).all()


@router.post("", response_model=EjercicioOut)
def crear(datos: EjercicioIn, db: Session = Depends(get_db)):
    # Evita importar dos veces el mismo ejercicio de RepDB
    if datos.repdb_id and db.query(Ejercicio).filter_by(repdb_id=datos.repdb_id).first():
        raise HTTPException(400, "Este ejercicio ya está en el catálogo.")
    ejercicio = Ejercicio(**datos.model_dump(), activo=True)
    db.add(ejercicio)
    db.commit()
    db.refresh(ejercicio)
    return ejercicio


@router.put("/{id_ejercicio}", response_model=EjercicioOut)
def editar(id_ejercicio: int, datos: EjercicioIn, db: Session = Depends(get_db)):
    ejercicio = buscar(db, id_ejercicio)
    for campo, valor in datos.model_dump().items():
        setattr(ejercicio, campo, valor)
    db.commit()
    db.refresh(ejercicio)
    return ejercicio


@router.patch("/{id_ejercicio}/activo", response_model=EjercicioOut)
def activar_o_desactivar(id_ejercicio: int, datos: EjercicioActivo, db: Session = Depends(get_db)):
    """Las rutinas solo usarán ejercicios con activo = true."""
    ejercicio = buscar(db, id_ejercicio)
    ejercicio.activo = datos.activo
    db.commit()
    db.refresh(ejercicio)
    return ejercicio
