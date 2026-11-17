from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Entity, Relationship
from app.knowledge_graph.graph_manager import graph_manager

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])

@router.get("/session/{session_id}")
def get_session_graph(session_id: str, db: Session = Depends(get_db)):
    # Check in-memory graph first
    graph_data = graph_manager.export_graph_data(session_id)
    if graph_data["total_nodes"] > 0:
        return graph_data

    # Otherwise reconstruct from DB
    entities = db.query(Entity).filter(Entity.session_id == session_id).all()
    relations = db.query(Relationship).filter(Relationship.session_id == session_id).all()

    ent_list = [
        {"id": e.name, "name": e.name, "category": e.category, "confidence": e.confidence, "metadata": e.metadata_json}
        for e in entities
    ]
    rel_list = [
        {"source": r.source_entity, "target": r.target_entity, "relation_type": r.relation_type, "weight": r.weight, "evidence_citation": r.evidence_citation}
        for r in relations
    ]

    graph_manager.add_entities_and_relationships(session_id, ent_list, rel_list)
    return graph_manager.export_graph_data(session_id)
