const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error ${res.status}`)
  }
  return res
}

// Upload one file at a time — called per file
export const uploadNotes = (file) => {
  const f = new FormData()
  f.append("file", file)
  return req("/upload/notes", { method: "POST", body: f }).then(r => r.json())
}

export const uploadQP = (file) => {
  const f = new FormData()
  f.append("file", file)
  return req("/upload/qp", { method: "POST", body: f }).then(r => r.json())
}

// Generate — sends arrays of filenames
export const generateQPAnswers = (notesFiles, qpFiles) =>
  req("/generate/qp-answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes_files: notesFiles, qp_files: qpFiles }),
  }).then(r => r.json())

export const generatePossible = (notesFiles, difficulty, marks, count) =>
  req("/generate/possible-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notes_files: notesFiles,
      difficulty,
      marks,
      count,        // ← add this
    }),
  }).then(r => r.json())

export const downloadPDF = async (items, title, mode) => {
  const res = await req("/download/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, title, mode }),
  })
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = "reviso_sheet.pdf"
  a.click()
  URL.revokeObjectURL(url)
}