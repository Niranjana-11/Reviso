"""
qa_engine.py
Two modes:
  A) answer_from_qp   — reads QP questions, answers them using notes text
  B) generate_from_notes — creates possible exam questions from notes
"""

import os
import json
import re
from groq import AsyncGroq

_client = None


def _groq() -> AsyncGroq:
    global _client
    if _client is None:
        key = os.environ.get("GROQ_API_KEY", "")
        if not key:
            raise EnvironmentError("GROQ_API_KEY is not set.")
        _client = AsyncGroq(api_key=key)
    return _client


MODEL     = "llama-3.3-70b-versatile"
MAX_WORDS = 5000


def _trim(text: str, limit: int = MAX_WORDS) -> str:
    return " ".join(text.split()[:limit])


def _parse_json(raw: str) -> list[dict]:
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for v in data.values():
                if isinstance(v, list):
                    return v
    except json.JSONDecodeError:
        pass
    m = re.search(r"\[.*\]", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except Exception:
            pass
    return []


async def _call(system: str, user: str) -> str:
    resp = await _groq().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.3,
        max_tokens=4096,
    )
    return resp.choices[0].message.content


# ── Mode A — Answer QP questions from notes ───────────────────────────────────

async def answer_from_qp(
    qp_text: str,
    notes_text: str,
    qp_name: str = "QP"
) -> list[dict]:
    """
    Extract every question from the QP and answer each one
    using the provided notes. Cites page numbers from notes.
    """
    system = """You are a precise and detailed exam answer writer.

Extract every question from the question paper.
Answer each one using ONLY the study notes provided.

The notes are tagged with page numbers like [PAGE 1], [PAGE 2] etc.
You MUST cite the page number(s) where the answer can be found in the notes.
Add the page reference at the END of each answer in this exact format:
📄 Refer: Page X  (or  📄 Refer: Pages X, Y  if answer spans multiple pages)

CRITICAL ANSWER LENGTH RULES:
- For 3-mark questions: Write 4-6 sentences. Clear and concise.
- For 7 or 8-mark questions: Write a VERY DETAILED answer with:
    * A clear introduction/definition
    * Detailed explanation of all key concepts with examples
    * Comparisons or classifications where relevant
    * A conclusion
    * Minimum 200 words
- If marks are not visible, write a medium length answer (5-8 sentences)
- If a question cannot be answered from the notes, write:
  Not covered in the provided notes.

Return ONLY a raw JSON array. No explanation. No markdown.
Each object must have:
{ "question": "...", "answer": "...", "marks": <number or null>, "topic": "...", "pages": "Page X" }"""

    user = f"""QUESTION PAPER:
{_trim(qp_text, 2000)}

STUDY NOTES (with page numbers):
{_trim(notes_text, 3000)}

For each answer, cite the page number(s) from the notes where this topic appears.
Return ONLY a JSON array."""

    raw   = await _call(system, user)
    items = _parse_json(raw)

    result = []
    for i, item in enumerate(items):
        q = str(item.get("question", "")).strip()
        a = str(item.get("answer",   "")).strip()
        if not q or not a:
            continue
        result.append({
            "id":       f"qp_{qp_name}_{i+1}",
            "question": q,
            "answer":   a,
            "marks":    item.get("marks", None),
            "topic":    item.get("topic", ""),
            "pages":    item.get("pages", ""),
            "source":   "qp",
            "qp_file":  qp_name,
        })
    return result


# ── Mode B — Generate questions per note file ─────────────────────────────────

async def generate_from_notes(
    notes_text: str,
    difficulty: str,
    marks: int,
    count: int = 5,
    note_name: str = "",
) -> list[dict]:
    """
    Generate exactly `count` questions from notes.
    Answers are detailed based on marks weightage.
    """
    if marks == 7:
        marks_desc = (
            "long answer / essay style questions worth 7-8 marks each. "
            "Each answer MUST be very detailed with: "
            "1) A clear definition/introduction "
            "2) Detailed explanation of all concepts "
            "3) Real-world examples "
            "4) Classifications or comparisons where applicable "
            "5) A summary/conclusion. "
            "Minimum 200 words per answer."
        )
    else:
        marks_desc = (
            "short answer questions worth 3 marks each. "
            "Each answer should be 4-6 clear sentences covering the key points."
        )

    diff_desc = {
        "easy":   "straightforward recall and definition questions",
        "medium": "application and explanation questions",
        "hard":   "analysis, comparison, and critical thinking questions",
    }[difficulty]

    note_context = f" from the notes titled '{note_name}'" if note_name else ""

    system = f"""You are an expert exam question setter.

YOUR MOST IMPORTANT RULES:
1. Generate EXACTLY {count} questions{note_context} — no more, no less.
2. Question type: {marks_desc}
3. Difficulty: {diff_desc}
4. Base ALL answers strictly on the provided notes only.
5. For {marks}-mark questions, answers MUST match the length and detail described above.
6. Include the note source name in the topic field.

Return ONLY a raw JSON array. No explanation. No markdown.
Each object: {{ "question": "...", "answer": "...", "marks": {marks}, "difficulty": "{difficulty}", "topic": "...", "note_source": "{note_name}" }}"""

    user = f"""STUDY NOTES{f" ({note_name})" if note_name else ""}:
{_trim(notes_text, 5000)}

Generate EXACTLY {count} questions at {difficulty} level worth {marks} marks each.
Return ONLY a JSON array with exactly {count} items."""

    raw   = await _call(system, user)
    items = _parse_json(raw)

    result = []
    for i, item in enumerate(items):
        q = str(item.get("question", "")).strip()
        a = str(item.get("answer",   "")).strip()
        if not q or not a:
            continue
        result.append({
            "id":          f"gen_{note_name}_{i+1}" if note_name else f"gen{i+1}",
            "question":    q,
            "answer":      a,
            "marks":       marks,
            "difficulty":  difficulty,
            "topic":       item.get("topic", ""),
            "note_source": note_name,
            "source":      "generated",
        })
        if len(result) >= count:
            break

    return result