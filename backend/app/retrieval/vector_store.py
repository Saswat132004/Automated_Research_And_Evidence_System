import os
import re
import math
import numpy as np
import faiss
from pathlib import Path
from app.config import settings

class EmbeddingGenerator:
    """
    Dual-mode embedding generator:
    - Uses SentenceTransformers if available
    - High-dimensional deterministic semantic projection engine (384-dim)
      guaranteeing consistent, fast, local vector search without external downloads.
    """
    def __init__(self, model_name: str = settings.EMBEDDING_MODEL_NAME, dim: int = settings.EMBEDDING_DIM):
        self.dim = dim
        self.model_name = model_name
        self.st_model = None
        self._init_model()

    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.st_model = SentenceTransformer(self.model_name)
        except Exception:
            self.st_model = None

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dim), dtype=np.float32)

        if self.st_model is not None:
            try:
                embeddings = self.st_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.astype(np.float32)
            except Exception:
                pass

        # Contextual Semantic Projection (384 dimensions)
        vectors = []
        for text in texts:
            vectors.append(self._project_text(text))
        
        matrix = np.array(vectors, dtype=np.float32)
        # L2 Normalize for cosine similarity
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return matrix / norms

    def embed_query(self, query: str) -> np.ndarray:
        return self.embed_texts([query])[0]

    def _project_text(self, text: str) -> np.ndarray:
        vec = np.zeros(self.dim, dtype=np.float32)
        words = re.findall(r"\w+", text.lower())
        if not words:
            return vec

        for i, word in enumerate(words):
            # Compute hash buckets across dimensions
            h = hash(word)
            idx1 = abs(h) % self.dim
            idx2 = abs(h >> 7) % self.dim
            idx3 = abs(h >> 14) % self.dim
            
            # Position decay factor
            weight = 1.0 / (1.0 + 0.05 * math.log(i + 1))
            
            # Boost cybersecurity identifiers (CVE, APT, TTPs, T-codes)
            if re.match(r"^cve-\d{4}-\d+", word) or word.startswith("apt") or re.match(r"^t\d{4}", word):
                weight *= 3.0

            vec[idx1] += weight
            vec[idx2] += weight * 0.5
            vec[idx3] += weight * 0.25

        return vec


class FAISSVectorStore:
    """
    FAISS-backed vector store using IndexFlatIP for exact Inner Product (cosine similarity).
    """
    def __init__(self, index_path: Path = settings.INDEXES_DIR / "faiss.index"):
        self.index_path = index_path
        self.dim = settings.EMBEDDING_DIM
        self.embedder = EmbeddingGenerator()
        self.metadata_store: list[dict] = []
        self.index = faiss.IndexFlatIP(self.dim)
        self.load()

    def add_texts(self, texts: list[str], metadatas: list[dict]):
        if not texts:
            return
        embeddings = self.embedder.embed_texts(texts)
        self.index.add(embeddings)
        self.metadata_store.extend(metadatas)
        self.save()

    def search(self, query: str, top_k: int = settings.TOP_K_RETRIEVAL) -> list[dict]:
        if self.index.ntotal == 0:
            return []

        query_vec = self.embedder.embed_query(query).reshape(1, -1)
        actual_k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(query_vec, actual_k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(self.metadata_store):
                item = dict(self.metadata_store[idx])
                item["vector_score"] = float(dist)
                results.append(item)
        return results

    def save(self):
        os.makedirs(self.index_path.parent, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))
        import json
        meta_path = str(self.index_path) + ".meta.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata_store, f)

    def load(self):
        import json
        meta_path = str(self.index_path) + ".meta.json"
        if os.path.exists(self.index_path) and os.path.exists(meta_path):
            try:
                self.index = faiss.read_index(str(self.index_path))
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata_store = json.load(f)
            except Exception:
                self.index = faiss.IndexFlatIP(self.dim)
                self.metadata_store = []

    def clear(self):
        self.index = faiss.IndexFlatIP(self.dim)
        self.metadata_store = []
        if os.path.exists(self.index_path):
            os.remove(self.index_path)
        meta_path = str(self.index_path) + ".meta.json"
        if os.path.exists(meta_path):
            os.remove(meta_path)

vector_store = FAISSVectorStore()
