import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.retrieval.vector_store import vector_store
from app.retrieval.bm25_index import bm25_index
from app.retrieval.hybrid_retriever import hybrid_retriever
from app.retrieval.reranker import reranker

def test_vector_and_bm25_indexing():
    docs = [
        {"id": "doc1", "content": "Log4Shell CVE-2021-44228 remote code execution in Apache Log4j JNDI"},
        {"id": "doc2", "content": "ConnectWise ScreenConnect authentication bypass CVE-2024-1709 administrative access"},
        {"id": "doc3", "content": "MOVEit Transfer SQL injection CVE-2023-34362 exploited by CL0P syndicate"}
    ]
    texts = [d["content"] for d in docs]
    vector_store.add_texts(texts, docs)
    bm25_index.add_documents(docs)

    # Test FAISS vector search
    vec_results = vector_store.search("Log4Shell JNDI exploit", top_k=2)
    assert len(vec_results) > 0
    assert any("CVE-2021-44228" in r["content"] for r in vec_results)

    # Test BM25 keyword search
    bm25_results = bm25_index.search("CVE-2024-1709", top_k=2)
    assert len(bm25_results) > 0
    assert any("CVE-2024-1709" in r["content"] for r in bm25_results)

def test_hybrid_and_reranking():
    hybrid_results = hybrid_retriever.retrieve("SQL injection CL0P ransomware", top_k=2, rerank=True)
    assert len(hybrid_results) > 0
    assert any("CVE-2023-34362" in r["content"] or "CL0P" in r["content"] for r in hybrid_results)
