from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Evidence
from app.retrieval.hybrid_retriever import hybrid_retriever

router = APIRouter(prefix="/evidence", tags=["Evidence & Citations"])

@router.get("/session/{session_id}")
def get_session_evidence(session_id: str, db: Session = Depends(get_db)):
    ev_items = db.query(Evidence).filter(Evidence.session_id == session_id).all()
    return [
        {
            "id": e.id,
            "citation_id": e.citation_id,
            "source_type": e.source_type,
            "source_name": e.source_name,
            "source_url": e.source_url,
            "credibility_score": e.credibility_score,
            "relevance_score": e.relevance_score,
            "freshness_date": e.freshness_date,
            "passage": e.passage,
            "verified": e.verified
        }
        for e in ev_items
    ]

@router.get("/search")
def test_hybrid_retrieval(q: str, top_k: int = 5):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    results = hybrid_retriever.retrieve(q, top_k=top_k, rerank=True)
    return {
        "query": q,
        "count": len(results),
        "results": results
    }
