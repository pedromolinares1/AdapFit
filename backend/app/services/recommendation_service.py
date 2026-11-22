# Recomendaciones con IA (Google Gemini, nivel gratuito): reúne el contexto, llama a la API, valida y guarda.
# Si la IA falla, se responde un error claro y el resto de la plataforma sigue funcionando.
import os
import time
from datetime import datetime, timedelta
from typing import List, Literal

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..ai.prompts import SISTEMA, construir_prompt
from ..models import PerfilEntrenamiento, RecomendacionIA, Rutina, SesionEntrenamiento, Usuario
from .routine_service import NOMBRE_OBJETIVO, describir_plan

URL = "https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"
NO_DISPONIBLE = "El servicio de IA no está disponible por ahora. Tu rutina y el resto de AdaptFit siguen funcionando."
REINTENTOS = 3
ESTADOS_TEMPORALES = {500, 503, 504}
ESTADOS_RESPALDO = {404, 429, 500, 503, 504}


class Recomendacion(BaseModel):
    categoria: Literal["entrenamiento", "alimentacion", "recuperacion"]
    titulo: str = Field(min_length=1, max_length=150)
    descripcion: str = Field(min_length=1)
    motivo: str = Field(min_length=1)
    accion_sugerida: str = Field(min_length=1)


class Respuesta(BaseModel):
    recomendaciones: List[Recomendacion] = Field(min_length=1, max_length=4)


def reunir_contexto(db: Session, usuario: Usuario) -> dict:
    """Solo datos útiles para recomendar. NO se envía correo, nombre ni contraseña."""
    perfil = db.query(PerfilEntrenamiento).filter_by(id_usuario=usuario.id_usuario).first()
    if not perfil:
        raise HTTPException(400, "Configura tu perfil de entrenamiento para recibir recomendaciones.")
    rutina = db.query(Rutina).filter_by(id_usuario=usuario.id_usuario, estado="activa").order_by(Rutina.fecha_creacion.desc()).first()
    plan, entrenamientos = None, {}
    if rutina:
        plan = describir_plan(len({d.dia_entrenamiento for d in rutina.detalles}), rutina.distribucion)
        for d in rutina.detalles:
            t = entrenamientos.setdefault(d.nombre_entrenamiento, {"entrenamiento": d.nombre_entrenamiento, "dia": d.dia_entrenamiento, "grupos": set()})
            t["grupos"].add(d.ejercicio.grupo_muscular)
    sesiones = db.query(SesionEntrenamiento).filter_by(id_usuario=usuario.id_usuario).order_by(SesionEntrenamiento.fecha.desc()).limit(5).all()
    esfuerzos = [s.esfuerzo_percibido for s in sesiones if s.esfuerzo_percibido]
    texto = lambda x: (x or "")[:200]  # noqa: E731  (límite de longitud de los textos libres)
    return {
        "perfil": {"objetivo": NOMBRE_OBJETIVO.get(perfil.objetivo, perfil.objetivo), "nivel": perfil.nivel, "edad": perfil.edad,
                   "peso_kg": perfil.peso_kg, "altura_cm": perfil.altura_cm, "dias_disponibles": perfil.dias_disponibles,
                   "equipamiento": perfil.equipamiento, "tipo_alimentacion": texto(perfil.tipo_alimentacion), "alimentos_a_evitar": texto(perfil.alimentos_evitar)},
        "rutina": {"distribucion": plan["tipo"] if plan else None, "frecuencia_muscular": plan["frecuencia"] if plan else None,
                   "entrenamientos": [{**t, "grupos": sorted(t["grupos"])} for t in entrenamientos.values()]},
        "historial": {"total_sesiones_consideradas": len(sesiones), "esfuerzo_promedio": round(sum(esfuerzos) / len(esfuerzos), 1) if esfuerzos else None,
                      "ultimas_sesiones": [{"entrenamiento": s.nombre_entrenamiento, "fecha": s.fecha.date().isoformat(), "esfuerzo": s.esfuerzo_percibido,
                                            "ejercicios_realizados": sum(1 for r in s.registros if r.realizado), "ejercicios_total": len(s.registros)} for s in sesiones]},
    }


