# Conexión a SQLite con SQLAlchemy. El archivo adaptfit.db se crea solo en la carpeta backend.
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./adaptfit.db"  # Para cambiar de motor más adelante (PostgreSQL, SQL Server) solo se cambia esta línea.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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
