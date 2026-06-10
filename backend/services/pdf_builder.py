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

# ── Blue academic color palette ───────────────────────────────────────────────
NAVY    = colors.HexColor("#1e3a5f")
BLUE    = colors.HexColor("#2563eb")
LBLUE   = colors.HexColor("#dbeafe")
SLATE   = colors.HexColor("#475569")
MUTED   = colors.HexColor("#94a3b8")
RULE    = colors.HexColor("#e2e8f0")
ANS_BG  = colors.HexColor("#f0f7ff")
PAGE_BG = colors.HexColor("#eff6ff")
WHITE   = colors.white

DIFF_COLOR = {
    "easy":   colors.HexColor("#15803d"),
    "medium": colors.HexColor("#b45309"),
    "hard":   colors.HexColor("#b91c1c"),
}


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("rTitle",
            parent=base["Title"],
            fontSize=22, fontName="Helvetica-Bold",
            textColor=NAVY, alignment=TA_CENTER, spaceAfter=3),
        "sub": ParagraphStyle("rSub",
            parent=base["Normal"],
            fontSize=10, textColor=MUTED,
            alignment=TA_CENTER, spaceAfter=2),
        "q": ParagraphStyle("rQ",
            parent=base["Normal"],
            fontSize=12, fontName="Helvetica-Bold",
            textColor=NAVY, leading=17),
        "a": ParagraphStyle("rA",
            parent=base["Normal"],
            fontSize=11, textColor=SLATE,
            leading=16, leftIndent=6),
        "page_ref": ParagraphStyle("rPage",
            parent=base["Normal"],
            fontSize=9.5, textColor=colors.HexColor("#1d4ed8"),
            fontName="Helvetica-Bold",
            spaceBefore=4),
        "note_src": ParagraphStyle("rNote",
            parent=base["Normal"],
            fontSize=9, textColor=colors.HexColor("#92400e"),
            spaceBefore=2),
        "tag": ParagraphStyle("rTag",
            parent=base["Normal"],
            fontSize=8.5, textColor=MUTED, spaceBefore=3),
    }


def _tag_row(item: dict, mode: str) -> str:
    """Build the tag line shown under each question."""
    parts = []
    if item.get("topic"):
        parts.append(f"📌 {item['topic']}")
    if item.get("marks"):
        parts.append(f"{item['marks']} marks")
    if mode == "generated" and item.get("difficulty"):
        parts.append(item["difficulty"].upper())
    if item.get("note_source"):
        parts.append(f"📋 {item['note_source']}")
    return "  ·  ".join(parts)


def build_pdf(items: list[dict], output_path: str, title: str, mode: str):
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    S = _styles()
    story = []

    # ── Cover header ──────────────────────────────────────────────────────
    subtitle = (
        "Answers generated from your study notes — with page references"
        if mode == "qp"
        else (
            f"AI-generated questions  ·  "
            f"{items[0].get('difficulty','').capitalize() if items else ''}  ·  "
            f"{items[0].get('marks','') if items else ''} marks"
        )
    )

    story += [
        Paragraph("Reviso", S["title"]),
        Paragraph(title, ParagraphStyle("rT2",
            parent=S["sub"], fontSize=13,
            textColor=NAVY, fontName="Helvetica-Bold")),
        Paragraph(subtitle, S["sub"]),
        Paragraph(
            f"Generated {datetime.now().strftime('%d %B %Y')}  ·  {len(items)} questions",
            S["sub"],
        ),
        Spacer(1, 0.3*cm),
        HRFlowable(width="100%", thickness=2, color=BLUE),
        Spacer(1, 0.4*cm),
    ]

    # ── Questions & answers ───────────────────────────────────────────────
    for idx, item in enumerate(items, 1):
        tag  = _tag_row(item, mode)

        # Question block with blue left accent bar
        q_table = Table(
            [["", Paragraph(f"Q{idx}.  {item['question']}", S["q"])]],
            colWidths=[0.22*cm, None],
        )
        q_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (0, 0), BLUE),
            ("BACKGROUND",    (1, 0), (1, 0), LBLUE),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (1, 0), (1, 0), 12),
            ("RIGHTPADDING",  (1, 0), (1, 0), 8),
        ]))

        # Answer block
        a_table = Table(
            [[Paragraph(f"<b>Answer:</b>  {item['answer']}", S["a"])]],
            colWidths=["100%"],
        )
        a_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), ANS_BG),
            ("LINEBEFORE",    (0, 0), (0, -1), 2.5, BLUE),
            ("TOPPADDING",    (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ]))

        # Build block elements
        block_elements = [
            q_table,
        ]

        # Tag line
        if tag:
            block_elements.append(Paragraph(tag, S["tag"]))

        block_elements += [
            Spacer(1, 0.15*cm),
            a_table,
        ]

        # Page reference — only for QP answers
        if item.get("pages") and item.get("source") == "qp":
            page_ref_table = Table(
                [[
                    Paragraph(f"📄  {item['pages']}  in your notes", S["page_ref"]),
                ]],
                colWidths=["100%"],
            )
            page_ref_table.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), PAGE_BG),
                ("LINEBEFORE",    (0, 0), (0, -1), 2.5, colors.HexColor("#2563eb")),
                ("TOPPADDING",    (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ]))
            block_elements.append(Spacer(1, 0.1*cm))
            block_elements.append(page_ref_table)

        block_elements += [
            Spacer(1, 0.2*cm),
            HRFlowable(width="100%", thickness=0.4, color=RULE),
            Spacer(1, 0.28*cm),
        ]

        story.append(KeepTogether(block_elements))

    # ── Footer ────────────────────────────────────────────────────────────
    story.append(Paragraph(
        "Reviso — Study Helping AI  ·  Good luck! 🎓",
        S["sub"]
    ))

    doc.build(story)