from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from dotenv import load_dotenv
from typing import List
import uvicorn
import re
import tempfile
import os

load_dotenv()

from services.pdf_extractor  import extract_text, extract_text_with_pages
from services.qa_engine      import answer_from_qp, generate_from_notes
from services.pdf_builder    import build_pdf
from services.pptx_converter import pptx_to_pdf

app = FastAPI(title="Reviso", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("outputs").mkdir(exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe(name: str) -> str:
    """Strip unsafe characters from filename."""
    return re.sub(r"[^\w\-.]", "_", name)


def _is_pptx(filename: str) -> bool:
    return filename.lower().endswith(".pptx")


def _clean_name(filename: str) -> str:
    """Get a clean readable name from filename."""
    name = Path(filename).stem
    name = re.sub(r"[_\-]+", " ", name)
    return name.strip()


async def _file_to_text(file: UploadFile) -> str:
    """
    Read uploaded file bytes, extract text without page markers.
    Used for: notes in generate mode, QP files.
    """
    content = await file.read()
    suffix  = ".pptx" if _is_pptx(file.filename) else ".pdf"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if _is_pptx(file.filename):
            pdf_path = tmp_path.replace(".pptx", ".pdf")
            pptx_to_pdf(tmp_path, pdf_path)
            text = extract_text(pdf_path)
            try: os.unlink(pdf_path)
            except: pass
        else:
            text = extract_text(tmp_path)
    finally:
        try: os.unlink(tmp_path)
        except: pass

    return text


async def _file_to_text_with_pages(file: UploadFile) -> str:
    """
    Read uploaded file bytes, extract text WITH [PAGE X] markers.
    Used for: notes when answering QP — so AI can cite page numbers.
    """
    content = await file.read()
    suffix  = ".pptx" if _is_pptx(file.filename) else ".pdf"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if _is_pptx(file.filename):
            pdf_path = tmp_path.replace(".pptx", ".pdf")
            pptx_to_pdf(tmp_path, pdf_path)
            text = extract_text_with_pages(pdf_path)
            try: os.unlink(pdf_path)
            except: pass
        else:
            text = extract_text_with_pages(tmp_path)
    finally:
        try: os.unlink(tmp_path)
        except: pass

    return text


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "app": "Reviso v5"}


# ── Unified generate endpoint ─────────────────────────────────────────────────

@app.post("/generate/all")
async def generate_all(
    notes_files: List[UploadFile] = File(...),
    qp_files:    List[UploadFile] = File(default=[]),
    difficulty:  str = Form(default="medium"),
    marks:       int = Form(default=3),
    count:       int = Form(default=5),
):
    """
    Upload files + generate Q&A in ONE request.
    No memory needed — everything happens in real time.

    Mode A (QP uploaded):
      - Notes extracted WITH page numbers
      - AI answers every QP question and cites page numbers

    Mode B (no QP):
      - Notes extracted normally
      - AI generates questions per notes file
      - Each question tagged with its source notes file name
    """

    # Detect mode early so we know which extraction to use
    has_qp = bool(qp_files and any(f.filename for f in qp_files))

    # ── Extract notes ─────────────────────────────────────────────────────
    notes_data = []  # list of (clean_name, text)

    for f in notes_files:
        try:
            if has_qp:
                # Use page-tagged extraction for QP mode
                text = await _file_to_text_with_pages(f)
            else:
                # Plain extraction for generate mode
                text = await _file_to_text(f)

            if text.strip():
                clean = _clean_name(f.filename)
                notes_data.append((clean, text))
        except Exception as e:
            print(f"Warning: could not read notes {f.filename}: {e}")

    if not notes_data:
        raise HTTPException(422,
            "Could not extract text from your notes. "
            "Make sure it is not a scanned image.")

    # ── Mode A: Answer QP questions from combined notes ───────────────────
    if has_qp:
        # Combine all notes with names and page markers
        combined_notes = "\n\n".join(
            f"=== NOTES: {name} ===\n{text}"
            for name, text in notes_data
        )

        all_items = []
        for f in qp_files:
            if not f.filename:
                continue
            try:
                qp_text = await _file_to_text(f)
                items   = await answer_from_qp(
                    qp_text,
                    combined_notes,
                    _clean_name(f.filename),
                )
                all_items.extend(items)
            except Exception as e:
                print(f"Warning: failed QP {f.filename}: {e}")

        if not all_items:
            raise HTTPException(500, "AI returned no results.")

        return {
            "mode":  "qp",
            "items": all_items,
            "total": len(all_items),
        }

    # ── Mode B: Generate questions from EACH notes file separately ────────
    else:
        if difficulty not in ("easy", "medium", "hard"):
            raise HTTPException(400, "difficulty must be easy, medium, or hard.")
        if marks not in (3, 7):
            raise HTTPException(400, "marks must be 3 or 7.")
        if not (1 <= count <= 20):
            raise HTTPException(400, "count must be between 1 and 20.")

        all_items = []

        for note_name, note_text in notes_data:
            try:
                items = await generate_from_notes(
                    note_text,
                    difficulty,
                    marks,
                    count,
                    note_name,
                )
                all_items.extend(items)
            except Exception as e:
                print(f"Warning: failed to generate from {note_name}: {e}")

        if not all_items:
            raise HTTPException(500, "AI returned no questions. Try a different PDF.")

        return {
            "mode":       "generated",
            "difficulty": difficulty,
            "marks":      marks,
            "items":      all_items,
            "total":      len(all_items),
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