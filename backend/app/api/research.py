from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import ResearchSession, AgentExecutionLog, ResearchReport
from app.agents.orchestrator import orchestrator
from app.ingestion.security_filter import security_filter

router = APIRouter(prefix="/research", tags=["Research Operations"])

class StartResearchRequest(BaseModel):
    query: str
    depth: str = "comprehensive"  # quick, standard, comprehensive, deep
    target_sources: list[str] = ["nvd", "mitre", "cisa", "local_docs"]

@router.post("/start")
def start_research(payload: StartResearchRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    clean_query = security_filter.sanitize_query(payload.query)
    if not clean_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Create new research session
    session = ResearchSession(
        query=clean_query,
        depth=payload.depth,
        target_sources=payload.target_sources,
        status="pending"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Run investigation synchronously so user immediately gets results, or in background
    # Running inline gives instant, dependable completion for the API call
    result = orchestrator.run_investigation(session.id, clean_query, db)

    report = db.query(ResearchReport).filter(ResearchReport.id == result.get("report_id")).first()

    return {
        "session_id": session.id,
        "query": clean_query,
        "status": session.status,
        "result": result,
        # Return the generated answer in the same response that completes the
        # investigation. This makes the question-and-answer UI independent of
        # a follow-up session fetch.
        "report": {
            "id": report.id,
            "title": report.title,
            "content_markdown": report.content_markdown,
            "verification_score": report.verification_score,
            "unsupported_claims_count": report.unsupported_claims_count,
            "citations_count": report.citations_count,
        } if report else None,
    }

@router.get("/sessions")
def list_research_sessions(limit: int = 20, db: Session = Depends(get_db)):
    sessions = db.query(ResearchSession).order_by(ResearchSession.created_at.desc()).limit(limit).all()
    return [
        {
            "id": s.id,
            "query": s.query,
            "query_type": s.query_type,
            "status": s.status,
            "depth": s.depth,
            "confidence_score": s.confidence_score,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "findings_summary": s.findings_summary
        }
        for s in sessions
    ]

@router.get("/sessions/{session_id}")
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    s = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Research session not found")

    tasks = [
        {
            "id": t.id,
            "agent_type": t.agent_type,
            "title": t.title,
            "status": t.status,
            "execution_time_seconds": t.execution_time_seconds
        }
        for t in s.tasks
    ]

    report = s.reports[0] if s.reports else None

    return {
        "id": s.id,
        "query": s.query,
        "query_type": s.query_type,
        "status": s.status,
        "depth": s.depth,
        "confidence_score": s.confidence_score,
        "findings_summary": s.findings_summary,
        "tasks": tasks,
        "report": {
            "id": report.id,
            "title": report.title,
            "content_markdown": report.content_markdown,
            "verification_score": report.verification_score,
            "unsupported_claims_count": report.unsupported_claims_count,
            "citations_count": report.citations_count
        } if report else None
    }

@router.get("/sessions/{session_id}/logs")
def get_session_logs(session_id: str, db: Session = Depends(get_db)):
    logs = db.query(AgentExecutionLog).filter(AgentExecutionLog.session_id == session_id).order_by(AgentExecutionLog.timestamp.asc()).all()
    return [
        {
            "id": l.id,
            "agent_name": l.agent_name,
            "step": l.step,
            "log_level": l.log_level,
            "message": l.message,
            "payload": l.payload,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        }
        for l in logs
    ]
