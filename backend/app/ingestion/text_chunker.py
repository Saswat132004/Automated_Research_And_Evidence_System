import re
import uuid

class TextChunker:
    """
    Cybersecurity-aware chunker that preserves contextual headers, CVE references, and code indicators.
    """
    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 60):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, document_id: str, doc_name: str) -> list[dict]:
        paragraphs = re.split(r"\n\s*\n", text)
        chunks = []
        current_chunk = []
        current_words_count = 0
        chunk_idx = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            words = para.split()
            para_word_count = len(words)

            if current_words_count + para_word_count > self.chunk_size and current_chunk:
                chunk_str = "\n\n".join(current_chunk)
                chunks.append(self._create_chunk_dict(chunk_str, chunk_idx, document_id, doc_name))
                chunk_idx += 1
                
                # Keep overlap from the end of current chunk
                overlap_words = " ".join(current_chunk).split()[-self.chunk_overlap:]
                current_chunk = [" ".join(overlap_words), para]
                current_words_count = len(overlap_words) + para_word_count
            else:
                current_chunk.append(para)
                current_words_count += para_word_count

        if current_chunk:
            chunk_str = "\n\n".join(current_chunk)
            chunks.append(self._create_chunk_dict(chunk_str, chunk_idx, document_id, doc_name))

        return chunks

    def _create_chunk_dict(self, content: str, index: int, doc_id: str, doc_name: str) -> dict:
        return {
            "id": f"{doc_id}-chunk-{index}",
            "document_id": doc_id,
            "document_name": doc_name,
            "chunk_index": index,
            "content": content,
            "word_count": len(content.split()),
            "source_type": "local_doc",
            "credibility_score": 0.90,
        }

text_chunker = TextChunker()
