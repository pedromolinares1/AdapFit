# Generación de la rutina con REGLAS PROPIAS (sin IA). Pasos:
#   1. Filtrar el catálogo: ejercicios activos, de nivel igual o menor al del usuario y con su equipamiento.
#   2. Elegir la división de la semana según los días disponibles (cuerpo completo, torso/pierna, empuje/tirón/pierna).
#   3. Llenar cada día con ejercicios de las categorías que le tocan, variando los ejercicios entre días.
#   4. Definir series, repeticiones y descanso según objetivo y nivel, y ajustar con el esfuerzo reciente.
#   5. Sugerir carga solo si el usuario ya registró pesos suficientes en ese ejercicio.
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import DetalleRutina, Ejercicio, PerfilEntrenamiento, RegistroEjercicio, Rutina, SesionEntrenamiento, Usuario

NIVELES = ["principiante", "intermedio", "avanzado"]
ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
PARAMETROS = {"masa": (4, "8-12", 90), "grasa": (3, "12-15", 60), "condicion": (3, "15-20", 45)}  # series, repeticiones, descanso (s)
NOMBRE_OBJETIVO = {"masa": "Ganar masa muscular", "grasa": "Perder grasa", "condicion": "Mejorar la condición física"}

# División según los días de entrenamiento: (tipos de día, nombre del plan, veces por semana que se entrena cada músculo)
PLANES = {
    1: (["full"], "Cuerpo completo", 1),
    2: (["full", "full"], "Cuerpo completo", 2),
    3: (["full", "full", "full"], "Cuerpo completo", 3),
    4: (["torso", "pierna", "torso", "pierna"], "Torso / Pierna", 2),
    5: (["empuje", "tiron", "pierna", "torso", "pierna"], "Empuje / Tirón / Pierna + Torso / Pierna", 2),
    6: (["empuje", "tiron", "pierna", "empuje", "tiron", "pierna"], "Empuje / Tirón / Pierna", 2),
}
MOTIVOS = {
    "Cuerpo completo": "Con pocos días a la semana, el cuerpo completo es lo más eficiente: trabajas todos los grupos musculares en cada sesión y descansas entre una y otra.",
    "Torso / Pierna": "Con 4 días, separar torso y pierna te permite entrenar cada zona dos veces por semana, con descanso entre las sesiones de la misma zona.",
    "Empuje / Tirón / Pierna + Torso / Pierna": "Con 5 días combinamos empuje, tirón y pierna con un día extra de torso y otro de pierna, para que cada zona se trabaje cerca de dos veces por semana.",
    "Empuje / Tirón / Pierna": "Con 6 días, repetir dos veces el esquema empuje, tirón y pierna cubre cada grupo dos veces por semana. Se mantiene al menos un día de descanso.",
}
ENFOQUE = {"full": "Cuerpo completo", "torso": "Torso", "pierna": "Pierna", "empuje": "Empuje", "tiron": "Tirón"}
# Categorías de ejercicio que lleva cada tipo de día
SLOTS = {
    "full": ["pierna", "empuje", "tiron", "pierna", "core"],
    "torso": ["empuje", "tiron", "empuje", "tiron", "core"],
    "pierna": ["pierna", "pierna", "pierna", "pierna", "core"],
    "empuje": ["empuje", "empuje", "empuje", "empuje"],
    "tiron": ["tiron", "tiron", "tiron", "tiron", "core"],
}


def describir_plan(n_dias: int) -> dict:
    tipos, nombre, veces = PLANES[min(max(n_dias, 1), 6)]
    return {"tipo": nombre, "frecuencia": f"Cada grupo muscular se entrena {veces} {'vez' if veces == 1 else 'veces'} por semana.", "motivo": MOTIVOS[nombre]}


def categoria(grupo: str) -> str:
    """Agrupa los grupos musculares del catálogo en: pierna, empuje, tirón o core."""
    g = (grupo or "").lower()
    if any(p in g for p in ("pierna", "muslo", "glute", "glúte", "pantorr", "gemelo", "cuád", "cuad", "isquio", "leg")):
        return "pierna"
    if any(p in g for p in ("pecho", "hombro", "tricep", "trícep", "chest", "shoulder")):
        return "empuje"
    if any(p in g for p in ("espalda", "bicep", "bícep", "brazo", "antebraz", "dorsal", "back", "arm")):
        return "tiron"
    return "core"


