import os
import hashlib
from pathlib import Path
from pypdf import PdfReader
import docx
from app.ingestion.text_chunker import text_chunker
from app.retrieval.vector_store import vector_store
from app.retrieval.bm25_index import bm25_index

class DocumentParser:
    """
    Parses PDF, DOCX, TXT, and Markdown files and synchronizes with FAISS and BM25.
    """
    @staticmethod
    def compute_sha256(file_path: str) -> str:
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()

    def parse_file(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return self._parse_pdf(file_path)
        elif ext == ".docx":
            return self._parse_docx(file_path)
        elif ext in [".txt", ".md", ".json"]:
            return self._parse_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    def _parse_pdf(self, path: str) -> str:
        reader = PdfReader(path)
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(f"--- Page {i+1} ---\n{page_text}")
        return "\n\n".join(text_parts)

    def _parse_docx(self, path: str) -> str:
        doc = docx.Document(path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)

    def _parse_text(self, path: str) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    def process_and_index(self, file_path: str, doc_id: str, original_filename: str) -> list[dict]:
        text = self.parse_file(file_path)
        chunks = text_chunker.chunk_text(text, doc_id, original_filename)

        if not chunks:
            return []

        # Vector indexing
        texts = [c["content"] for c in chunks]
        vector_store.add_texts(texts, chunks)

        # BM25 indexing
        bm25_index.add_documents(chunks)

        return chunks

document_parser = DocumentParser()
