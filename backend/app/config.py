import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "ARES — Autonomous Research & Evidence System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("ARES_SECRET_KEY", "ares-super-secure-jwt-secret-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'ares.db'}")
    
    # Storage Paths
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOADS_DIR: Path = BASE_DIR / "data" / "uploads"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"
    INDEXES_DIR: Path = BASE_DIR / "data" / "indexes"
    
    # LLM Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "phi3:latest")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")  # "auto", "ollama", "openai", "openai_compatible"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    LLM_TEMPERATURE: float = 0.1
    LLM_TIMEOUT_SECONDS: int = 90
    
    # Embeddings & Search
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_DIM: int = 384
    TOP_K_RETRIEVAL: int = 10
    RERANK_TOP_K: int = 5
    
    # Ingestion & Security Guardrails
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt", ".md", ".json"]
    ALLOWED_SCHEMES: list[str] = ["http", "https"]
    ALLOWED_DOMAINS: list[str] = [
        "cve.mitre.org", "nvd.nist.gov", "cisa.gov",
        "attack.mitre.org", "github.com", "raw.githubusercontent.com"
    ]
    
    # Threat Intel APIs
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")

settings = Settings()

def persist_settings(updates: dict):
    """
    Applies updates to in-memory settings and persists them to the .env file.
    """
    for key, value in updates.items():
        attr = key.upper()
        if hasattr(settings, attr):
            setattr(settings, attr, value)
            os.environ[attr] = str(value)

    env_path = BASE_DIR / ".env"
    existing_lines = []
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            existing_lines = f.readlines()

    env_dict = {}
    for line in existing_lines:
        line_s = line.strip()
        if line_s and not line_s.startswith("#") and "=" in line_s:
            k, v = line_s.split("=", 1)
            env_dict[k.strip()] = v.strip()

    for key, value in updates.items():
        env_dict[key.upper()] = str(value)

    # Reconstruct .env
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("# ARES System Environment Configuration\n")
        for k, v in env_dict.items():
            f.write(f"{k}={v}\n")

# Ensure directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.INDEXES_DIR, exist_ok=True)
