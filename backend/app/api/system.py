import os
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.config import settings, persist_settings
from app.database.db import get_db
from app.database.models import Document, ResearchSession, Evidence
from app.llm.client import llm_client
from app.retrieval.vector_store import vector_store
from app.retrieval.bm25_index import bm25_index

router = APIRouter(prefix="/system", tags=["System Diagnostics"])

class UpdateConfigRequest(BaseModel):
    ollama_base_url: str | None = None
    ollama_model: str | None = None
    llm_provider: str | None = None
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str | None = None
    top_k_retrieval: int | None = None
    rerank_top_k: int | None = None

class TestLLMRequest(BaseModel):
    prompt: str = "ARES Answering Test: Are you operational? Respond in one concise sentence."

@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    doc_count = db.query(Document).count()
    session_count = db.query(ResearchSession).count()
    evidence_count = db.query(Evidence).count()
    
    installed = llm_client.get_installed_models()
    ollama_online = bool(installed) or llm_client.is_available()
    active_model = llm_client.resolve_active_model(installed)

    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected",
        "ollama": {
            "status": "online" if ollama_online else "offline (heuristic fallback active)",
            "model": settings.OLLAMA_MODEL,
            "active_model": active_model,
            "installed_models": installed,
            "url": settings.OLLAMA_BASE_URL,
            "provider": settings.LLM_PROVIDER
        },
        "vector_index": {
            "type": "FAISS (IndexFlatIP)",
            "total_vectors": vector_store.index.ntotal,
            "dimension": settings.EMBEDDING_DIM
        },
        "bm25_index": {
            "total_documents": len(bm25_index.corpus_docs)
        },
        "repository_stats": {
            "documents_indexed": doc_count,
            "research_sessions_completed": session_count,
            "evidence_items_stored": evidence_count
        }
    }

@router.get("/config")
def get_config():
    installed = llm_client.get_installed_models()
    active_model = llm_client.resolve_active_model(installed)
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "ollama_model": settings.OLLAMA_MODEL,
        "active_model": active_model,
        "installed_models": installed,
        "llm_provider": settings.LLM_PROVIDER,
        "openai_base_url": settings.OPENAI_BASE_URL,
        "openai_model": settings.OPENAI_MODEL,
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "top_k_retrieval": settings.TOP_K_RETRIEVAL,
        "rerank_top_k": settings.RERANK_TOP_K,
        "allowed_extensions": settings.ALLOWED_EXTENSIONS
    }

@router.post("/config")
@router.put("/config")
def update_config(payload: UpdateConfigRequest):
    updates = {}
    if payload.ollama_base_url is not None:
        updates["ollama_base_url"] = payload.ollama_base_url
        llm_client.base_url = payload.ollama_base_url.rstrip("/")
    if payload.ollama_model is not None:
        updates["ollama_model"] = payload.ollama_model
        llm_client.model = payload.ollama_model
    if payload.llm_provider is not None:
        updates["llm_provider"] = payload.llm_provider
    if payload.openai_api_key is not None:
        updates["openai_api_key"] = payload.openai_api_key
    if payload.openai_base_url is not None:
        updates["openai_base_url"] = payload.openai_base_url
    if payload.openai_model is not None:
        updates["openai_model"] = payload.openai_model
    if payload.top_k_retrieval is not None:
        updates["top_k_retrieval"] = payload.top_k_retrieval
    if payload.rerank_top_k is not None:
        updates["rerank_top_k"] = payload.rerank_top_k

    persist_settings(updates)
    return get_config()

@router.get("/installed-models")
def list_installed_models():
    installed = llm_client.get_installed_models()
    active = llm_client.resolve_active_model()
    return {
        "installed_models": installed,
        "active_model": active,
        "is_available": llm_client.is_available()
    }

@router.post("/llm/test")
def test_llm(payload: TestLLMRequest):
    start = time.time()
    try:
        response = llm_client.generate(payload.prompt, "You are ARES AI assistant.")
        latency_ms = round((time.time() - start) * 1000, 1)
        active_model = llm_client.resolve_active_model()
        return {
            "status": "success",
            "model": active_model,
            "response": response,
            "latency_ms": latency_ms
        }
    except Exception as e:
        latency_ms = round((time.time() - start) * 1000, 1)
        return {
            "status": "error",
            "error": str(e),
            "latency_ms": latency_ms
        }