def armar_entrenamientos(pool, tipos):
    """Devuelve la lista de ejercicios de cada día. Prefiere los ejercicios menos usados en la semana y variar el músculo."""
    por_categoria = {}
    for e in pool:
        por_categoria.setdefault(categoria(e.grupo_muscular), []).append(e)
    usos = {e.id_ejercicio: 0 for e in pool}
    dias = []
    for tipo in tipos:
        elegidos = []
        for cat in SLOTS[tipo]:
            libres = [e for e in por_categoria.get(cat, []) if e not in elegidos]
            if libres:
                e = min(libres, key=lambda x: (usos[x.id_ejercicio], [y.grupo_muscular for y in elegidos].count(x.grupo_muscular)))
                elegidos.append(e)
                usos[e.id_ejercicio] += 1
        dias.append(elegidos or pool[:4])  # respaldo si el catálogo no tiene esas categorías
    return dias


def esfuerzo_reciente(db: Session, id_usuario: int):
    """Promedio del esfuerzo de las últimas 3 sesiones (se necesitan al menos 2 para ajustar)."""
    sesiones = db.query(SesionEntrenamiento).filter_by(id_usuario=id_usuario).order_by(SesionEntrenamiento.fecha.desc()).limit(3).all()
    valores = [s.esfuerzo_percibido for s in sesiones if s.esfuerzo_percibido]
    return sum(valores) / len(valores) if len(valores) >= 2 else None


def parametros(objetivo: str, nivel: str, esfuerzo):
    series, repeticiones, descanso = PARAMETROS[objetivo]
    if nivel == "principiante":
        series -= 1
    if esfuerzo is not None:
        if esfuerzo >= 9:      # muy exigente: baja una serie
            series -= 1
        elif esfuerzo <= 4:    # muy fácil: sube una serie
            series += 1
    return max(2, min(5, series)), repeticiones, descanso


def carga_sugerida(db: Session, id_usuario: int, id_ejercicio: int, esfuerzo):
    """Solo sugiere carga con información suficiente: al menos 2 registros con peso de ese ejercicio."""
    filas = (db.query(RegistroEjercicio.peso)
               .join(SesionEntrenamiento, RegistroEjercicio.id_sesion == SesionEntrenamiento.id_sesion)
               .filter(SesionEntrenamiento.id_usuario == id_usuario, RegistroEjercicio.id_ejercicio == id_ejercicio,
                       RegistroEjercicio.realizado == True, RegistroEjercicio.peso.isnot(None), RegistroEjercicio.peso > 0)  # noqa: E712
               .order_by(SesionEntrenamiento.fecha.desc()).limit(3).all())
    if len(filas) < 2:
        return None
    base = filas[0][0]
    if esfuerzo is not None and esfuerzo <= 6:   # si le resultó llevadero, sube un 5 %
        base *= 1.05
    return round(base * 2) / 2                   # redondea a múltiplos de 0,5 kg


def generar_rutina(db: Session, usuario: Usuario) -> Rutina:
    perfil = db.query(PerfilEntrenamiento).filter_by(id_usuario=usuario.id_usuario).first()
    if not perfil:
        raise HTTPException(400, "Primero configura tu perfil de entrenamiento.")
    permitido = set(perfil.equipamiento or []) | {"peso corporal"}
    nivel = NIVELES.index(perfil.nivel)
    pool = [e for e in db.query(Ejercicio).filter_by(activo=True).order_by(Ejercicio.nombre).all()
            if (NIVELES.index(e.dificultad) if e.dificultad in NIVELES else 0) <= nivel and e.equipamiento in permitido]
    if not pool:
        raise HTTPException(400, "No hay ejercicios activos para tu nivel y equipamiento. Pide al administrador ampliar el catálogo.")

    dias = sorted(perfil.dias_disponibles, key=ORDEN_DIAS.index)[:6]   # máximo 6 días: siempre queda uno de descanso
    tipos = PLANES[len(dias)][0]
    esfuerzo = esfuerzo_reciente(db, usuario.id_usuario)
    series, repeticiones, descanso = parametros(perfil.objetivo, perfil.nivel, esfuerzo)

    db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa").update({"estado": "archivada"})  # la anterior se conserva
    rutina = Rutina(id_usuario=usuario.id_usuario, nombre=f"Rutina: {NOMBRE_OBJETIVO[perfil.objetivo]}", objetivo=perfil.objetivo)
    db.add(rutina)
    db.flush()
    contador = {}
    for dia, tipo, ejercicios in zip(dias, tipos, armar_entrenamientos(pool, tipos)):
        contador[tipo] = contador.get(tipo, 0) + 1
        letra = f" {chr(64 + contador[tipo])}" if tipos.count(tipo) > 1 else ""
        for orden, e in enumerate(ejercicios, 1):
            db.add(DetalleRutina(id_rutina=rutina.id_rutina, id_ejercicio=e.id_ejercicio, nombre_entrenamiento=ENFOQUE[tipo] + letra,
                                 dia_entrenamiento=dia, series=series, repeticiones=repeticiones, descanso_segundos=descanso,
                                 carga_sugerida=carga_sugerida(db, usuario.id_usuario, e.id_ejercicio, esfuerzo), orden=orden))
    db.commit()
    return rutina
