"""
qa_engine.py
Two modes:
  A) answer_from_qp   — reads QP questions, answers them using notes text
  B) generate_from_notes — creates possible exam questions from notes
                           filtered by difficulty, marks, and count
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
    """Safely extract a JSON array from model output."""
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


# ── Mode A ────────────────────────────────────────────────────────────────────

async def answer_from_qp(qp_text: str, notes_text: str, qp_name: str = "QP") -> list[dict]:
    """
    Extract every question from the QP and answer each one
    strictly using the provided notes text.
    """
    system = """You are a precise exam answer writer.
Extract every question from the question paper.
Answer each one using ONLY the study notes provided.
If a question cannot be answered from the notes, write: Not covered in the provided notes.
Return ONLY a raw JSON array. No explanation. No markdown.
Each object: { "question": "...", "answer": "...", "marks": <number or null>, "topic": "..." }"""

    user = f"""QUESTION PAPER:
{_trim(qp_text, 2000)}

STUDY NOTES:
{_trim(notes_text, 3000)}

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
            "source":   "qp",
            "qp_file":  qp_name,
        })
    return result


# ── Mode B ────────────────────────────────────────────────────────────────────

async def generate_from_notes(
    notes_text: str,
    difficulty: str,
    marks: int,
    count: int = 5,
) -> list[dict]:
    """
    Generate exactly `count` possible exam questions from notes,
    matching the requested difficulty and mark weightage.
    """
    marks_desc = {
        3: "short answer (3 to 5 sentences, concise, 3 marks each)",
        7: "long answer essay style (detailed with points, 7 to 8 marks each)",
    }[marks]

    diff_desc = {
        "easy":   "straightforward recall and definition questions",
        "medium": "application and explanation questions",
        "hard":   "analysis, comparison, and critical thinking questions",
    }[difficulty]

    system = f"""You are an expert exam question setter.

YOUR MOST IMPORTANT RULE: Generate EXACTLY {count} question(s) — no more, no less.
If the user asks for 1 question, return exactly 1 item in the array.
If they ask for 15, return exactly 15 items. Never decide the count yourself.

Question type: {marks_desc}
Difficulty: {diff_desc}
Base all answers strictly on the provided notes only.

Return ONLY a raw JSON array. No explanation. No markdown. No extra text.
Each object must have:
{{ "question": "...", "answer": "...", "marks": {marks}, "difficulty": "{difficulty}", "topic": "..." }}"""

    user = f"""STUDY NOTES:
{_trim(notes_text, 5000)}

IMPORTANT: Return EXACTLY {count} question(s) in a JSON array.
Difficulty: {difficulty}
Marks per question: {marks}
Return ONLY the JSON array with exactly {count} item(s). Nothing else."""

    raw   = await _call(system, user)
    items = _parse_json(raw)

    result = []
    for i, item in enumerate(items):
        q = str(item.get("question", "")).strip()
        a = str(item.get("answer",   "")).strip()
        if not q or not a:
            continue
        result.append({
            "id":         f"gen{i+1}",
            "question":   q,
            "answer":     a,
            "marks":      marks,
            "difficulty": difficulty,
            "topic":      item.get("topic", ""),
            "source":     "generated",
        })
        # Hard cap — never exceed what user asked for
        if len(result) >= count:
            break

    return result