def _post_con_reintentos(modelo: str, clave: str, cuerpo: dict):
    """Llama a Gemini hasta REINTENTOS veces si hay un error temporal. Devuelve la última respuesta (o None si no hubo conexión)."""
    r = None
    for intento in range(REINTENTOS):
        try:
            r = httpx.post(URL.format(modelo=modelo), headers={"x-goog-api-key": clave}, json=cuerpo, timeout=30)
            if r.status_code not in ESTADOS_TEMPORALES:
                return r
            print(f"[IA] {modelo}: respuesta {r.status_code}, intento {intento + 1}/{REINTENTOS}")
        except httpx.HTTPError as e:
            r = None
            print(f"[IA] {modelo}: error de conexión ({e}), intento {intento + 1}/{REINTENTOS}")
        if intento < REINTENTOS - 1:
            time.sleep(2 * (intento + 1))  # espera 2 s, luego 4 s
    return r


def llamar_ia(contexto: dict) -> Respuesta:
    clave = os.getenv("GEMINI_API_KEY")
    modelo = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    respaldo = os.getenv("GEMINI_MODEL_RESPALDO", "gemini-3.5-flash-lite")
    if not clave:
        raise HTTPException(503, "La IA aún no está configurada (falta GEMINI_API_KEY en el .env).")
    cuerpo = {"systemInstruction": {"parts": [{"text": SISTEMA}]},
              "contents": [{"role": "user", "parts": [{"text": construir_prompt(contexto)}]}],
              "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"}}

    r = None
    for m in dict.fromkeys([modelo, respaldo]):  # principal y respaldo, sin repetir
        r = _post_con_reintentos(m, clave, cuerpo)
        if r is not None and r.status_code not in ESTADOS_RESPALDO:
            break

    if r is None:
        raise HTTPException(503, NO_DISPONIBLE)
    if r.status_code in ESTADOS_TEMPORALES:
        raise HTTPException(503, "La IA está saturada en este momento. Intenta de nuevo en un minuto.")
    if r.status_code == 429:
        raise HTTPException(503, "Se alcanzó el límite del servicio gratuito de IA. Intenta de nuevo en unos minutos.")
    if r.status_code != 200:
        print("[IA] Respuesta", r.status_code, r.text[:300])  # ayuda a depurar (por ejemplo, un nombre de modelo inexistente)
        raise HTTPException(503, NO_DISPONIBLE)
    try:
        partes = r.json()["candidates"][0]["content"]["parts"]
        texto = "".join(p.get("text", "") for p in partes).strip().removeprefix("```json").removesuffix("```").strip()
        return Respuesta.model_validate_json(texto)
    except (KeyError, IndexError, ValueError) as e:  # incluye JSON inválido y datos que no cumplen el formato
        print("[IA] Respuesta con formato inesperado:", e)
        raise HTTPException(503, NO_DISPONIBLE)


def generar_recomendaciones(db: Session, usuario: Usuario) -> List[RecomendacionIA]:
    ultima = db.query(RecomendacionIA).filter_by(id_usuario=usuario.id_usuario).order_by(RecomendacionIA.fecha.desc()).first()
    if ultima and datetime.now() - ultima.fecha < timedelta(seconds=int(os.getenv("IA_ESPERA_SEGUNDOS", "60"))):
        raise HTTPException(429, "Espera un momento antes de generar nuevas recomendaciones.")
    respuesta = llamar_ia(reunir_contexto(db, usuario))
    db.query(RecomendacionIA).filter_by(id_usuario=usuario.id_usuario).delete()      # se reemplazan las anteriores
    nuevas = [RecomendacionIA(id_usuario=usuario.id_usuario, fecha=datetime.now(), **r.model_dump()) for r in respuesta.recomendaciones[:3]]
    db.add_all(nuevas)
    db.commit()
    return nuevas