from pathlib import Path
from fastapi import UploadFile
import re

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def _safe(name: str) -> str:
    return re.sub(r"[^\w\-.]", "_", name)


async def save_upload(kind: str, file: UploadFile) -> str:
    path = UPLOAD_DIR / f"{kind}_{_safe(file.filename)}"
    path.write_bytes(await file.read())
    return str(path)


def get_upload_path(kind: str, filename: str) -> str:
    path = UPLOAD_DIR / f"{kind}_{_safe(filename)}"
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path.name}")
    return str(path)


def get_combined_text(kind: str, filenames: list[str], extract_fn) -> str:
    """
    Extract and combine text from multiple uploaded files.
    Each file's text is separated by a clear divider.
    """
    parts = []
    for name in filenames:
        try:
            path = get_upload_path(kind, name)
            text = extract_fn(path)
            if text.strip():
                parts.append(f"=== {name} ===\n{text}")
        except Exception as e:
            print(f"Warning: could not read {name}: {e}")
    return "\n\n".join(parts)