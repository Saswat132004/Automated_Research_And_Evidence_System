from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import ResearchReport, Evidence, ResearchSession
from app.reports.markdown_generator import markdown_generator
from app.reports.pdf_generator import pdf_generator

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(ResearchReport).order_by(ResearchReport.generated_at.desc()).all()
    return [
        {
            "id": r.id,
            "session_id": r.session_id,
            "title": r.title,
            "verification_score": r.verification_score,
            "unsupported_claims_count": r.unsupported_claims_count,
            "citations_count": r.citations_count,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None
        }
        for r in reports
    ]

@router.get("/{session_id}")
def get_report(session_id: str, db: Session = Depends(get_db)):
    r = db.query(ResearchReport).filter(ResearchReport.session_id == session_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": r.id,
        "session_id": r.session_id,
        "title": r.title,
        "executive_summary": r.executive_summary,
        "content_markdown": r.content_markdown,
        "verification_score": r.verification_score,
        "unsupported_claims_count": r.unsupported_claims_count,
        "citations_count": r.citations_count,
        "generated_at": r.generated_at.isoformat() if r.generated_at else None
    }

@router.get("/{session_id}/markdown")
def download_markdown(session_id: str, db: Session = Depends(get_db)):
    r = db.query(ResearchReport).filter(ResearchReport.session_id == session_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    sess = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    ev_items = db.query(Evidence).filter(Evidence.session_id == session_id).all()
    
    ev_dicts = [
        {
            "citation_id": e.citation_id,
            "source_type": e.source_type,
            "source_name": e.source_name,
            "credibility_score": e.credibility_score,
            "freshness_date": e.freshness_date
        }
        for e in ev_items
    ]

    sess_dict = {
        "query": sess.query if sess else r.title,
        "query_type": sess.query_type if sess else "vulnerability_research",
        "confidence_score": r.verification_score
    }

    full_md = markdown_generator.generate(sess_dict, ev_dicts, r.content_markdown)
    return PlainTextResponse(
        content=full_md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="ARES_Report_{session_id[:8]}.md"'}
    )

@router.get("/{session_id}/pdf")
def download_pdf(session_id: str, db: Session = Depends(get_db)):
    r = db.query(ResearchReport).filter(ResearchReport.session_id == session_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    ev_items = db.query(Evidence).filter(Evidence.session_id == session_id).all()
    ev_dicts = [
        {
            "citation_id": e.citation_id,
            "source_type": e.source_type,
            "source_name": e.source_name,
            "credibility_score": e.credibility_score
        }
        for e in ev_items
    ]

    pdf_path = pdf_generator.generate_pdf(session_id, r.title, r.content_markdown, ev_dicts)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"ARES_Report_{session_id[:8]}.pdf"
    )
