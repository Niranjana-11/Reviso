const DIFF_CHIP = {
  easy:   { bg: "#dcfce7", color: "#15803d" },
  medium: { bg: "#fef3c7", color: "#b45309" },
  hard:   { bg: "#fee2e2", color: "#b91c1c" },
}

function Chip({ bg, color, children }) {
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color,
      padding: "2px 9px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

export default function QuestionCard({ item, index, checked, onToggle }) {
  const diff = DIFF_CHIP[item.difficulty] ?? DIFF_CHIP.medium

  return (
    <div
      onClick={onToggle}
      style={{
        border: `1.5px solid ${checked ? "var(--border-main)" : "var(--border-card)"}`,
        borderRadius: 12,
        padding: "14px 16px",
        background: checked ? "var(--bg-zone-done)" : "var(--bg-card)",
        cursor: "pointer",
        transition: "border-color .15s, background .15s",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          style={{
            marginTop: 3,
            width: 16, height: 16,
            accentColor: "#2563eb",
            flexShrink: 0,
            cursor: "pointer",
          }}
        />

        <div style={{ flex: 1 }}>
          {/* Tags row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
            {item.source === "qp" && (
              <Chip bg="#dbeafe" color="#1d4ed8">📝 From QP</Chip>
            )}
            {item.source === "generated" && (
              <Chip bg="#f0f9ff" color="#0369a1">✨ AI Generated</Chip>
            )}
            {item.note_source && item.source === "generated" && (
              <Chip bg="#fef3c7" color="#92400e">📋 {item.note_source}</Chip>
            )}
            {item.difficulty && (
              <Chip bg={diff.bg} color={diff.color}>{item.difficulty}</Chip>
            )}
            {item.marks && (
              <Chip bg="#f1f5f9" color="#334155">{item.marks} marks</Chip>
            )}
            {item.topic && (
              <Chip bg="#f5f3ff" color="#6d28d9">📌 {item.topic}</Chip>
            )}
            
          </div>

          {/* Question text */}
          <div style={{
            fontWeight: 700,
            fontSize: 13.5,
            color: "var(--text-heading)",
            lineHeight: 1.6,
            marginBottom: 9,
          }}>
            Q{index + 1}. {item.question}
          </div>

          
          {/* Answer text */}
            <div style={{
              fontSize: 12.5,
              color: "var(--text-body)",
              lineHeight: 1.7,
              background: "var(--ans-bg)",
              borderRadius: 8,
              padding: "9px 12px",
              borderLeft: "3px solid #2563eb",
            }}>
              <strong style={{ color: "var(--text-heading)" }}>Answer: </strong>
              {item.answer}

              {/* Page reference — only shown for QP answers */}
              {item.pages && item.source === "qp" && (
                <div style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px dashed var(--border-card)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span style={{
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    padding: "3px 10px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    📄 {item.pages}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}>
                    in your notes
                  </span>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}