import os
import re
import json
from rank_bm25 import BM25Okapi
from app.config import settings

class BM25Index:
    """
    BM25 keyword search engine with cybersecurity token preservation (CVEs, TTPs, domains, hashes).
    """
    def __init__(self, index_path=settings.INDEXES_DIR / "bm25_corpus.json"):
        self.index_path = index_path
        self.corpus_docs: list[dict] = []
        self.tokenized_corpus: list[list[str]] = []
        self.bm25: BM25Okapi | None = None
        self.load()

    def _tokenize(self, text: str) -> list[str]:
        # Preserve hyphenated CVEs, MITRE T-codes, and dotted versions
        text = text.lower()
        tokens = re.findall(r"[a-z0-9_\-\.]+", text)
        return [t for t in tokens if len(t) > 1]

    def add_documents(self, documents: list[dict]):
        """
        Each document dict must have 'content' and 'id'
        """
        for doc in documents:
            content = doc.get("content", "")
            self.corpus_docs.append(doc)
            self.tokenized_corpus.append(self._tokenize(content))

        if self.tokenized_corpus:
            self.bm25 = BM25Okapi(self.tokenized_corpus)
            self.save()

    def search(self, query: str, top_k: int = settings.TOP_K_RETRIEVAL) -> list[dict]:
        if not self.bm25 or not self.corpus_docs:
            return []

        tokens = self._tokenize(query)
        if not tokens:
            return []

        scores = self.bm25.get_scores(tokens)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.0:
                item = dict(self.corpus_docs[idx])
                item["bm25_score"] = score
                results.append(item)
        return results

    def save(self):
        os.makedirs(self.index_path.parent, exist_ok=True)
        with open(self.index_path, "w", encoding="utf-8") as f:
            json.dump(self.corpus_docs, f)

    def load(self):
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, "r", encoding="utf-8") as f:
                    self.corpus_docs = json.load(f)
                self.tokenized_corpus = [self._tokenize(d.get("content", "")) for d in self.corpus_docs]
                if self.tokenized_corpus:
                    self.bm25 = BM25Okapi(self.tokenized_corpus)
            except Exception:
                self.corpus_docs = []
                self.tokenized_corpus = []
                self.bm25 = None

    def clear(self):
        self.corpus_docs = []
        self.tokenized_corpus = []
        self.bm25 = None
        if os.path.exists(self.index_path):
            os.remove(self.index_path)

bm25_index = BM25Index()
