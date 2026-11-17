import re
from app.llm.client import llm_client

class VerificationAgent:
    """
    Self-Verification Agent: Identifies ungrounded statements, verifies citations,
    and flags uncertain or unsupported claims for human review.
    """
    def verify_findings(self, summary_text: str, evidence_items: list[dict]) -> dict:
        citations_found = re.findall(r"\[ARES-CIT-(\d+)\]", summary_text)
        unique_citation_nums = set(citations_found)
        
        valid_indices = {str(i + 1) for i in range(len(evidence_items))}
        valid_citations = unique_citation_nums.intersection(valid_indices)
        invalid_citations = unique_citation_nums - valid_indices

        # Extract sentences/claims
        sentences = [s.strip() for s in re.split(r"(?<=[.!?]) +", summary_text) if len(s.strip()) > 20]
        unsupported_claims = []
        verified_claims = []

        for sent in sentences:
            has_cit = bool(re.search(r"\[ARES-CIT-\d+\]", sent))
            if has_cit:
                verified_claims.append(sent)
            else:
                # Claim lacking citation evidence
                if any(kw in sent.lower() for kw in ["cvss", "vulnerability", "exploited", "cve", "actor", "ransomware", "apt"]):
                    unsupported_claims.append({
                        "claim": sent,
                        "reason": "Security claim lacks direct citation reference to retrieved evidence."
                    })

        # Calculate scores
        total_eval = len(sentences)
        citation_coverage = round(len(verified_claims) / max(total_eval, 1), 3)
        
        has_valid_cits = len(valid_citations) > 0
        if not unsupported_claims:
            verification_score = 1.0 if has_valid_cits else 0.85
        else:
            base_score = 0.9 if has_valid_cits else 0.7
            penalty = min(0.3, len(unsupported_claims) * 0.05)
            verification_score = round(max(0.65, base_score - penalty), 2)

        return {
            "total_sentences_checked": total_eval,
            "citations_present": list(unique_citation_nums),
            "invalid_citations": list(invalid_citations),
            "verified_claims_count": len(verified_claims),
            "unsupported_claims": unsupported_claims,
            "citation_coverage": citation_coverage,
            "verification_score": verification_score,
            "status": "VERIFIED" if not unsupported_claims else "FLAGGED_FOR_HUMAN_REVIEW"
        }

verification_agent = VerificationAgent()
