import uuid
from app.llm.client import llm_client

class AgenticPlanner:
    """
    Decomposes research objectives into prioritized, bounded agent tasks.
    """
    def create_plan(self, analysis: dict) -> dict:
        query = analysis.get("query", "")
        cves = analysis.get("target_cves", [])
        q_type = analysis.get("query_type", "vulnerability_research")

        subtasks = [
            {
                "task_id": f"task-{uuid.uuid4().hex[:6]}",
                "agent_type": "threat_intel_agent",
                "title": "Authoritative Vulnerability & Advisory Lookup",
                "description": f"Query NVD and CISA KEV catalogs for CVSS vectors, exploitation status, and known ransomware tie-ins for {', '.join(cves) if cves else 'target vectors'}.",
                "priority": 1,
                "timeout_seconds": 15,
                "tool_permissions": ["nvd_api", "cisa_kev_catalog"]
            },
            {
                "task_id": f"task-{uuid.uuid4().hex[:6]}",
                "agent_type": "mitre_agent",
                "title": "MITRE ATT&CK Tactic & Technique Correlation",
                "description": "Identify exploitation mechanics, command & scripting interpreters, and persistence patterns mapped to adversary techniques.",
                "priority": 2,
                "timeout_seconds": 15,
                "tool_permissions": ["mitre_attack_navigator"]
            },
            {
                "task_id": f"task-{uuid.uuid4().hex[:6]}",
                "agent_type": "hybrid_rag_agent",
                "title": "Local Repository Document & Advisory Retrieval",
                "description": "Execute Hybrid BM25 + FAISS retrieval with Cross-Encoder reranking over uploaded internal security documentation and incident reports.",
                "priority": 3,
                "timeout_seconds": 20,
                "tool_permissions": ["faiss_search", "bm25_search", "cross_encoder_rerank"]
            },
            {
                "task_id": f"task-{uuid.uuid4().hex[:6]}",
                "agent_type": "graph_agent",
                "title": "Cybersecurity Knowledge Graph Entity Linking",
                "description": "Extract entities (Actors, CVEs, Malware, Tactics) and compute network centralities and multi-hop attack paths.",
                "priority": 4,
                "timeout_seconds": 15,
                "tool_permissions": ["networkx_graph_builder"]
            }
        ]

        return {
            "query": query,
            "query_type": q_type,
            "total_tasks": len(subtasks),
            "estimated_duration_seconds": 10,
            "subtasks": subtasks
        }

planner = AgenticPlanner()
