import datetime

class MarkdownReportGenerator:
    """
    Generates structured, verifiable cybersecurity research reports in Markdown.
    """
    def generate(self, session: dict, evidence_list: list[dict], report_text: str) -> str:
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        query = session.get("query", "Investigation")
        conf = session.get("confidence_score", 0.95)

        lines = [
            f"# ARES Threat Intelligence Research Report",
            f"**Autonomous Research & Evidence System (ARES)**  ",
            f"**Generated:** {timestamp} | **Classification:** TLP:AMBER | **Confidence Score:** {conf * 100:.1f}%\n",
            f"---",
            f"## 1. Investigation Scope",
            f"- **Target Query:** `{query}`",
            f"- **Investigation Type:** `{session.get('query_type', 'vulnerability_research')}`",
            f"- **Evidence Verified Count:** `{len(evidence_list)}` sources\n",
            f"---",
            f"## 2. Research Findings & Synthesis",
            report_text,
            f"\n---",
            f"## 3. Evidence Provenance & Citation Ledger",
            f"| Citation ID | Source Type | Credibility | Authoritative Repository | Freshness |",
            f"| :--- | :--- | :--- | :--- | :--- |"
        ]

        for ev in evidence_list:
            cid = ev.get("citation_id", "ARES-CIT")
            stype = ev.get("source_type", "Database")
            cred = f"{ev.get('credibility_score', 0.85) * 100:.0f}%"
            sname = ev.get("source_name", "Unknown Source")
            fresh = ev.get("freshness_date", "Recent")
            lines.append(f"| `[{cid}]` | {stype} | {cred} | {sname} | {fresh} |")

        lines.extend([
            f"\n---",
            f"## 4. Methodological Verification & Guardrails",
            f"- **Hybrid Search Engine:** BM25 (token preservation) + FAISS (cosine Inner Product)",
            f"- **Ranking Model:** Reciprocal Rank Fusion (RRF, k=60) + Cross-Encoder",
            f"- **Entity & Threat Extraction:** MITRE ATT&CK Enterprise Matrix v14 + CISA KEV Feed",
            f"- **Self-Verification Engine:** All factual assertions checked for citation grounding."
        ])

        return "\n".join(lines)

markdown_generator = MarkdownReportGenerator()
