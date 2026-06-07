import { useReviso }    from "./hooks/useReviso"
import { useTheme }     from "./hooks/useTheme"
import Header           from "./components/Header"
import DropZone         from "./components/DropZone"
import ModeControls     from "./components/ModeControls"
import QuestionCard     from "./components/QuestionCard"
import ErrorBanner      from "./components/ErrorBanner"
import HistoryPopup     from "./components/HistoryPopup"
import FileList from "./components/FileList"

const SPINNER = (
  <span style={{
    width: 15, height: 15,
    display: "inline-block",
    border: "2px solid #ffffff50",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin .75s linear infinite",
  }} />
)

function SectionLabel({ n, active, done, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
      <span style={{
        width: 25, height: 25,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, flexShrink: 0,
        background: done ? "#16a34a" : active ? "#2563eb" : "var(--border-card)",
        color: done || active ? "#fff" : "var(--text-muted)",
        transition: "background .2s",
      }}>
        {done ? "✓" : n}
      </span>
      <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-heading)" }}>
        {title}
      </span>
    </div>
  )
}

export default function App() {
  const R = useReviso()
  const { theme, toggle } = useTheme()
  const allIds = R.items.map(q => q.id)

  // Restore a session from history
  const handleRestore = (session) => {
    R.setItems(session.items)
    R.setMode(session.mode)
    R.setTitle(session.title)
    const sel = {}
    session.items.forEach(q => (sel[q.id] = true))
    R.setSelected(sel)
    R.setStep(3)
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        .card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 1px 10px var(--shadow-card);
          margin-bottom: 18px;
        }
        .btn {
          border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; padding: 11px 24px;
          transition: all .18s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-blue { background: #2563eb; color: #fff; }
        .btn-blue:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
        }
        .btn-blue:disabled { opacity: .55; cursor: not-allowed; }
        .btn-ghost {
          background: transparent; color: #2563eb;
          border: 1.5px solid #2563eb;
          padding: 7px 15px; font-size: 12px; border-radius: 8px;
        }
        .btn-ghost:hover { background: var(--bg-mode); }
      `}</style>

      <Header step={R.step} theme={theme} onToggleTheme={toggle} />

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "26px 18px" }}>
        <ErrorBanner msg={R.error} />

        {/* ── STEP 1: Upload ─────────────────────────────────────────── */}
        <div className="card">
          <SectionLabel
            n={1} active={R.step >= 1} done={R.step > 1}
            title="Upload your files"
          />
          <p style={{
            fontSize: 13, color: "var(--text-body)",
            marginBottom: 16, marginTop: 4,
          }}>
            Your <strong>study notes</strong> are required. Upload a{" "}
            <strong>question paper</strong> if you have one — otherwise Reviso
            will generate possible exam questions for you.
            Accepts <strong>PDF</strong> and <strong>PPTX</strong>.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <FileList
              label="Study Notes PDF / PPTX"
              icon="📓"
              files={R.notesFiles}
              busy={R.uploading.notes}
              onFiles={R.handleNotesUpload}
              onRemove={R.removeNotesFile}
            />
            <FileList
              label="Question Paper PDF / PPTX"
              icon="📝"
              optional={true}
              files={R.qpFiles}
              busy={R.uploading.qp}
              onFiles={R.handleQPUpload}
              onRemove={R.removeQPFile}
  />
</div>

          {/* Mode controls — only when no QP uploaded */}
            {!R.qpFiles.length && (
              <ModeControls
                difficulty={R.difficulty}
                setDifficulty={R.setDifficulty}
                marks={R.marks}
                setMarks={R.setMarks}
                count={R.count}
                setCount={R.setCount}
                disabled={!R.notesFiles.length || R.generating}
              />
            )}

            {/* Mode indicator */}
            {R.notesFiles.length > 0 && (
              <div style={{
                marginTop: 14, padding: "10px 14px",
                borderRadius: 10,
                background: R.qpFiles.length ? "var(--bg-zone-done)" : "var(--bg-mode)",
                border: `1px solid ${R.qpFiles.length ? "var(--border-main)" : "#bbf7d0"}`,
                fontSize: 12.5,
                color: R.qpFiles.length ? "#2563eb" : "#15803d",
                fontWeight: 600,
              }}>
                {R.qpFiles.length
                  ? `📝 Mode: Reviso will answer ${R.qpFiles.length} QP${R.qpFiles.length > 1 ? "s" : ""} using ${R.notesFiles.length} notes file${R.notesFiles.length > 1 ? "s" : ""}.`
                  : `✨ Mode: Reviso will generate ${R.marks === 7 ? "7–8 mark" : "3 mark"} ${R.difficulty} questions from ${R.notesFiles.length} notes file${R.notesFiles.length > 1 ? "s" : ""}.`}
              </div>
            )}
        </div>

        {/* ── STEP 2: Generate ───────────────────────────────────────── */}
        <div className="card">
          <SectionLabel
            n={2} active={R.step >= 2} done={R.step > 2}
            title="Generate"
          />
          <p style={{
            fontSize: 13, color: "var(--text-body)",
            marginBottom: 16, marginTop: 4,
          }}>
              Click the generate button and let Reviso work its magic!💫 It will read your notes, understand the content, and then either answer the questions from your uploaded paper or create new questions based on the mode you selected. This may take a minute, so grab a cup of tea! ☕  
          </p>
          <button
            className="btn btn-blue"
            disabled={!R.notesFiles.length || R.generating}
            onClick={R.handleGenerate}
          >
            {R.generating
              ? <>{SPINNER} Generating…</>
              : "✨ Generate"}
          </button>
        </div>

        {/* ── STEP 3: Results ────────────────────────────────────────── */}
        {R.items.length > 0 && (
          <div className="card">

            {/* Header row */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap", gap: 10, marginBottom: 14,
            }}>
              <SectionLabel
                n={3} active={true} done={true}
                title={`Results · ${R.selectedCount}/${R.items.length} selected`}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => R.selectAll(allIds, true)}
                >
                  Select all
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => R.selectAll(allIds, false)}
                >
                  None
                </button>
              </div>
            </div>

            {/* Mode badge */}
            <div style={{
              display: "inline-block", marginBottom: 14,
              padding: "4px 12px", borderRadius: 99,
              background: R.mode === "qp"
                ? "var(--bg-zone-done)"
                : "var(--bg-mode)",
              color: R.mode === "qp" ? "#2563eb" : "#15803d",
              fontSize: 12, fontWeight: 700,
            }}>
              {R.mode === "qp"
                ? "📝 QP answers from your notes"
                : `✨ AI-generated · ${R.difficulty} · ${R.marks === 7 ? "7–8" : "3"} marks`}
            </div>

            {/* Question cards */}
            <div style={{
              display: "flex", flexDirection: "column",
              gap: 10, marginBottom: 20,
            }}>
              {R.items.map((item, i) => (
                <QuestionCard
                  key={item.id}
                  item={item}
                  index={i}
                  checked={!!R.selected[item.id]}
                  onToggle={() => R.toggle(item.id)}
                />
              ))}
            </div>

            {/* Export bar */}
            <div style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 16,
              display: "flex", gap: 12,
              alignItems: "center", flexWrap: "wrap",
            }}>
              <input
                type="text"
                value={R.title}
                onChange={e => R.setTitle(e.target.value)}
                placeholder="PDF title…"
                style={{
                  flex: 1, minWidth: 180,
                  padding: "10px 14px",
                  border: "1.5px solid var(--border-main)",
                  borderRadius: 10, fontSize: 14,
                  color: "var(--text-input)",
                  fontFamily: "inherit",
                  outline: "none",
                  background: "var(--bg-input)",
                }}
              />
              <button
                className="btn btn-blue"
                disabled={R.exporting || !R.selectedCount}
                onClick={R.handleExport}
              >
                {R.exporting
                  ? <>{SPINNER} Building PDF…</>
                  : `📄 Download PDF (${R.selectedCount})`}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating history popup */}
      <HistoryPopup onRestore={handleRestore} />
    </div>
  )
}