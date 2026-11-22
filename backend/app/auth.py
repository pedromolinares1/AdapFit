# Seguridad: contraseñas con hash (bcrypt) y tokens JWT.
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("Falta SECRET_KEY. Copia .env.example como .env y complétalo.")
ALGORITMO = "HS256"
MINUTOS = int(os.getenv("TOKEN_MINUTOS", "480"))
esquema = HTTPBearer(auto_error=False)


def hashear(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode()[:72], bcrypt.gensalt()).decode()


def verificar(contrasena: str, hash_guardado: str) -> bool:
    return bcrypt.checkpw(contrasena.encode()[:72], hash_guardado.encode())


def crear_token(id_usuario: int) -> str:
    vence = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS)
    return jwt.encode({"sub": str(id_usuario), "exp": vence}, SECRET_KEY, algorithm=ALGORITMO)


def usuario_actual(cred: HTTPAuthorizationCredentials = Depends(esquema), db: Session = Depends(get_db)) -> Usuario:
    """Dependencia: identifica al usuario por el token. Todas las rutas privadas la usan,
    así cada usuario solo accede a su propia información."""
    if not cred:
        raise HTTPException(401, "Debes iniciar sesión.")
    try:
        datos = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITMO])
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesión inválida o expirada.")
    usuario = db.get(Usuario, int(datos["sub"]))
    if not usuario:
        raise HTTPException(401, "Sesión inválida o expirada.")
    return usuario


def solo_admin(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
    if usuario.rol != "admin":
        raise HTTPException(403, "Solo para administradores.")
    return usuario
