# Generación de la rutina con REGLAS PROPIAS (sin IA). Pasos:
#   1. Filtrar el catálogo: ejercicios activos, de nivel igual o menor al del usuario y con su equipamiento.
#   2. Elegir la división de la semana según los días disponibles (cuerpo completo, torso/pierna, empuje/tirón/pierna).
#   3. Llenar cada día con ejercicios de las categorías que le tocan, variando los ejercicios entre días.
#   4. Definir series, repeticiones y descanso según objetivo y nivel, y ajustar con el esfuerzo reciente.
#   5. Sugerir carga solo si el usuario ya registró pesos suficientes en ese ejercicio.
import random

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import DetalleRutina, Ejercicio, PerfilEntrenamiento, RegistroEjercicio, Rutina, SesionEntrenamiento, Usuario

NIVELES = ["principiante", "intermedio", "avanzado"]
ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
PARAMETROS = {"masa": (4, "8-12", 90), "grasa": (3, "12-15", 60), "fuerza": (5, "3-6", 150),
              "resistencia": (3, "20-25", 40), "condicion": (3, "15-20", 45)}  # series, repeticiones, descanso (s)
NOMBRE_OBJETIVO = {"masa": "Ganar masa muscular", "grasa": "Perder grasa", "fuerza": "Mejorar la fuerza", "resistencia": "Mejorar la resistencia", "condicion": "Mejorar la condición física"}

