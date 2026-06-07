import { useState, useEffect } from "react"
import { getLocalHistory, getOnlineHistory, deleteSession } from "../utils/supabase"

export default function HistoryPopup({ onRestore }) {
  const [open,     setOpen]     = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [tab,      setTab]      = useState("local") // "local" | "online"

  const load = async (source) => {
    setLoading(true)
    setSessions([])
    if (source === "local") {
      setSessions(getLocalHistory())
    } else {
      const online = await getOnlineHistory()
      setSessions(online)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) load(tab)
  }, [open, tab])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    await deleteSession(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  const handleRestore = (session) => {
    onRestore(session)
    setOpen(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="View history"
        style={{
          position: "fixed",
          bottom: 28, right: 28,
          width: 52, height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
          color: "#fff",
          border: "none",
          fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100,
          transition: "transform .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        🕐
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 200,
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* Popup panel */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 90, right: 28,
          width: 380,
          maxHeight: "70vh",
          background: "var(--bg-card)",
          borderRadius: 18,
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border-card)",
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 18px 12px",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-heading)" }}>
              🕐 Session History
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none", border: "none",
                fontSize: 18, cursor: "pointer",
                color: "var(--text-muted)", lineHeight: 1,
              }}
            >✕</button>
          </div>

          {/* Tabs — local vs online */}
          <div style={{
            display: "flex", borderBottom: "1px solid var(--border-card)",
          }}>
            {["local", "online"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "10px",
                  background: "none", border: "none",
                  borderBottom: `2px solid ${tab === t ? "#2563eb" : "transparent"}`,
                  color: tab === t ? "#2563eb" : "var(--text-muted)",
                  fontWeight: tab === t ? 700 : 400,
                  fontSize: 12, cursor: "pointer",
                  transition: "all .15s",
                  textTransform: "capitalize",
                }}
              >
                {t === "local" ? "💾 This Device" : "🌐 Online"}
              </button>
            ))}
          </div>

          {/* Sessions list */}
          <div style={{ overflowY: "auto", flex: 1, padding: "10px 12px" }}>
            {loading && (
              <div style={{ textAlign: "center", color: "var(--text-muted)",
                padding: 32, fontSize: 13 }}>
                Loading…
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)",
                padding: 32, fontSize: 13 }}>
                No sessions yet.<br />Generate some Q&A first!
              </div>
            )}

            {!loading && sessions.map((session, i) => (
              <div key={session.id ?? i}>
                {/* Session card */}
                <div
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    marginBottom: 6,
                    background: expanded === i ? "var(--bg-mode)" : "transparent",
                    border: `1px solid ${expanded === i ? "var(--border-main)" : "var(--border-card)"}`,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      {/* Title */}
                      <div style={{ fontWeight: 700, fontSize: 13,
                        color: "var(--text-heading)", marginBottom: 3 }}>
                        {session.title || "Untitled Session"}
                      </div>

                      {/* Meta row */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <MiniChip>
                          {session.mode === "qp" ? "📝 QP" : "✨ Generated"}
                        </MiniChip>
                        {session.difficulty && (
                          <MiniChip>{session.difficulty}</MiniChip>
                        )}
                        {session.marks && (
                          <MiniChip>{session.marks} marks</MiniChip>
                        )}
                        <MiniChip>
                          {session.items?.length ?? 0} questions
                        </MiniChip>
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                        {new Date(session.date).toLocaleString()}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(session.id ?? i.toString(), e)}
                      style={{
                        background: "none", border: "none",
                        color: "#ef4444", cursor: "pointer",
                        fontSize: 14, padding: "2px 4px",
                        flexShrink: 0,
                      }}
                      title="Delete session"
                    >🗑</button>
                  </div>

                  {/* Expand arrow */}
                  <div style={{ textAlign: "right", fontSize: 10,
                    color: "var(--text-muted)", marginTop: 4 }}>
                    {expanded === i ? "▲ collapse" : "▼ view questions"}
                  </div>
                </div>

                {/* Expanded Q&A list */}
                {expanded === i && (
                  <div style={{
                    marginBottom: 8,
                    padding: "0 4px",
                  }}>
                    {session.items?.map((item, j) => (
                      <div key={j} style={{
                        padding: "10px 12px",
                        marginBottom: 6,
                        borderRadius: 8,
                        background: "var(--bg-zone)",
                        border: "1px solid var(--border-card)",
                        fontSize: 12,
                      }}>
                        <div style={{ fontWeight: 700,
                          color: "var(--text-heading)", marginBottom: 4 }}>
                          Q{j+1}. {item.question}
                        </div>
                        <div style={{
                          color: "var(--text-body)",
                          lineHeight: 1.6,
                          borderLeft: "2px solid #2563eb",
                          paddingLeft: 8,
                        }}>
                          {item.answer}
                        </div>
                      </div>
                    ))}

                    {/* Restore button */}
                    <button
                      onClick={() => handleRestore(session)}
                      style={{
                        width: "100%", marginTop: 6,
                        padding: "8px",
                        background: "#2563eb", color: "#fff",
                        border: "none", borderRadius: 8,
                        fontSize: 12, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ↩ Restore this session
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function MiniChip({ children }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      background: "var(--bg-mode)",
      color: "var(--text-body)",
      padding: "1px 7px", borderRadius: 99,
      border: "1px solid var(--border-card)",
    }}>
      {children}
    </span>
  )
}