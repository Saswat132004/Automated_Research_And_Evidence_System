import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.knowledge_graph.extractor import entity_extractor
from app.knowledge_graph.graph_manager import graph_manager

def test_knowledge_graph_extraction_and_build():
    sample_text = (
        "Adversary APT29 exploits Log4Shell CVE-2021-44228 using JNDI:LDAP to achieve initial access. "
        "They utilize powershell for execution and credential dumping."
    )
    entities, relations = entity_extractor.extract_entities_and_relations(sample_text, "CIT-1")
    
    assert any(e["name"] == "CVE-2021-44228" for e in entities)
    assert any(e["category"] == "THREAT_ACTOR" for e in entities)
    assert len(relations) > 0

    session_id = "test-graph-session-123"
    graph_manager.add_entities_and_relationships(session_id, entities, relations)
    exported = graph_manager.export_graph_data(session_id)
    
    assert exported["total_nodes"] > 0
    assert exported["total_edges"] > 0