# Distribuciones posibles según los días de entrenamiento. La primera es la recomendada; las demás son alternativas.
# (clave, nombre, tipos de día)
OPCIONES = {
    1: [("cuerpo_completo", "Cuerpo completo", ["full"])],
    2: [("cuerpo_completo", "Cuerpo completo", ["full"] * 2), ("torso_pierna", "Torso / Pierna", ["torso", "pierna"])],
    3: [("cuerpo_completo", "Cuerpo completo", ["full"] * 3), ("empuje_tiron_pierna", "Empuje / Tirón / Pierna", ["empuje", "tiron", "pierna"])],
    4: [("torso_pierna", "Torso / Pierna", ["torso", "pierna"] * 2), ("ept_completo", "Empuje / Tirón / Pierna + Cuerpo completo", ["empuje", "tiron", "pierna", "full"])],
    5: [("ept_torso_pierna", "Empuje / Tirón / Pierna + Torso / Pierna", ["empuje", "tiron", "pierna", "torso", "pierna"]),
        ("torso_pierna_completo", "Torso / Pierna + Cuerpo completo", ["torso", "pierna", "torso", "pierna", "full"])],
    6: [("empuje_tiron_pierna", "Empuje / Tirón / Pierna", ["empuje", "tiron", "pierna"] * 2), ("torso_pierna", "Torso / Pierna", ["torso", "pierna"] * 3)],
}
MOTIVOS = {
    "cuerpo_completo": "Trabajas todos los grupos musculares en cada sesión y descansas entre una y otra. Es lo más eficiente con pocos días.",
    "torso_pierna": "Separas la parte superior e inferior del cuerpo: más ejercicios por zona en cada sesión y descanso entre sesiones de la misma zona.",
    "empuje_tiron_pierna": "Divides el trabajo en empuje (pecho y hombros), tirón (espalda y brazos) y pierna, para concentrar más ejercicios por grupo.",
    "ept_completo": "Empuje, tirón y pierna en tres días, más un día de cuerpo completo que refuerza todo.",
    "ept_torso_pierna": "Empuje, tirón y pierna, más un día extra de torso y otro de pierna, para cubrir cada zona dos veces por semana.",
    "torso_pierna_completo": "Dos ciclos de torso y pierna, más un día de cuerpo completo.",
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
COBERTURA = {"full": {"pierna", "empuje", "tiron"}, "torso": {"empuje", "tiron"}, "pierna": {"pierna"}, "empuje": {"empuje"}, "tiron": {"tiron"}}
# Prioridad del equipamiento: máquinas y pesas primero, luego bandas, al final el peso corporal
EQUIPO_RANK = {"gimnasio": 0, "mancuernas": 0, "bandas elásticas": 1, "peso corporal": 2}


def nivel_de(e) -> int:
    return NIVELES.index(e.dificultad) if e.dificultad in NIVELES else 0


def describir_plan(n_dias: int, clave=None) -> dict:
    opciones = OPCIONES[min(max(n_dias, 1), 6)]
    clave, nombre, tipos = next((o for o in opciones if o[0] == clave), opciones[0])
    veces = [sum(g in COBERTURA[t] for t in tipos) for g in ("pierna", "empuje", "tiron")]   # veces por semana de cada zona
    lo, hi = min(veces), max(veces)
    texto = (f"{lo} {'vez' if lo == 1 else 'veces'}") if lo == hi else f"entre {lo} y {hi} veces"
    motivo = MOTIVOS[clave] + (" Siempre queda al menos un día de descanso." if n_dias >= 6 else "")
    return {"clave": clave, "tipo": nombre, "frecuencia": f"Cada grupo muscular se entrena {texto} por semana.", "motivo": motivo,
            "opciones": [{"clave": o[0], "nombre": o[1]} for o in opciones]}


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


def armar_entrenamientos(pool, tipos, nivel, rng, anteriores=()):
    """Lista de ejercicios por día. Para cada hueco elige, en este orden de prioridad:
    1) el equipamiento más exigente que tenga el usuario (máquinas/pesas antes que peso corporal),
    2) el ejercicio más cercano a su nivel, 3) uno que no estuviera en la rutina anterior,
    4) el menos repetido en la semana, 5) variar el músculo. Si hay empate, elige al azar."""
    por_categoria = {}
    for e in pool:
        por_categoria.setdefault(categoria(e.grupo_muscular), []).append(e)
    usos = {e.id_ejercicio: 0 for e in pool}
    dias = []
    for tipo in tipos:
        elegidos = []
        for cat in SLOTS[tipo]:
            libres = [e for e in por_categoria.get(cat, []) if e not in elegidos]
            if not libres:
                continue
            grupos_dia = [y.grupo_muscular for y in elegidos]
            clave = lambda x: (EQUIPO_RANK.get(x.equipamiento, 2), nivel - nivel_de(x), x.id_ejercicio in anteriores, usos[x.id_ejercicio], grupos_dia.count(x.grupo_muscular))  # noqa: E731
            mejor = min(clave(x) for x in libres)
            e = rng.choice([x for x in libres if clave(x) == mejor])
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


def generar_rutina(db: Session, usuario: Usuario, distribucion=None, cambiar_ejercicios=False, mas_suave=False) -> Rutina:
    perfil = db.query(PerfilEntrenamiento).filter_by(id_usuario=usuario.id_usuario).first()
    if not perfil:
        raise HTTPException(400, "Primero configura tu perfil de entrenamiento.")
    permitido = set(perfil.equipamiento or []) | {"peso corporal"}
    nivel = NIVELES.index(perfil.nivel)
    nivel_objetivo = max(0, nivel - 1) if mas_suave else nivel      # "más suave" baja un nivel, nunca sube del que eligió el usuario
    activos = db.query(Ejercicio).filter_by(activo=True).all()
    filtrar = lambda tope: [e for e in activos if nivel_de(e) <= tope and e.equipamiento in permitido]  # noqa: E731
    pool = filtrar(nivel_objetivo) or filtrar(nivel)
    if not pool:
        raise HTTPException(400, "No hay ejercicios activos para tu nivel y equipamiento. Pide al administrador ampliar el catálogo.")

    dias = sorted(perfil.dias_disponibles, key=ORDEN_DIAS.index)[:6]   # máximo 6 días: siempre queda uno de descanso
    opciones = OPCIONES[len(dias)]
    clave, _, tipos = next((o for o in opciones if o[0] == distribucion), opciones[0])
    esfuerzo = esfuerzo_reciente(db, usuario.id_usuario)
    series, repeticiones, descanso = parametros(perfil.objetivo, perfil.nivel, esfuerzo)

    actual = db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa").order_by(Rutina.fecha_creacion.desc()).first()
    anteriores = {d.id_ejercicio for d in actual.detalles} if (actual and cambiar_ejercicios) else set()
    entrenamientos = armar_entrenamientos(pool, tipos, nivel_objetivo, random.Random(), anteriores)

    db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa").update({"estado": "archivada"})  # la anterior se conserva
    rutina = Rutina(id_usuario=usuario.id_usuario, nombre=f"Rutina: {NOMBRE_OBJETIVO[perfil.objetivo]}", objetivo=perfil.objetivo, distribucion=clave)
    db.add(rutina)
    db.flush()
    contador = {}
    for dia, tipo, ejercicios in zip(dias, tipos, entrenamientos):
        contador[tipo] = contador.get(tipo, 0) + 1
        letra = f" {chr(64 + contador[tipo])}" if tipos.count(tipo) > 1 else ""
        for orden, e in enumerate(ejercicios, 1):
            db.add(DetalleRutina(id_rutina=rutina.id_rutina, id_ejercicio=e.id_ejercicio, nombre_entrenamiento=ENFOQUE[tipo] + letra,
                                 dia_entrenamiento=dia, series=series, repeticiones=repeticiones, descanso_segundos=descanso,
                                 carga_sugerida=carga_sugerida(db, usuario.id_usuario, e.id_ejercicio, esfuerzo), orden=orden))
    db.commit()
    return rutina
