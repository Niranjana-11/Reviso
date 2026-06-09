const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export async function wakeUpBackend() {
  try {
    await fetch(`${BASE}/`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    })
  } catch { }
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
        e.message.includes("network")

      if (isFetchError && !isLastAttempt) {
        await new Promise(r => setTimeout(r, 15000))
        continue
      }
      throw e
    }
  }
}

// ── Extract text from PDF in browser ─────────────────────────────────────────
// We send the raw file and let backend extract + generate in ONE request
// This avoids the memory problem entirely

export const uploadAndGenerate = async (
  notesFiles,   // array of File objects
  qpFiles,      // array of File objects  
  difficulty,
  marks,
  count,
) => {
  const form = new FormData()

  notesFiles.forEach(f => form.append("notes_files", f))
  qpFiles.forEach(f   => form.append("qp_files",    f))
  form.append("difficulty", difficulty)
  form.append("marks",      String(marks))
  form.append("count",      String(count))

  const res = await req("/generate/all", { method: "POST", body: form })
  return res.json()
}

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