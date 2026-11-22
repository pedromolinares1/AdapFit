# Tablas del MVP (modelo de datos cerrado). Cada clase = una tabla.
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base


class Usuario(Base):
    __tablename__ = "usuario"
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String(100))
    correo = Column(String(150), unique=True, nullable=False, index=True)
    contrasena_hash = Column(String(255), nullable=False)  # nunca se guarda la contraseña real
    rol = Column(String(20), default="usuario")             # usuario | admin
    estado = Column(String(30), default="activo")
    fecha_registro = Column(DateTime, default=datetime.now)
    perfil = relationship("PerfilEntrenamiento", uselist=False, cascade="all, delete-orphan")


class AutorizacionDatos(Base):
    __tablename__ = "autorizacion_datos"
    id_autorizacion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    autorizado = Column(Boolean, default=True)
    version_politica = Column(String(20), default="1.0")
    fecha_autorizacion = Column(DateTime, default=datetime.now)


class PerfilEntrenamiento(Base):
    __tablename__ = "perfil_entrenamiento"
    id_perfil = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), unique=True, nullable=False)
    objetivo = Column(String(100))            # masa | grasa | condicion
    nivel = Column(String(50))                # principiante | intermedio | avanzado
    dias_disponibles = Column(JSON, default=list)
    equipamiento = Column(JSON, default=list)
    peso_kg = Column(Float)
    altura_cm = Column(Float)
    tipo_alimentacion = Column(String(100))
    alimentos_evitar = Column(Text)


class Ejercicio(Base):
    __tablename__ = "ejercicio"
    id_ejercicio = Column(Integer, primary_key=True)
    repdb_id = Column(String(100))            # id del ejercicio en RepDB (si fue importado)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    grupo_muscular = Column(String(100))
    dificultad = Column(String(50))
    equipamiento = Column(String(50))
    instrucciones = Column(Text)
    imagen_url = Column(String(300))
    activo = Column(Boolean, default=True)


class Rutina(Base):
    __tablename__ = "rutina"
    id_rutina = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    nombre = Column(String(100))
    objetivo = Column(String(100))
    estado = Column(String(20), default="activa")   # activa | archivada
    fecha_creacion = Column(DateTime, default=datetime.now)
    detalles = relationship("DetalleRutina", cascade="all, delete-orphan")


class DetalleRutina(Base):
    __tablename__ = "detalle_rutina"
    id_detalle = Column(Integer, primary_key=True)
    id_rutina = Column(Integer, ForeignKey("rutina.id_rutina"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("ejercicio.id_ejercicio"), nullable=False)
    nombre_entrenamiento = Column(String(100))
    dia_entrenamiento = Column(String(20))
    series = Column(Integer)
    repeticiones = Column(String(20))
    descanso_segundos = Column(Integer)
    carga_sugerida = Column(Float)             # vacío si no hay información suficiente
    orden = Column(Integer)
    ejercicio = relationship("Ejercicio")


class SesionEntrenamiento(Base):
    __tablename__ = "sesion_entrenamiento"
    id_sesion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_rutina = Column(Integer, ForeignKey("rutina.id_rutina"))
    fecha = Column(DateTime, default=datetime.now)
    dia_entrenamiento = Column(String(20))
    nombre_entrenamiento = Column(String(100))
    duracion_minutos = Column(Integer)
    esfuerzo_percibido = Column(Integer)
    registros = relationship("RegistroEjercicio", cascade="all, delete-orphan")


class RegistroEjercicio(Base):
    __tablename__ = "registro_ejercicio"
    id_registro = Column(Integer, primary_key=True)
    id_sesion = Column(Integer, ForeignKey("sesion_entrenamiento.id_sesion"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("ejercicio.id_ejercicio"), nullable=False)
    realizado = Column(Boolean, default=False)
    repeticiones_realizadas = Column(Integer)
    peso = Column(Float)
    tiempo_segundos = Column(Integer)


class SolicitudDatos(Base):
    __tablename__ = "solicitud_datos"
    id_solicitud = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    tipo = Column(String(30))                  # eliminacion | rectificacion
    estado = Column(String(30), default="pendiente")
    fecha = Column(DateTime, default=datetime.now)


class RecomendacionIA(Base):
    __tablename__ = "recomendacion_ia"
    id_recomendacion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    categoria = Column(String(30))             # entrenamiento | alimentacion | recuperacion
    titulo = Column(String(150))
    descripcion = Column(Text)
    motivo = Column(Text)
    accion_sugerida = Column(Text)
    fecha = Column(DateTime, default=datetime.now)
