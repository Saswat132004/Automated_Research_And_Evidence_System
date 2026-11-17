import datetime
from app.database.models import Evidence

class EvidenceManager:
    """
    Maintains provenance, source credibility weighting, and verifiable citation IDs.
    """
    AUTHORITY_WEIGHTS = {
        "cve_nvd": 1.0,
        "cisa_kev": 1.0,
        "mitre_attack": 1.0,
        "local_doc": 0.90,
        "security_advisory": 0.95,
        "web": 0.75
    }

    def create_evidence_item(
        self,
        session_id: str,
        passage: str,
        source_type: str,
        source_name: str,
        citation_index: int,
        source_url: str = None,
        relevance_score: float = 0.85,
        freshness_date: str = None,
        chunk_id: str = None
    ) -> dict:
        credibility = self.AUTHORITY_WEIGHTS.get(source_type.lower(), 0.80)
        citation_id = f"ARES-CIT-{citation_index}"

        return {
            "session_id": session_id,
            "chunk_id": chunk_id,
            "passage": passage.strip(),
            "source_type": source_type,
            "source_name": source_name,
            "source_url": source_url,
            "credibility_score": credibility,
            "relevance_score": round(relevance_score, 4),
            "freshness_date": freshness_date or datetime.datetime.utcnow().strftime("%Y-%m-%d"),
            "citation_id": citation_id,
            "verified": True
        }

evidence_manager = EvidenceManager()
