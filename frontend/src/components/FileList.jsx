import { useRef } from "react"

// One file card with delete button
function FileCard({ filename, converted, onRemove }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      background: "var(--bg-zone)",
      border: "1px solid var(--border-main)",
      borderRadius: 10,
      marginBottom: 6,
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: "var(--text-heading)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {filename}
          </div>
          {converted && (
            <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>
              ✨ PPTX → PDF
            </div>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onRemove(filename)}
        style={{
          background: "none",
          border: "1px solid #fca5a5",
          borderRadius: 6,
          color: "#ef4444",
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 8px",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        🗑 Remove
      </button>
    </div>
  )
}


// Full multi-file upload zone
export default function FileList({
  label, icon, optional,
  files,           // array of { filename, converted }
  busy,
  onFiles,         // called with array of File objects
  onRemove,        // called with filename string
}) {
  const ref = useRef()

  const handle = (fileList) => {
    if (fileList?.length) onFiles(Array.from(fileList))
  }

  const hasFiles = files.length > 0

  return (
    <div style={{ flex: 1, minWidth: 210 }}>

      {/* Drop zone */}
      <div
        onClick={() => ref.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files) }}
        style={{
          border: `2px dashed ${hasFiles ? "#2563eb" : "var(--border-main)"}`,
          borderRadius: 14,
          padding: "18px 16px",
          textAlign: "center",
          background: hasFiles ? "var(--bg-zone-done)" : "var(--bg-zone)",
          cursor: busy ? "not-allowed" : "pointer",
          transition: "all .18s",
          position: "relative",
          marginBottom: hasFiles ? 10 : 0,
        }}
      >
        {/* Hidden file input — multiple! */}
        <input
          ref={ref}
          type="file"
          accept=".pdf,.pptx"
          multiple
          style={{ display: "none" }}
          onChange={e => handle(e.target.files)}
        />

        {/* Optional badge */}
        {optional && (
          <span style={{
            position: "absolute", top: 8, right: 10,
            fontSize: 10, fontWeight: 700, color: "#60a5fa",
            background: "var(--bg-mode)", padding: "2px 7px",
            borderRadius: 99,
          }}>
            OPTIONAL
          </span>
        )}

        <div style={{ fontSize: 26, marginBottom: 5 }}>
          {busy ? "⏳" : icon}
        </div>

        <div style={{
          fontWeight: 700, fontSize: 13,
          color: "var(--text-heading)", marginBottom: 2,
        }}>
          {hasFiles ? `${files.length} file${files.length > 1 ? "s" : ""} added` : label}
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {busy
            ? "Uploading…"
            : "PDF or PPTX · Click or drag — multiple files OK"}
        </div>

        {/* Progress bar */}
        {busy && (
          <div style={{
            marginTop: 8, height: 3,
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

      {/* File cards list */}
      {hasFiles && (
        <div>
          {files.map(f => (
            <FileCard
              key={f.filename}
              filename={f.filename}
              converted={f.converted}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}