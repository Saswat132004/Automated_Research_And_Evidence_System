import re
from app.llm.client import llm_client

class QueryAnalyzer:
    """
    Analyzes cybersecurity research questions, extracts cyber entities, and classifies intent.
    """
    def analyze(self, query: str) -> dict:
        prompt = (
            f"Analyze this cybersecurity query and extract key information:\n"
            f"Query: \"{query}\"\n"
            f"Identify: query_type (vulnerability, threat_actor, incident, malware), "
            f"target_cves, threat_actors, affected_technologies, and investigation_scope."
        )
        
        system = "You are a Senior Threat Intelligence Analyst and Cybersecurity Query Classifier."
        llm_output = llm_client.generate_json(prompt, system)

        # Ensure regex safety extraction
        cves = list(set(re.findall(r"CVE-\d{4}-\d{4,7}", query, re.IGNORECASE)))
        
        # Determine query type heuristically if needed
        q_lower = query.lower()
        q_type = "incident_investigation"
        if "cve" in q_lower or "vulnerability" in q_lower or "exploit" in q_lower or cves:
            q_type = "vulnerability_research"
        elif any(ta in q_lower for ta in ["apt", "cozy bear", "fancy bear", "lazarus", "actor", "group"]):
            q_type = "threat_actor_profiling"
        elif any(m in q_lower for m in ["ransomware", "malware", "trojan", "payload", "lockbit"]):
            q_type = "malware_campaign_analysis"

        return {
            "query": query,
            "query_type": q_type,
            "target_cves": cves or llm_output.get("extracted_cves", []),
            "threat_actors": llm_output.get("identified_threat_actors", []),
            "scope": "Authorized Intelligence Sources & Local Repository",
            "complexity_level": "High" if len(cves) > 1 or "apt" in q_lower else "Standard"
        }

query_analyzer = QueryAnalyzer()
