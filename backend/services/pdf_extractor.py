import pdfplumber


def extract_text(path: str) -> str:
    """
    Extract all readable text from a PDF file.
    Returns plain text without page markers.
    Used for: notes in generate mode, PPTX conversion.
    """
    parts = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t and t.strip():
                    parts.append(t.strip())
    except Exception as e:
        raise RuntimeError(f"Failed to read PDF: {e}")
    return "\n\n".join(parts).strip()


def extract_text_with_pages(path: str) -> str:
    """
    Extract text from PDF with page number markers.
    Each page's text is prefixed with [PAGE X] so the AI
    can reference exact page numbers in its answers.
    Used for: notes when answering QP questions.
    """
    parts = []
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages, 1):
                t = page.extract_text()
                if t and t.strip():
                    # Tag each page so AI knows page numbers
                    parts.append(f"[PAGE {i}]\n{t.strip()}")
    except Exception as e:
        raise RuntimeError(f"Failed to read PDF: {e}")
    return "\n\n".join(parts).strip()