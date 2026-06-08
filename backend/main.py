from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from dotenv import load_dotenv
import uvicorn
import re
import tempfile
import os

load_dotenv()

from services.pdf_extractor  import extract_text
from services.qa_engine      import answer_from_qp, generate_from_notes
from services.pdf_builder    import build_pdf
from services.pptx_converter import pptx_to_pdf

app = FastAPI(title="Reviso", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("outputs").mkdir(exist_ok=True)

# ── In-memory text store ──────────────────────────────────────────────────────
# Stores extracted text keyed by safe filename
# This survives within a server session even if disk is wiped
TEXT_STORE: dict[str, str] = {}


def _safe(name: str) -> str:
    return re.sub(r"[^\w\-.]", "_", name)


def _is_pdf(filename: str) -> bool:
    return filename.lower().endswith(".pdf")


def _is_pptx(filename: str) -> bool:
    return filename.lower().endswith(".pptx")


async def _extract_from_upload(file: UploadFile) -> tuple[str, str]:
    """
    Read uploaded file bytes, save to temp file,
    extract text, return (safe_filename, text).
    Works even when disk is ephemeral.
    """
    content = await file.read()
    filename = file.filename

    # Write to a temp file for processing
    suffix = ".pptx" if _is_pptx(filename) else ".pdf"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if _is_pptx(filename):
            # Convert PPTX to PDF first
            pdf_tmp = tmp_path.replace(suffix, ".pdf")
            pptx_to_pdf(tmp_path, pdf_tmp)
            text = extract_text(pdf_tmp)
            safe_name = _safe(Path(filename).stem) + ".pdf"
            # Clean up PDF tmp
            try: os.unlink(pdf_tmp)
            except: pass
        else:
            text = extract_text(tmp_path)
            safe_name = _safe(filename)
    finally:
        # Always clean up temp file
        try: os.unlink(tmp_path)
        except: pass

    return safe_name, text


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "app": "Reviso v3"}


# ── Upload notes ──────────────────────────────────────────────────────────────

@app.post("/upload/notes")
async def upload_notes(file: UploadFile = File(...)):
    if not _is_pdf(file.filename) and not _is_pptx(file.filename):
        raise HTTPException(400, "Only PDF or PPTX files are accepted.")

    safe_name, text = await _extract_from_upload(file)

    if len(text.strip()) < 50:
        raise HTTPException(422,
            "Could not read text from your file. "
            "Make sure it is not a scanned image.")

    # Store text in memory
    TEXT_STORE[f"notes_{safe_name}"] = text

    return {
        "ok":        True,
        "filename":  safe_name,
        "converted": _is_pptx(file.filename),
        "chars":     len(text),
    }


# ── Upload QP ─────────────────────────────────────────────────────────────────

@app.post("/upload/qp")
async def upload_qp(file: UploadFile = File(...)):
    if not _is_pdf(file.filename) and not _is_pptx(file.filename):
        raise HTTPException(400, "Only PDF or PPTX files are accepted.")

    safe_name, text = await _extract_from_upload(file)

    if len(text.strip()) < 30:
        raise HTTPException(422,
            "Could not read text from the question paper.")

    # Store text in memory
    TEXT_STORE[f"qp_{safe_name}"] = text

    return {
        "ok":        True,
        "filename":  safe_name,
        "converted": _is_pptx(file.filename),
    }


# ── Generate: QP mode ─────────────────────────────────────────────────────────

@app.post("/generate/qp-answers")
async def generate_qp_answers(body: dict):
    notes_files = body.get("notes_files", [])
    qp_files    = body.get("qp_files",    [])

    if not notes_files:
        raise HTTPException(400, "At least one notes file is required.")
    if not qp_files:
        raise HTTPException(400, "At least one QP file is required.")

    # Combine notes text from memory
    notes_parts = []
    for name in notes_files:
        key  = f"notes_{name}"
        text = TEXT_STORE.get(key, "")
        if text.strip():
            notes_parts.append(f"=== {name} ===\n{text}")

    if not notes_parts:
        raise HTTPException(422,
            "Could not find notes text. "
            "Please upload your files again — the server may have restarted.")

    notes_text = "\n\n".join(notes_parts)

    # Answer each QP
    all_items = []
    for qp_name in qp_files:
        key     = f"qp_{qp_name}"
        qp_text = TEXT_STORE.get(key, "")
        if not qp_text.strip():
            print(f"Warning: QP text not found for {qp_name}")
            continue
        try:
            items = await answer_from_qp(qp_text, notes_text, qp_name)
            all_items.extend(items)
        except Exception as e:
            print(f"Warning: failed to process QP {qp_name}: {e}")

    if not all_items:
        raise HTTPException(500, "AI returned no results.")

    return {"mode": "qp", "items": all_items, "total": len(all_items)}


# ── Generate: possible questions ──────────────────────────────────────────────

@app.post("/generate/possible-questions")
async def generate_possible(body: dict):
    notes_files = body.get("notes_files", [])
    difficulty  = body.get("difficulty",  "medium")
    marks       = body.get("marks",       3)
    count       = body.get("count",       5)

    if not notes_files:
        raise HTTPException(400, "At least one notes file is required.")
    if difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(400, "difficulty must be easy, medium, or hard.")
    if marks not in (3, 7):
        raise HTTPException(400, "marks must be 3 or 7.")
    if not isinstance(count, int) or not (1 <= count <= 20):
        raise HTTPException(400, "count must be between 1 and 20.")

    # Combine notes text from memory
    notes_parts = []
    for name in notes_files:
        key  = f"notes_{name}"
        text = TEXT_STORE.get(key, "")
        if text.strip():
            notes_parts.append(f"=== {name} ===\n{text}")

    if not notes_parts:
        raise HTTPException(422,
            "Could not find notes text. "
            "Please upload your files again — the server may have restarted.")

    notes_text = "\n\n".join(notes_parts)

    items = await generate_from_notes(notes_text, difficulty, marks, count)
    if not items:
        raise HTTPException(500, "AI returned no questions. Try a different PDF.")

    return {
        "mode":       "generated",
        "difficulty": difficulty,
        "marks":      marks,
        "items":      items,
    }


# ── Download PDF ──────────────────────────────────────────────────────────────

@app.post("/download/pdf")
async def download_pdf(body: dict):
    items = body.get("items", [])
    title = body.get("title", "Reviso Study Sheet")
    mode  = body.get("mode",  "qp")

    if not items:
        raise HTTPException(400, "No items to export.")

    out = Path("outputs") / "reviso_sheet.pdf"
    build_pdf(items, str(out), title, mode)

    return FileResponse(
        str(out),
        media_type="application/pdf",
        filename="reviso_sheet.pdf",
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)