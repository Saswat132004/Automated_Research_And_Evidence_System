import os
import glob
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.db import engine, SessionLocal, Base
from app.database.models import Document, DocumentChunk
from app.ingestion.document_parser import document_parser
from app.api import (
    auth,
    research,
    documents,
    evidence,
    graph,
    threat_intel,
    reports,
    evaluation,
    system
)

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ARES is an agentic AI-powered cybersecurity research platform that autonomously investigates complex cyber questions, retrieves verifiable evidence, maps multi-hop knowledge graphs, and produces cited intelligence reports."
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(research.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(evidence.router, prefix=settings.API_V1_PREFIX)
app.include_router(graph.router, prefix=settings.API_V1_PREFIX)
app.include_router(threat_intel.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(evaluation.router, prefix=settings.API_V1_PREFIX)
app.include_router(system.router, prefix=settings.API_V1_PREFIX)

# Mount frontend production build if available
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "operational",
            "documentation": "/docs"
        }

@app.on_event("startup")
def startup_event():
    # 1. Create DB tables
    Base.metadata.create_all(bind=engine)

    # 2. Seed default cybersecurity research documents if empty
    db = SessionLocal()
    try:
        doc_count = db.query(Document).count()
        if doc_count == 0:
            sample_dir = Path(__file__).resolve().parent.parent / "sample_data"
            sample_files = glob.glob(str(sample_dir / "*.md"))
            for s_path in sample_files:
                fname = os.path.basename(s_path)
                doc_id = f"seed-{fname.replace('.md', '')}"
                file_size = os.path.getsize(s_path)
                sha256 = document_parser.compute_sha256(s_path)
                chunks = document_parser.process_and_index(s_path, doc_id, fname)
                
                doc = Document(
                    id=doc_id,
                    filename=fname,
                    file_type="md",
                    file_path=s_path,
                    file_size=file_size,
                    sha256_hash=sha256,
                    chunk_count=len(chunks),
                    doc_metadata={"seeded": True}
                )
                db.add(doc)
                for c in chunks:
                    chunk_model = DocumentChunk(
                        id=c["id"],
                        document_id=doc_id,
                        chunk_index=c["chunk_index"],
                        content=c["content"],
                        token_count=c.get("word_count", 0),
                        chunk_metadata={"source_name": fname}
                    )
                    db.add(chunk_model)
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "documentation": "/docs"
    }
