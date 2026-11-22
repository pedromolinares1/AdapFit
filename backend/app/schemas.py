# Esquemas Pydantic: validan los datos que entran y definen los que salen de la API.
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class RegistroIn(BaseModel):
    correo: EmailStr
    contrasena: str = Field(min_length=6, max_length=72)
    acepta_politica: bool


class LoginIn(BaseModel):
    correo: str
    contrasena: str


class UsuarioActualizar(BaseModel):
    nombre: Optional[str] = Field(default=None, max_length=100)
    correo: Optional[EmailStr] = None


class UsuarioOut(BaseModel):
    id_usuario: int
    nombre: Optional[str] = None
    correo: str
    rol: str
    estado: str
    fecha_autorizacion: Optional[datetime] = None


class TokenOut(BaseModel):
    token: str
    usuario: UsuarioOut


# ---- Catálogo de ejercicios (Caso 7) ----
Dificultad = Literal["principiante", "intermedio", "avanzado"]
Equipamiento = Literal["peso corporal", "mancuernas", "bandas elásticas", "gimnasio"]


class EjercicioIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: Optional[str] = ""
    grupo_muscular: str = Field(min_length=1, max_length=100)
    dificultad: Dificultad
    equipamiento: Equipamiento
    instrucciones: Optional[str] = ""
    imagen_url: Optional[str] = None
    repdb_id: Optional[str] = None


class EjercicioActivo(BaseModel):
    activo: bool


class EjercicioOut(EjercicioIn):
    id_ejercicio: int
    activo: bool
    model_config = {"from_attributes": True}
