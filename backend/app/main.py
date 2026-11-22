# Punto de entrada: crea la app, las tablas, el administrador inicial y conecta las rutas.
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registra las tablas)
from .auth import hashear, verificar
from .database import Base, SessionLocal, agregar_columnas_faltantes, engine
from .routes import exercises, profiles, routines, sessions, users

load_dotenv()


def crear_admin():
    """Crea el administrador con los datos del .env. Si ya existe, lo sincroniza (rol y contraseña),
    así un cambio en el .env se aplica al reiniciar el servidor."""
    correo, clave = os.getenv("ADMIN_CORREO"), os.getenv("ADMIN_CONTRASENA")
    if not correo or not clave:
        return
    correo, clave = correo.strip().lower(), clave.strip()
    db = SessionLocal()
    try:
        admin = db.query(models.Usuario).filter_by(correo=correo).first()
        if not admin:
            db.add(models.Usuario(correo=correo, nombre="Administrador", contrasena_hash=hashear(clave), rol="admin"))
        else:
            admin.rol = "admin"
            if not verificar(clave, admin.contrasena_hash):
                admin.contrasena_hash = hashear(clave)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    agregar_columnas_faltantes()
    crear_admin()
    yield


app = FastAPI(title="AdaptFit API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",  # cualquier puerto local (Vite cambia de puerto si el 5173 está ocupado)
                   
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(users.auth_router)
app.include_router(users.router)
app.include_router(exercises.router)
app.include_router(profiles.router)
app.include_router(routines.router)
app.include_router(sessions.router)


@app.get("/")
def inicio():
    return {"mensaje": "AdaptFit API funcionando"}
