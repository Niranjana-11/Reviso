import { useState, useCallback, useEffect } from "react"
import { uploadAndGenerate, downloadPDF, wakeUpBackend } from "../utils/api"
import { saveSession } from "../utils/supabase"

export function useReviso() {

  // ── Raw File objects (not yet uploaded) ───────────────────────────────────
  const [notesFileObjs, setNotesFileObjs] = useState([]) // File[]
  const [qpFileObjs,    setQpFileObjs]    = useState([]) // File[]

  // ── Display info ──────────────────────────────────────────────────────────
  const [notesFiles, setNotesFiles] = useState([]) // [{filename, converted}]
  const [qpFiles,    setQpFiles]    = useState([]) // [{filename, converted}]

  // ── Mode B controls ───────────────────────────────────────────────────────
  const [difficulty, setDifficulty] = useState("medium")
  const [marks,      setMarks]      = useState(3)
  const [count,      setCount]      = useState(1)

  // ── Results ───────────────────────────────────────────────────────────────
  const [items,      setItems]      = useState([])
  const [selected,   setSelected]   = useState({})
  const [mode,       setMode]       = useState(null)
  const [generating, setGenerating] = useState(false)
  const [exporting,  setExporting]  = useState(false)

  // ── UI ────────────────────────────────────────────────────────────────────
  const [step,  setStep]  = useState(1)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("Reviso Study Sheet")

  // ── Wake up Render on load ────────────────────────────────────────────────
  useEffect(() => { wakeUpBackend() }, [])

  const showError  = (msg) => setError(msg)
  const clearError = ()    => setError("")

  // ── Add notes files (no upload yet) ──────────────────────────────────────
  const handleNotesUpload = useCallback((fileArray) => {
    const valid = fileArray.filter(f => {
      const n = f.name.toLowerCase()
      return n.endsWith(".pdf") || n.endsWith(".pptx")
    })
    if (!valid.length) return showError("Only PDF or PPTX files accepted.")
    clearError()

    setNotesFileObjs(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
    setNotesFiles(prev => {
      const names = new Set(prev.map(f => f.filename))
      const newOnes = valid
        .filter(f => !names.has(f.name))
        .map(f => ({
          filename:  f.name,
          converted: f.name.toLowerCase().endsWith(".pptx"),
        }))
      return [...prev, ...newOnes]
    })
  }, [])

  // ── Add QP files (no upload yet) ─────────────────────────────────────────
  const handleQPUpload = useCallback((fileArray) => {
    const valid = fileArray.filter(f => {
      const n = f.name.toLowerCase()
      return n.endsWith(".pdf") || n.endsWith(".pptx")
    })
    if (!valid.length) return showError("Only PDF or PPTX files accepted.")
    clearError()

    setQpFileObjs(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
    setQpFiles(prev => {
      const names = new Set(prev.map(f => f.filename))
      const newOnes = valid
        .filter(f => !names.has(f.name))
        .map(f => ({
          filename:  f.name,
          converted: f.name.toLowerCase().endsWith(".pptx"),
        }))
      return [...prev, ...newOnes]
    })
  }, [])

  // ── Remove files ──────────────────────────────────────────────────────────
  const removeNotesFile = useCallback((filename) => {
    setNotesFileObjs(prev => prev.filter(f => f.name !== filename))
    setNotesFiles(prev    => prev.filter(f => f.filename !== filename))
  }, [])

  const removeQPFile = useCallback((filename) => {
    setQpFileObjs(prev => prev.filter(f => f.name !== filename))
    setQpFiles(prev    => prev.filter(f => f.filename !== filename))
  }, [])

  // ── Reset to upload new files after generating ────────────────────────────
const resetForNewUpload = useCallback(() => {
    setNotesFileObjs([])
    setQpFileObjs([])
    setNotesFiles([])
    setQpFiles([])
    setItems([])
    setSelected({})
    setMode(null)
    setStep(1)
    clearError()
  }, [])

  // ── Generate — uploads + generates in ONE request ─────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!notesFileObjs.length) {
      return showError("Please add at least one notes file.")
    }
    clearError()
    setGenerating(true)
    setStep(2)
    setItems([])
    setSelected({})

    try {
      const data = await uploadAndGenerate(
        notesFileObjs,
        qpFileObjs,
        difficulty,
        marks,
        count,
      )

      setMode(data.mode)
      setItems(data.items)

      const sel = {}
      data.items.forEach(q => (sel[q.id] = true))
      setSelected(sel)
      setStep(3)

      // Save to history
      await saveSession({
        id:         Date.now().toString(),
        title:      title || "Reviso Session",
        date:       new Date().toISOString(),
        mode:       data.mode,
        difficulty: data.mode === "qp" ? null : difficulty,
        marks:      data.mode === "qp" ? null : marks,
        items:      data.items,
      })

    } catch (e) {
      if (e.message.includes("fetch")) {
        showError("Server is waking up ☕ — please wait 30 seconds and try again!")
      } else {
        showError(e.message)
      }
      setStep(1)
    }

    setGenerating(false)
  }, [notesFileObjs, qpFileObjs, difficulty, marks, count, title])

  // ── Toggle / select ───────────────────────────────────────────────────────
  const toggle = useCallback((id) => {
    setSelected(s => ({ ...s, [id]: !s[id] }))
  }, [])

  const selectAll = useCallback((ids, val) => {
    setSelected(s => {
      const next = { ...s }
      ids.forEach(id => (next[id] = val))
      return next
    })
  }, [])

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const chosen = items.filter(q => selected[q.id])
    if (!chosen.length) return showError("Select at least one question.")
    clearError()
    setExporting(true)
    try {
      await downloadPDF(chosen, title, mode)
    } catch (e) {
      showError(e.message)
    }
    setExporting(false)
  }, [items, selected, title, mode])

  const selectedCount = Object.values(selected).filter(Boolean).length

  return {
    // Files for display
    notesFiles, qpFiles,
    uploading: { notes: false, qp: false }, // no separate upload step

    // Controls
    difficulty, setDifficulty,
    marks,      setMarks,
    count,      setCount,

    // Results
    items, selected, mode,
    generating, exporting, selectedCount,

    // UI
    step, error, title, setTitle,

    // Actions
    handleNotesUpload, handleQPUpload,
    removeNotesFile,   removeQPFile,
    handleGenerate, toggle, selectAll, handleExport,

    // History restore
    setItems, setMode, setTitle, setSelected, setStep,resetForNewUpload,
  }
}