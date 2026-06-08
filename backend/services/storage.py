from pathlib import Path
from fastapi import UploadFile
import re

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def _safe(name: str) -> str:
    """Make filename safe — remove spaces, brackets, special chars."""
    return re.sub(r"[^\w\-.]", "_", name)


async def save_upload(kind: str, file: UploadFile) -> str:
    """Save uploaded file using safe filename. Returns safe path."""
    safe_name = _safe(file.filename)
    path = UPLOAD_DIR / f"{kind}_{safe_name}"
    path.write_bytes(await file.read())
    return str(path)


def get_safe_name(filename: str) -> str:
    """Convert any filename to its safe version."""
    return _safe(filename)


def get_upload_path(kind: str, filename: str) -> str:
    """
    Find uploaded file. Always converts to safe name first.
    """
    # Always look for the safe version
    safe_name = _safe(filename)
    path = UPLOAD_DIR / f"{kind}_{safe_name}"
    if path.exists():
        return str(path)

    raise FileNotFoundError(
        f"File not found: {safe_name} — please upload it again."
    )


def get_combined_text(kind: str, filenames: list[str], extract_fn) -> str:
    """
    Extract and combine text from multiple uploaded files.
    """
    parts = []
    for name in filenames:
        try:
            path = get_upload_path(kind, name)
            text = extract_fn(path)
            if text.strip():
                parts.append(f"=== {name} ===\n{text}")
        except FileNotFoundError as e:
            print(f"Warning: {e}")
        except Exception as e:
            print(f"Warning: could not read {name}: {e}")
    return "\n\n".join(parts)