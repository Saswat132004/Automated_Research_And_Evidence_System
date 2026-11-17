import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.config import settings
from app.database.db import get_db
from app.database.models import Document, DocumentChunk
from app.ingestion.security_filter import security_filter
from app.ingestion.document_parser import document_parser

router = APIRouter(prefix="/documents", tags=["Document Intelligence"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename
    # Read content to check size and hash
    content = await file.read()
    file_size = len(content)

    # Security validation
    security_filter.validate_upload_file(filename, file_size)

    doc_id = str(uuid.uuid4())
    ext = os.path.splitext(filename)[1].lower()
    dest_path = settings.UPLOADS_DIR / f"{doc_id}_{filename}"

    with open(dest_path, "wb") as f:
        f.write(content)

    sha256 = document_parser.compute_sha256(str(dest_path))

    # Process and index
    chunks = document_parser.process_and_index(str(dest_path), doc_id, filename)

    doc_model = Document(
        id=doc_id,
        filename=filename,
        file_type=ext.replace(".", ""),
        file_path=str(dest_path),
        file_size=file_size,
        sha256_hash=sha256,
        chunk_count=len(chunks),
        doc_metadata={"original_name": filename}
    )
    db.add(doc_model)

    for c in chunks:
        chunk_model = DocumentChunk(
            id=c["id"],
            document_id=doc_id,
            chunk_index=c["chunk_index"],
            content=c["content"],
            token_count=c.get("word_count", 0),
            chunk_metadata={"source_name": filename}
        )
        db.add(chunk_model)

    db.commit()

    return {
        "status": "success",
        "document_id": doc_id,
        "filename": filename,
        "file_size": file_size,
        "sha256": sha256,
        "chunks_indexed": len(chunks)
    }

@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "sha256_hash": d.sha256_hash,
            "chunk_count": d.chunk_count,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
        }
        for d in docs
    ]

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"status": "deleted", "document_id": doc_id}
