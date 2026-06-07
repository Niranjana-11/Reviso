from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from dotenv import load_dotenv
from typing import List
import uvicorn

load_dotenv()

from services.storage        import save_upload, get_upload_path, get_combined_text
from services.pdf_extractor  import extract_text
from services.qa_engine      import answer_from_qp, generate_from_notes
from services.pdf_builder    import build_pdf
from services.pptx_converter import pptx_to_pdf

app = FastAPI(title="Reviso", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("outputs").mkdir(exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_pdf(filename: str) -> bool:
    return filename.lower().endswith(".pdf")

def _is_pptx(filename: str) -> bool:
    return filename.lower().endswith(".pptx")

def _ensure_pdf(kind: str, filename: str, raw_path: str) -> tuple[str, str]:
    if _is_pptx(filename):
        pdf_filename = Path(filename).stem + ".pdf"
        pdf_path     = str(Path("uploads") / f"{kind}_{pdf_filename}")
        pptx_to_pdf(raw_path, pdf_path)
        return pdf_filename, pdf_path
    return filename, raw_path


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "app": "Reviso v2"}


# ── Upload single file (called once per file) ─────────────────────────────────

@app.post("/upload/notes")
async def upload_notes(file: UploadFile = File(...)):
    if not _is_pdf(file.filename) and not _is_pptx(file.filename):
        raise HTTPException(400, "Only PDF or PPTX files accepted.")
    raw_path = await save_upload("notes", file)
    final_name, final_path = _ensure_pdf("notes", file.filename, raw_path)
    text = extract_text(final_path)
    if len(text.strip()) < 50:
        raise HTTPException(422, "Could not extract text. Make sure it is not a scanned image.")
    return {
        "ok": True,
        "filename": final_name,
        "converted": _is_pptx(file.filename),
        "chars": len(text),
    }


@app.post("/upload/qp")
async def upload_qp(file: UploadFile = File(...)):
    if not _is_pdf(file.filename) and not _is_pptx(file.filename):
        raise HTTPException(400, "Only PDF or PPTX files accepted.")
    raw_path = await save_upload("qp", file)
    final_name, final_path = _ensure_pdf("qp", file.filename, raw_path)
    text = extract_text(final_path)
    if len(text.strip()) < 30:
        raise HTTPException(422, "Could not extract text from question paper.")
    return {
        "ok": True,
        "filename": final_name,
        "converted": _is_pptx(file.filename),
    }


# ── Generate: QP mode (multiple QPs answered from combined notes) ─────────────

@app.post("/generate/qp-answers")
async def generate_qp_answers(body: dict):
    notes_files = body.get("notes_files", [])   # list of filenames
    qp_files    = body.get("qp_files",    [])   # list of filenames

    if not notes_files:
        raise HTTPException(400, "At least one notes file is required.")
    if not qp_files:
        raise HTTPException(400, "At least one QP file is required.")

    # Combine ALL notes into one big text
    notes_text = get_combined_text("notes", notes_files, extract_text)
    if not notes_text.strip():
        raise HTTPException(422, "Could not read notes files.")

    # Answer each QP separately, tag with source filename
    all_items = []
    for qp_name in qp_files:
        try:
            qp_path = get_upload_path("qp", qp_name)
            qp_text = extract_text(qp_path)
            items   = await answer_from_qp(qp_text, notes_text, qp_name)
            all_items.extend(items)
        except Exception as e:
            print(f"Warning: failed to process QP {qp_name}: {e}")

    if not all_items:
        raise HTTPException(500, "AI returned no results.")

    return {"mode": "qp", "items": all_items, "total": len(all_items)}


# ── Generate: possible questions from combined notes ──────────────────────────

@app.post("/generate/possible-questions")
async def generate_possible(body: dict):
    notes_files = body.get("notes_files", [])
    difficulty  = body.get("difficulty", "medium")
    marks       = body.get("marks", 3)
    count       = body.get("count", 10)          # ← add this

    if not notes_files:
        raise HTTPException(400, "At least one notes file is required.")
    if difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(400, "difficulty must be easy, medium, or hard.")
    if marks not in (3, 7):
        raise HTTPException(400, "marks must be 3 or 7.")
    if not isinstance(count, int) or not (1 <= count <= 20):
        raise HTTPException(400, "count must be between 1 and 20.")

    notes_text = get_combined_text("notes", notes_files, extract_text)
    if not notes_text.strip():
        raise HTTPException(422, "Could not read notes files.")

    items = await generate_from_notes(notes_text, difficulty, marks, count)
    if not items:
        raise HTTPException(500, "AI returned no questions.")

    return {"mode": "generated", "difficulty": difficulty,
            "marks": marks, "items": items}


# ── Download PDF ──────────────────────────────────────────────────────────────

@app.post("/download/pdf")
async def download_pdf(body: dict):
    items = body.get("items", [])
    title = body.get("title", "Reviso Study Sheet")
    mode  = body.get("mode", "qp")
    if not items:
        raise HTTPException(400, "No items to export.")
    out = Path("outputs") / "reviso_sheet.pdf"
    build_pdf(items, str(out), title, mode)
    return FileResponse(str(out), media_type="application/pdf",
                        filename="reviso_sheet.pdf")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)