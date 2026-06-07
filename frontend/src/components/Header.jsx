const STEPS = ["Upload", "Generating", "Results"]

export default function Header({ step, theme, onToggleTheme }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--header-bg)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-card)",
      padding: "0 28px",
    }}>
      <div style={{
        maxWidth: 820, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 58,
      }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18,
          }}>📖</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17,
              color: "var(--text-heading)", lineHeight: 1 }}>
              Reviso
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)",
              letterSpacing: "0.04em" }}>
              STUDY HELPING AI
            </div>
          </div>
        </div>

        {/* Right side — stepper + theme toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {STEPS.map((label, i) => {
              const n      = i + 1
              const done   = step > n
              const active = step === n
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: done ? "#16a34a" : active ? "#2563eb" : "var(--border-card)",
                    color: done || active ? "#fff" : "var(--text-muted)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11, fontWeight: 700, transition: "all .2s",
                  }}>
                    {done ? "✓" : n}
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    color: active ? "#2563eb" : "var(--text-muted)",
                  }}>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span style={{ color: "var(--border-card)", margin: "0 2px" }}>›</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Theme toggle button */}
          <button
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              border: "1.5px solid var(--border-main)",
              background: "var(--bg-card)",
              color: "var(--text-heading)",
              cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              transition: "all .2s",
              flexShrink: 0,
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

        </div>
      </div>
    </header>
  )
}