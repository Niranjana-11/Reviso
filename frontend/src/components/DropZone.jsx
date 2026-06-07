import { useRef, useState } from "react"

export default function DropZone({
  label, icon, done, busy,
  optional, converted, filename,
  onFile, onRemove
}) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()

  const handle = (file) => { if (file) onFile(file) }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false)
        handle(e.dataTransfer.files[0])
      }}
      style={{
        flex: 1, minWidth: 210,
        border: `2px dashed ${done ? "#2563eb" : drag ? "#2563eb" : "var(--border-main)"}`,
        borderRadius: 14,
        padding: "20px 16px",
        textAlign: "center",
        background: done
          ? "var(--bg-zone-done)"
          : drag ? "var(--bg-zone-drag)" : "var(--bg-zone)",
        transition: "all .18s",
        position: "relative",
      }}
    >
      {/* Hidden file input */}
      <input
        ref={ref}
        type="file"
        accept=".pdf,.pptx"
        style={{ display: "none" }}
        onChange={e => handle(e.target.files[0])}
      />

      {/* Optional badge */}
      {optional && !done && (
        <span style={{
          position: "absolute", top: 8, right: 10,
          fontSize: 10, fontWeight: 700, color: "#60a5fa",
          background: "var(--bg-mode)", padding: "2px 7px",
          borderRadius: 99, letterSpacing: "0.04em",
        }}>
          OPTIONAL
        </span>
      )}

      {/* Icon */}
      <div style={{ fontSize: 28, marginBottom: 6 }}>
        {busy ? "⏳" : done ? "✅" : icon}
      </div>

      {/* Label / filename */}
      <div style={{
        fontWeight: 700, fontSize: 13,
        color: done ? "#2563eb" : "var(--text-heading)",
        marginBottom: 2,
      }}>
        {done ? "Uploaded!" : label}
      </div>

      {/* Show actual filename */}
      {done && filename && (
        <div style={{
          fontSize: 11, color: "var(--text-muted)",
          marginBottom: 4,
          wordBreak: "break-all",
          padding: "0 4px",
        }}>
          📄 {filename}
        </div>
      )}

      {/* PPTX converted notice */}
      {done && converted && (
        <div style={{
          fontSize: 11, color: "#7c3aed",
          fontWeight: 600, marginBottom: 4,
        }}>
          ✨ PPTX → PDF converted
        </div>
      )}

      {/* Hint text */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: done ? 10 : 0 }}>
        {busy ? "Uploading…" : done ? "File ready ✓" : "PDF or PPTX · Drag & drop or click"}
      </div>

      {/* Action buttons when file is uploaded */}
      {done && !busy && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
          {/* Replace button */}
          <button
            onClick={e => { e.stopPropagation(); ref.current.click() }}
            style={{
              fontSize: 11, fontWeight: 700,
              color: "#2563eb",
              background: "var(--bg-card)",
              border: "1px solid var(--border-main)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            🔄 Replace
          </button>

          {/* Delete button */}
          <button
            onClick={e => { e.stopPropagation(); onRemove && onRemove() }}
            style={{
              fontSize: 11, fontWeight: 700,
              color: "#ef4444",
              background: "var(--bg-card)",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            🗑 Delete
          </button>
        </div>
      )}

      {/* Upload zone click area — only when not uploaded */}
      {!done && !busy && (
        <div
          onClick={() => ref.current.click()}
          style={{
            position: "absolute", inset: 0,
            borderRadius: 12,
            cursor: "pointer",
          }}
        />
      )}

      {/* Progress bar */}
      {busy && (
        <div style={{
          marginTop: 10, height: 3,
          background: "var(--border-main)",
          borderRadius: 4, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: "60%",
            borderRadius: 4, background: "#2563eb",
            animation: "shimmer 1s ease-in-out infinite",
          }} />
        </div>
      )}
    </div>
  )
}