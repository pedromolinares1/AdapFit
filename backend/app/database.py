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
