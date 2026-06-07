import { useState, useCallback } from "react"
import {
  uploadNotes, uploadQP,
  generateQPAnswers, generatePossible,
  downloadPDF,
} from "../utils/api"
import { saveSession } from "../utils/supabase"

export function useReviso() {

  // ── Files ─────────────────────────────────────────────────────────────────
  const [notesFiles, setNotesFiles] = useState([])  // [{ filename, converted }]
  const [qpFiles,    setQpFiles]    = useState([])  // [{ filename, converted }]

  // ── Upload status ─────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState({ notes: false, qp: false })

  // ── Mode B controls ───────────────────────────────────────────────────────
  const [difficulty, setDifficulty] = useState("medium")
  const [marks,      setMarks]      = useState(3)
  const [count,      setCount]      = useState(1)    // number of questions

  // ── Results ───────────────────────────────────────────────────────────────
  const [items,      setItems]      = useState([])
  const [selected,   setSelected]   = useState({})  // { id: bool }
  const [mode,       setMode]       = useState(null) // "qp" | "generated"
  const [generating, setGenerating] = useState(false)
  const [exporting,  setExporting]  = useState(false)

  // ── UI ────────────────────────────────────────────────────────────────────
  const [step,  setStep]  = useState(1)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("Reviso Study Sheet")

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showError  = (msg) => setError(msg)
  const clearError = ()    => setError("")

  // ── Upload multiple notes files ───────────────────────────────────────────
  const handleNotesUpload = useCallback(async (fileArray) => {
    const valid = fileArray.filter(f => {
      const n = f.name.toLowerCase()
      return n.endsWith(".pdf") || n.endsWith(".pptx")
    })
    if (!valid.length) return showError("Only PDF or PPTX files accepted.")

    clearError()
    setUploading(u => ({ ...u, notes: true }))

    for (const file of valid) {
      try {
        const data = await uploadNotes(file)
        // Avoid duplicates
        setNotesFiles(prev => {
          if (prev.find(f => f.filename === data.filename)) return prev
          return [...prev, {
            filename:  data.filename,
            converted: !!data.converted,
          }]
        })
      } catch (e) {
        showError(`Failed to upload ${file.name}: ${e.message}`)
      }
    }

    setUploading(u => ({ ...u, notes: false }))
  }, [])

  // ── Upload multiple QP files ──────────────────────────────────────────────
  const handleQPUpload = useCallback(async (fileArray) => {
    const valid = fileArray.filter(f => {
      const n = f.name.toLowerCase()
      return n.endsWith(".pdf") || n.endsWith(".pptx")
    })
    if (!valid.length) return showError("Only PDF or PPTX files accepted.")

    clearError()
    setUploading(u => ({ ...u, qp: true }))

    for (const file of valid) {
      try {
        const data = await uploadQP(file)
        // Avoid duplicates
        setQpFiles(prev => {
          if (prev.find(f => f.filename === data.filename)) return prev
          return [...prev, {
            filename:  data.filename,
            converted: !!data.converted,
          }]
        })
      } catch (e) {
        showError(`Failed to upload ${file.name}: ${e.message}`)
      }
    }

    setUploading(u => ({ ...u, qp: false }))
  }, [])

  // ── Remove individual files ───────────────────────────────────────────────
  const removeNotesFile = useCallback((filename) => {
    setNotesFiles(prev => prev.filter(f => f.filename !== filename))
  }, [])

  const removeQPFile = useCallback((filename) => {
    setQpFiles(prev => prev.filter(f => f.filename !== filename))
  }, [])

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!notesFiles.length) {
      return showError("Please upload at least one notes file.")
    }
    clearError()
    setGenerating(true)
    setStep(2)
    setItems([])
    setSelected({})

    try {
      const notesNames = notesFiles.map(f => f.filename)
      const qpNames    = qpFiles.map(f => f.filename)
      let data

      if (qpNames.length > 0) {
        // Mode A — answer QP questions from notes
        data = await generateQPAnswers(notesNames, qpNames)
        setMode("qp")
      } else {
        // Mode B — generate possible questions
        data = await generatePossible(notesNames, difficulty, marks, count)
        setMode("generated")
      }

      // Set results
      setItems(data.items)

      // Pre-select all questions
      const sel = {}
      data.items.forEach(q => (sel[q.id] = true))
      setSelected(sel)
      setStep(3)

      // Save to history
      await saveSession({
        id:         Date.now().toString(),
        title:      title || "Reviso Session",
        date:       new Date().toISOString(),
        mode:       qpNames.length > 0 ? "qp" : "generated",
        difficulty: qpNames.length > 0 ? null : difficulty,
        marks:      qpNames.length > 0 ? null : marks,
        items:      data.items,
      })

    } catch (e) {
      showError(e.message)
      setStep(1)
    }

    setGenerating(false)
  }, [notesFiles, qpFiles, difficulty, marks, count, title])

  // ── Toggle single question ────────────────────────────────────────────────
  const toggle = useCallback((id) => {
    setSelected(s => ({ ...s, [id]: !s[id] }))
  }, [])

  // ── Select / deselect all ─────────────────────────────────────────────────
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCount = Object.values(selected).filter(Boolean).length

  // ── Return everything components need ─────────────────────────────────────
  return {
    // Files
    notesFiles, qpFiles,
    uploading,

    // Mode B controls
    difficulty, setDifficulty,
    marks,      setMarks,
    count,      setCount,

    // Results
    items,      selected,
    mode,       generating,
    exporting,  selectedCount,

    // UI
    step,  error,
    title, setTitle,

    // Actions
    handleNotesUpload, handleQPUpload,
    removeNotesFile,   removeQPFile,
    handleGenerate,
    toggle,    selectAll,
    handleExport,

    // For history restore
    setItems, setMode, setTitle, setSelected, setStep,
  }
}