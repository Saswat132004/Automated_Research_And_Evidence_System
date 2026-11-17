import logging
from app.threat_intel.cve_nvd import nvd_client
from app.threat_intel.cisa_kev import cisa_client
from app.threat_intel.mitre_attack import mitre_client
from app.retrieval.hybrid_retriever import hybrid_retriever
from app.knowledge_graph.extractor import entity_extractor

logger = logging.getLogger("ares.agents.research")

class ResearchAgent:
    """
    Executes assigned research tasks safely across authorized threat feeds and local documents.
    """
    def execute_threat_intel_task(self, query: str, cves: list[str]) -> list[dict]:
        findings = []
        
        # 1. Check CVEs
        for cve_id in cves:
            details = nvd_client.get_cve_details(cve_id)
            if details:
                findings.append({
                    "source_type": "cve_nvd",
                    "source_name": "NVD National Vulnerability Database",
                    "source_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                    "passage": (
                        f"Vulnerability {cve_id} (CVSS {details['cvss_v3_score']} {details['severity']}): "
                        f"{details['description']} Affected components: {details['affected_product']}. "
                        f"Mitigation: {details['mitigation']}"
                    ),
                    "relevance_score": 0.98,
                    "freshness_date": "2024-03-01"
                })

            kev_item = cisa_client.lookup_cve(cve_id)
            if kev_item:
                findings.append({
                    "source_type": "cisa_kev",
                    "source_name": "CISA Known Exploited Vulnerabilities Catalog",
                    "source_url": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
                    "passage": (
                        f"CISA KEV Alert for {cve_id}: {kev_item['vulnerability_name']}. "
                        f"Known Ransomware Campaign Use: {kev_item['known_ransomware_campaign_use']}. "
                        f"Action: {kev_item['required_action']} Due Date: {kev_item['due_date']}."
                    ),
                    "relevance_score": 0.99,
                    "freshness_date": kev_item["date_added"]
                })

        # If no specific CVE in query, search CISA KEV by keyword
        if not cves:
            kev_matches = cisa_client.search_by_keyword(query)
            for item in kev_matches[:2]:
                findings.append({
                    "source_type": "cisa_kev",
                    "source_name": "CISA Known Exploited Vulnerabilities Catalog",
                    "source_url": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
                    "passage": (
                        f"CISA KEV Record: {item['vulnerability_name']} ({item['cve_id']}). "
                        f"{item['short_description']} Known Ransomware Campaign Use: {item['known_ransomware_campaign_use']}."
                    ),
                    "relevance_score": 0.92,
                    "freshness_date": item["date_added"]
                })

        return findings

    def execute_mitre_task(self, query: str) -> list[dict]:
        mapped = mitre_client.map_query_to_mitre(query)
        findings = []

        for tech in mapped.get("matched_techniques", [])[:3]:
            findings.append({
                "source_type": "mitre_attack",
                "source_name": f"MITRE ATT&CK {tech['id']} ({tech['name']})",
                "source_url": f"https://attack.mitre.org/techniques/{tech['id']}/",
                "passage": (
                    f"MITRE Technique {tech['id']} [{tech['tactic']}]: {tech['description']} "
                    f"Detection guidance: {tech['detection']}"
                ),
                "relevance_score": 0.95,
                "freshness_date": "2024-04-15"
            })

        for actor in mapped.get("matched_actors", [])[:2]:
            findings.append({
                "source_type": "mitre_attack",
                "source_name": f"Adversary Profile: {actor['name']}",
                "source_url": "https://attack.mitre.org/groups/",
                "passage": (
                    f"Adversary group {actor['name']} (Origin: {actor['origin']}). Targets: {', '.join(actor['target_sectors'])}. "
                    f"Known TTPs: {', '.join(actor['known_ttps'])}. Associated CVEs: {', '.join(actor['associated_cves'])}."
                ),
                "relevance_score": 0.93,
                "freshness_date": "2024-02-10"
            })

        return findings

    def execute_hybrid_rag_task(self, query: str, top_k: int = 4) -> list[dict]:
        rag_results = hybrid_retriever.retrieve(query, top_k=top_k, rerank=True)
        findings = []

        for item in rag_results:
            findings.append({
                "source_type": "local_doc",
                "source_name": item.get("document_name", "Internal Repository"),
                "source_url": f"file://{item.get('document_id', 'local')}",
                "passage": item.get("content", ""),
                "relevance_score": item.get("rerank_score", item.get("rrf_score", 0.85)),
                "freshness_date": "2024-01-20",
                "chunk_id": item.get("id")
            })

        return findings

research_agent = ResearchAgent()
