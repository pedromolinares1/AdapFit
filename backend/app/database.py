# Conexión a la base de datos con SQLAlchemy.
# En tu computador usa SQLite (el archivo adaptfit.db se crea solo en la carpeta backend).
# En Render usa PostgreSQL: solo hay que definir la variable de entorno DATABASE_URL.
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./adaptfit.db")

# Se fuerza el controlador psycopg2 (el que instala psycopg2-binary en requirements.txt).
# Así funciona sin importar si la URL llega como "postgres://", "postgresql://" o con otro controlador.
if DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+psycopg://")):
    DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL.split("://", 1)[1]

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # pool_pre_ping evita errores cuando la conexión quedó cerrada por inactividad.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def get_db():
    """Abre una sesión de base de datos por petición y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def agregar_columnas_faltantes():
    """Si agregamos una columna a un modelo, la añade a la tabla existente sin borrar datos.
    (Solución sencilla para el MVP; en un proyecto grande se usaría Alembic.)"""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    for tabla in Base.metadata.sorted_tables:
        if not insp.has_table(tabla.name):
            continue
        existentes = {c["name"] for c in insp.get_columns(tabla.name)}
        for col in tabla.columns:
            if col.name not in existentes:
                with engine.begin() as con:
                    con.execute(text(f'ALTER TABLE {tabla.name} ADD COLUMN {col.name} {col.type.compile(engine.dialect)}'))