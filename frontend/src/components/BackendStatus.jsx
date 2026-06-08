import { useState, useEffect } from "react"

const BACKEND = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export default function BackendStatus() {
  const [status, setStatus] = useState("checking") // checking | awake | sleeping

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10 // try for up to 50 seconds

    const ping = async () => {
      try {
        const res = await fetch(`${BACKEND}/`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          setStatus("awake")
          return
        }
      } catch {
        // still sleeping
      }

      attempts++
      if (attempts < maxAttempts) {
        setStatus("sleeping")
        setTimeout(ping, 5000)
      } else {
        setStatus("sleeping")
      }
    }

    ping()
  }, [])

  // Hide banner completely when server is awake
  if (status === "awake") return null

  return (
    <div style={{
      background: status === "checking"
        ? "linear-gradient(90deg, #1e3a5f, #2563eb)"
        : "linear-gradient(90deg, #92400e, #b45309)",
      color: "#fff",
      textAlign: "center",
      padding: "12px 16px",
      fontSize: 13,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    }}>
      {/* Spinning loader */}
      <span style={{
        width: 14, height: 14,
        display: "inline-block",
        border: "2px solid #ffffff50",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin .75s linear infinite",
        flexShrink: 0,
      }} />

      <span>
        {status === "checking"
          ? "☕ Waking up the AI server — takes ~30 seconds on first load. Please wait..."
          : "⏳ Still waking up... please wait a moment before uploading."}
      </span>

      {/* Animated dots */}
      <span style={{ letterSpacing: 2, opacity: 0.7 }}>
        {status === "checking" ? "●●○" : "●○○"}
      </span>
    </div>
  )
}