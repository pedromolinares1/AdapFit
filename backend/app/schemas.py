# Esquemas Pydantic: validan los datos que entran y definen los que salen de la API.
from datetime import date, datetime
from typing import List, Literal, Optional
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


# ---- Perfil de entrenamiento (Caso 3) ----
Objetivo = Literal["masa", "grasa", "fuerza", "resistencia", "condicion"]
DiaSemana = Literal["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


class PerfilIn(BaseModel):
    objetivo: Objetivo
    nivel: Dificultad
    dias_disponibles: List[DiaSemana] = Field(min_length=1)
    equipamiento: List[Equipamiento] = Field(min_length=1)
    edad: int = Field(ge=14, le=100)  # obligatoria
    peso_kg: Optional[float] = Field(default=None, ge=30, le=300)
    altura_cm: Optional[float] = Field(default=None, ge=100, le=250)
    tipo_alimentacion: Optional[str] = ""
    alimentos_evitar: Optional[str] = ""


class PerfilOut(PerfilIn):
    edad: Optional[int] = None  # perfiles antiguos pueden no tenerla; al guardar se exige
    model_config = {"from_attributes": True}


# ---- Sesiones de entrenamiento (Caso 5) ----
class RegistroEjercicioIn(BaseModel):
    id_ejercicio: int
    realizado: bool = False
    series_realizadas: Optional[int] = Field(default=None, ge=0, le=50)
    repeticiones_realizadas: Optional[int] = Field(default=None, ge=0, le=1000)
    peso: Optional[float] = Field(default=None, ge=0, le=1000)
    tiempo_segundos: Optional[int] = Field(default=None, ge=0)


class SesionIn(BaseModel):
    dia_entrenamiento: Optional[str] = None
    nombre_entrenamiento: str
    fecha: Optional[date] = None       # día real en que se hizo (si no, hoy)
    esfuerzo_percibido: int = Field(ge=1, le=10)
    duracion_minutos: Optional[int] = Field(default=None, ge=0, le=600)
    ejercicios: List[RegistroEjercicioIn] = Field(min_length=1)


class SesionOut(BaseModel):
    id_sesion: int
    fecha: datetime
    dia_entrenamiento: Optional[str] = None
    nombre_entrenamiento: Optional[str] = None
    esfuerzo_percibido: Optional[int] = None
    ejercicios_realizados: int
    ejercicios_total: int


class GenerarRutinaIn(BaseModel):
    distribucion: Optional[str] = None
    cambiar_ejercicios: bool = False   # evita repetir los ejercicios de la rutina actual
    mas_suave: bool = False            # usa ejercicios un nivel por debajo del nivel del usuario


# ---- Solicitudes de datos (Caso 6) ----
class SolicitudIn(BaseModel):
    tipo: Literal["eliminacion", "rectificacion"]


class SolicitudOut(BaseModel):
    id_solicitud: int
    tipo: str
    estado: str
    fecha: datetime


class SolicitudAdminOut(SolicitudOut):
    correo: str


# ---- Recomendaciones de IA ----
class RecomendacionOut(BaseModel):
    id_recomendacion: int
    categoria: str
    titulo: str
    descripcion: str
    motivo: str
    accion_sugerida: str
    fecha: datetime
    model_config = {"from_attributes": True}
