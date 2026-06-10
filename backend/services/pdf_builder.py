from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    HRFlowable, Table, TableStyle, KeepTogether,
)
from datetime import datetime

NAVY  = colors.HexColor("#1e3a5f")
BLUE  = colors.HexColor("#2563eb")
LBLUE = colors.HexColor("#dbeafe")
SLATE = colors.HexColor("#475569")
MUTED = colors.HexColor("#94a3b8")
RULE  = colors.HexColor("#e2e8f0")
ANSBG = colors.HexColor("#f0f7ff")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("T", parent=base["Title"],
            fontSize=22, fontName="Helvetica-Bold",
            textColor=NAVY, alignment=TA_CENTER, spaceAfter=4),
        "sub": ParagraphStyle("S", parent=base["Normal"],
            fontSize=10, textColor=MUTED,
            alignment=TA_CENTER, spaceAfter=2),
        "q": ParagraphStyle("Q", parent=base["Normal"],
            fontSize=12, fontName="Helvetica-Bold",
            textColor=NAVY, leading=17),
        "a": ParagraphStyle("A", parent=base["Normal"],
            fontSize=11, textColor=SLATE, leading=16, leftIndent=6),
        "tag": ParagraphStyle("Tag", parent=base["Normal"],
            fontSize=8.5, textColor=MUTED, spaceBefore=3),
    }


def build_pdf(items, output_path, title, mode):
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    S = _styles()
    story = []

    subtitle = (
        "Answers generated from your study notes"
        if mode == "qp"
        else f"AI-generated questions · {items[0].get('difficulty','').capitalize()} · {items[0].get('marks','')} marks"
    )

    story += [
        Paragraph("Reviso", S["title"]),
        Paragraph(title, ParagraphStyle("t2", parent=S["sub"],
            fontSize=13, textColor=NAVY, fontName="Helvetica-Bold")),
        Paragraph(subtitle, S["sub"]),
        Paragraph(
            f"Generated {datetime.now().strftime('%d %B %Y')}  ·  {len(items)} questions",
            S["sub"],
        ),
        Spacer(1, 0.3*cm),
        HRFlowable(width="100%", thickness=2, color=BLUE),
        Spacer(1, 0.4*cm),
    ]

    for idx, item in enumerate(items, 1):
        tags = []
        if item.get("topic"):
            tags.append(f"📌 {item['topic']}")
        if item.get("marks"):
            tags.append(f"{item['marks']} marks")
        if item.get("difficulty"):
            tags.append(item["difficulty"].upper())
        tag_line = "  ·  ".join(tags)

        q_table = Table(
            [["", Paragraph(f"Q{idx}.  {item['question']}", S["q"])]],
            colWidths=[0.22*cm, None],
        )
        q_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), BLUE),
            ("BACKGROUND", (1, 0), (1, 0), LBLUE),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (1, 0), (1, 0), 12),
        ]))

        # Answer text with page reference
        answer_content = f"<b>Answer:</b>  {item['answer']}"
        if item.get("pages") and item.get("source") == "qp":
            answer_content += f"<br/><br/><font color='#2563eb'><b>📄 {item['pages']} in your notes</b></font>"

        a_table = Table(
            [[Paragraph(answer_content, S["a"])]],
            colWidths=["100%"],
        )
        a_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ANSBG),
            ("LINEBEFORE",    (0, 0), (0, -1), 2.5, BLUE),
            ("TOPPADDING",    (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ]))

        story.append(KeepTogether([
            q_table,
            Paragraph(tag_line, S["tag"]),
            Spacer(1, 0.15*cm),
            a_table,
            Spacer(1, 0.2*cm),
            HRFlowable(width="100%", thickness=0.4, color=RULE),
            Spacer(1, 0.28*cm),
        ]))

    story.append(Paragraph("Reviso — Study Helping AI  ·  Good luck! 🎓", S["sub"]))
    doc.build(story)