import os
import re
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.config import settings

class PDFReportGenerator:
    """
    Generates professional, publication-ready PDF cybersecurity research reports.
    """
    def generate_pdf(self, session_id: str, title: str, markdown_content: str, evidence_list: list[dict]) -> str:
        pdf_filename = f"ARES_Report_{session_id[:8]}.pdf"
        pdf_path = settings.REPORTS_DIR / pdf_filename

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0B1020"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#4B5563"),
            spaceAfter=15
        )
        h2_style = ParagraphStyle(
            "Heading2Custom",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1E3A8A"),
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            "BodyCustom",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=6
        )

        story = []

        # Title block
        story.append(Paragraph(f"ARES — Threat Intelligence Report", title_style))
        story.append(Paragraph(f"Autonomous Research & Evidence System | Target: {title}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3B82F6"), spaceAfter=15))

        # Parse text into paragraphs and headings
        lines = markdown_content.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                story.append(Spacer(1, 4))
                continue

            if line.startswith("# "):
                continue
            elif line.startswith("## ") or line.startswith("### "):
                clean_heading = re.sub(r"^#+\s*", "", line)
                story.append(Paragraph(clean_heading, h2_style))
            elif line.startswith("- ") or line.startswith("* "):
                bullet_text = "&bull; " + re.sub(r"^[\*\-]\s*", "", line)
                story.append(Paragraph(bullet_text, body_style))
            elif line.startswith("1. ") or line.startswith("2. ") or line.startswith("3. ") or line.startswith("4. "):
                story.append(Paragraph(line, body_style))
            elif not line.startswith("|") and not line.startswith("---"):
                story.append(Paragraph(line, body_style))

        # Citations Table
        if evidence_list:
            story.append(Spacer(1, 15))
            story.append(Paragraph("Verifiable Evidence Ledger", h2_style))
            
            table_data = [["Citation", "Source Type", "Credibility", "Authoritative Repository"]]
            for ev in evidence_list[:8]:
                table_data.append([
                    ev.get("citation_id", "ARES-CIT"),
                    ev.get("source_type", "Database"),
                    f"{ev.get('credibility_score', 0.85) * 100:.0f}%",
                    ev.get("source_name", "Authoritative Source")[:35]
                ])

            t = Table(table_data, colWidths=[80, 100, 80, 270])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("FONTSIZE", (0, 1), (-1, -1), 8.5),
            ]))
            story.append(t)

        doc.build(story)
        return str(pdf_path)

pdf_generator = PDFReportGenerator()
