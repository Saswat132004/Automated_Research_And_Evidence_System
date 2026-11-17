import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.agents.query_analyzer import query_analyzer
from app.agents.planner import planner
from app.agents.verification_agent import verification_agent

def test_query_analyzer():
    res = query_analyzer.analyze("Investigate MOVEit Transfer SQL injection CVE-2023-34362 by CL0P")
    assert "CVE-2023-34362" in res["target_cves"]
    assert res["query_type"] in ["vulnerability_research", "incident_investigation", "threat_actor_profiling"]

def test_agentic_planner():
    analysis = {
        "query": "Investigate Log4Shell vulnerability CVE-2021-44228",
        "target_cves": ["CVE-2021-44228"],
        "query_type": "vulnerability_research"
    }
    plan = planner.create_plan(analysis)
    assert plan["total_tasks"] >= 3
    assert any(t["agent_type"] == "threat_intel_agent" for t in plan["subtasks"])

def test_verification_agent():
    text = "Log4Shell allows remote code execution [ARES-CIT-1]. Security patch Log4j 2.17.1 mitigates this [ARES-CIT-2]."
    evidence = [
        {"citation_id": "ARES-CIT-1", "passage": "Log4Shell RCE flaw."},
        {"citation_id": "ARES-CIT-2", "passage": "Log4j 2.17.1 mitigates this flaw."}
    ]
    res = verification_agent.verify_findings(text, evidence)
    assert res["verification_score"] > 0.8
    assert len(res["unsupported_claims"]) == 0
