import pdfplumber


def extract_text(path: str) -> str:
    """Extract all readable text from a PDF file."""
    parts = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    parts.append(t)
    except Exception as e:
        raise RuntimeError(f"Failed to read PDF: {e}")
    return "\n\n".join(parts).strip()


def extract_text_with_pages(path: str) -> str:
    """
    Extract text from PDF with page number markers.
    Each page's text is prefixed with [PAGE X] so the AI
    can reference page numbers in its answers.
    """
    parts = []
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages, 1):
                t = page.extract_text()
                if t and t.strip():
                    # Tag each page clearly so AI knows page numbers
                    parts.append(f"[PAGE {i}]\n{t.strip()}")
    except Exception as e:
        raise RuntimeError(f"Failed to read PDF: {e}")
    return "\n\n".join(parts).strip()