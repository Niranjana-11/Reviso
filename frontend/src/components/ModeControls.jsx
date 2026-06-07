const DIFFICULTIES = ["easy", "medium", "hard"]
const MARKS = [3, 7]

const DIFF_COLORS = {
  easy:   { bg: "#dcfce7", color: "#15803d", border: "#16a34a" },
  medium: { bg: "#fef3c7", color: "#b45309", border: "#d97706" },
  hard:   { bg: "#fee2e2", color: "#b91c1c", border: "#ef4444" },
}

export default function ModeControls({
  difficulty, setDifficulty,
  marks, setMarks,
  count, setCount,
  disabled
}) {
  return (
    <div style={{
      background: "var(--bg-mode)",
      borderRadius: 12,
      padding: "16px 18px",
      marginTop: 14,
      border: "1px solid var(--border-main)",
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: "var(--text-heading)",
        marginBottom: 12,
        letterSpacing: "0.04em",
      }}>
        No Question Paper — Don't worry, we can generate questions from your notes! 😊
      </div>

      {/* Difficulty */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: "var(--text-heading)", marginBottom: 6,
        }}>
          Difficulty
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {DIFFICULTIES.map(d => {
            const active = difficulty === d
            const c = DIFF_COLORS[d]
            return (
              <button
                key={d}
                onClick={() => !disabled && setDifficulty(d)}
                style={{
                  padding: "6px 16px", borderRadius: 99,
                  border: `1.5px solid ${active ? c.border : "var(--border-card)"}`,
                  background: active ? c.bg : "transparent",
                  color: active ? c.color : "var(--text-heading)",
                  fontSize: 12, fontWeight: 700,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "all .15s",
                  textTransform: "capitalize",
                }}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>

      {/* Marks */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: "var(--text-heading)", marginBottom: 6,
        }}>
          Marks per question
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {MARKS.map(m => {
            const active = marks === m
            return (
              <button
                key={m}
                onClick={() => !disabled && setMarks(m)}
                style={{
                  padding: "6px 18px", borderRadius: 99,
                  border: `1.5px solid ${active ? "#2563eb" : "var(--border-card)"}`,
                  background: active ? "#2563eb" : "transparent",
                  color: active ? "#fff" : "var(--text-heading)",
                  fontSize: 12, fontWeight: 700,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "all .15s",
                }}
              >
                {m === 7 ? "7–8 marks" : "3 marks"}
              </button>
            )
          })}
        </div>
      </div>

      {/* Question count slider */}
      <div>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: "var(--text-heading)",
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>Number of questions</span>
          <span style={{
            background: "#2563eb",
            color: "#fff",
            borderRadius: 99,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 800,
          }}>
            {count}
          </span>
        </div>

        <input
          type="range"
          min={3}
          max={20}
          step={1}
          value={count}
          disabled={disabled}
          onChange={e => setCount(Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: "#2563eb",
            cursor: disabled ? "not-allowed" : "pointer",
            height: 4,
          }}
        />

        {/* Min/max labels */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 4,
        }}>
          <span>1 min</span>
          <span>20 max</span>
        </div>
      </div>

    </div>
  )
}