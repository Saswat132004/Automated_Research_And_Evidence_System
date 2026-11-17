import logging
import re
from app.config import settings

logger = logging.getLogger("ares.reranker")

class CrossEncoderReranker:
    """
    Reranks candidate evidence using deep Cross-Encoder or multi-feature semantic cross-scoring.
    """
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        self.cross_encoder = None
        self._init_model()

    def _init_model(self):
        try:
            from sentence_transformers import CrossEncoder
            self.cross_encoder = CrossEncoder(self.model_name)
        except Exception:
            self.cross_encoder = None

    def rerank(self, query: str, candidates: list[dict], top_k: int = settings.RERANK_TOP_K) -> list[dict]:
        if not candidates:
            return []

        # If neural cross-encoder is loaded
        if self.cross_encoder is not None:
            try:
                pairs = [[query, c.get("content", "")] for c in candidates]
                scores = self.cross_encoder.predict(pairs)
                for i, score in enumerate(scores):
                    candidates[i]["rerank_score"] = float(score)
                reranked = sorted(candidates, key=lambda x: x.get("rerank_score", 0), reverse=True)
                return reranked[:top_k]
            except Exception as e:
                logger.warning(f"Neural reranker failed: {e}. Falling back to semantic cross-scoring.")

        # Multi-factor Cybersecurity Cross-Scoring
        query_lower = query.lower()
        q_tokens = set(re.findall(r"\w+", query_lower))
        q_cves = set(re.findall(r"cve-\d{4}-\d+", query_lower))
        
        for cand in candidates:
            content = cand.get("content", "").lower()
            cand_tokens = set(re.findall(r"\w+", content))
            cand_cves = set(re.findall(r"cve-\d{4}-\d+", content))
            
            # 1. Token overlap (Jaccard / Dice)
            intersection = q_tokens.intersection(cand_tokens)
            token_overlap = len(intersection) / max(len(q_tokens), 1)
            
            # 2. Exact phrase bonus
            phrase_bonus = 0.3 if query_lower in content else 0.0
            
            # 3. High-priority security identifier alignment (CVE, APT)
            cve_match = 0.5 if (q_cves and q_cves.intersection(cand_cves)) else 0.0
            
            # 4. Source credibility weighting
            credibility = cand.get("credibility_score", 0.8)
            
            # Combined cross score
            score = (token_overlap * 0.4) + phrase_bonus + cve_match + (credibility * 0.2)
            # Add existing fusion score if present
            base_score = cand.get("rrf_score", cand.get("vector_score", 0.5))
            cand["rerank_score"] = round(float(score + base_score * 0.5), 4)

        reranked = sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]

reranker = CrossEncoderReranker()
