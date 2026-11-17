from app.retrieval.vector_store import vector_store
from app.retrieval.bm25_index import bm25_index
from app.retrieval.reranker import reranker
from app.config import settings

class HybridRetriever:
    """
    Hybrid Retrieval Engine combining BM25 keyword matching and FAISS semantic dense retrieval
    with Reciprocal Rank Fusion (RRF) and Cross-Encoder reranking.
    """
    def __init__(self, k_rrf: int = 60):
        self.k_rrf = k_rrf

    def retrieve(self, query: str, top_k: int = settings.TOP_K_RETRIEVAL, rerank: bool = True) -> list[dict]:
        # 1. Semantic retrieval via FAISS
        vector_results = vector_store.search(query, top_k=top_k * 2)
        
        # 2. Keyword retrieval via BM25
        bm25_results = bm25_index.search(query, top_k=top_k * 2)
        
        # 3. Reciprocal Rank Fusion
        fused_candidates: dict[str, dict] = {}
        
        # Score vector results
        for rank, item in enumerate(vector_results, 1):
            chunk_id = item.get("id") or item.get("chunk_id", str(hash(item.get("content", ""))))
            if chunk_id not in fused_candidates:
                fused_candidates[chunk_id] = dict(item)
                fused_candidates[chunk_id]["rrf_score"] = 0.0
                fused_candidates[chunk_id]["retrieval_channels"] = []
            fused_candidates[chunk_id]["rrf_score"] += 1.0 / (self.k_rrf + rank)
            fused_candidates[chunk_id]["retrieval_channels"].append(f"FAISS (rank {rank})")

        # Score BM25 results
        for rank, item in enumerate(bm25_results, 1):
            chunk_id = item.get("id") or item.get("chunk_id", str(hash(item.get("content", ""))))
            if chunk_id not in fused_candidates:
                fused_candidates[chunk_id] = dict(item)
                fused_candidates[chunk_id]["rrf_score"] = 0.0
                fused_candidates[chunk_id]["retrieval_channels"] = []
            fused_candidates[chunk_id]["rrf_score"] += 1.0 / (self.k_rrf + rank)
            fused_candidates[chunk_id]["retrieval_channels"].append(f"BM25 (rank {rank})")

        # Sort by RRF score
        ranked_list = sorted(fused_candidates.values(), key=lambda x: x["rrf_score"], reverse=True)
        top_candidates = ranked_list[:top_k * 2]

        # 4. Cross-Encoder Reranking
        if rerank and top_candidates:
            final_results = reranker.rerank(query, top_candidates, top_k=top_k)
        else:
            final_results = top_candidates[:top_k]

        return final_results

hybrid_retriever = HybridRetriever()
