const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export async function wakeUpBackend() {
  try {
    await fetch(`${BASE}/`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // ignore
  }
}

async function req(path, opts = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, opts)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `Server error ${res.status}`)
      }
      return res
    } catch (e) {
      const isLastAttempt = attempt === retries
      const isFetchError  =
        e.message === "Failed to fetch" ||
        e.message.includes("fetch") ||
        e.message.includes("network") ||
        e.message.includes("NetworkError")

      if (isFetchError && !isLastAttempt) {
        // Wait then retry
        await new Promise(r => setTimeout(r, 15000))
        continue
      }
      throw e
    }
  }
}

export const uploadNotes = (file) => {
  const f = new FormData()
  f.append("file", file)
  return req("/upload/notes", { method: "POST", body: f })
    .then(r => r.json())
}

export const uploadQP = (file) => {
  const f = new FormData()
  f.append("file", file)
  return req("/upload/qp", { method: "POST", body: f })
    .then(r => r.json())
}

export const generateQPAnswers = (notesFiles, qpFiles) =>
  req("/generate/qp-answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notes_files: notesFiles,
      qp_files:    qpFiles,
    }),
  }).then(r => r.json())

export const generatePossible = (notesFiles, difficulty, marks, count) =>
  req("/generate/possible-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notes_files: notesFiles,
      difficulty,
      marks,
      count,
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