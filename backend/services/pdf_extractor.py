import pdfplumber


def extract_text(path: str) -> str:
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