import { useState, useEffect } from "react"

const BACKEND = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export default function BackendStatus({ onReady }) {
  const [status,    setStatus]    = useState("checking")
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    let attempts   = 0
    let countTimer = null
    const maxAttempts = 12

    const startCountdown = () => {
      setCountdown(30)
      countTimer = setInterval(() => {
        setCountdown(c => c > 0 ? c - 1 : 0)
      }, 1000)
    }

    const ping = async () => {
      try {
        const res = await fetch(`${BACKEND}/`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          clearInterval(countTimer)
          setStatus("awake")
          if (onReady) onReady()
          return
        }
      } catch {
        // still sleeping
      }

      attempts++
      if (attempts < maxAttempts) {
        setStatus("sleeping")
        startCountdown()
        setTimeout(ping, 5000)
      }
    }

    ping()
    return () => clearInterval(countTimer)
  }, [])

  if (status === "awake") return null

  return (
    <div style={{
      background: status === "checking"
        ? "linear-gradient(90deg, #1e3a5f, #2563eb)"
        : "linear-gradient(90deg, #92400e, #b45309)",
      color: "#fff",
      padding: "14px 20px",
      fontSize: 13,
      fontWeight: 600,
    }}>
      <div style={{
        maxWidth: 820,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Spinner */}
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
              ? "☕ Waking up AI server — please wait before uploading..."
              : "⏳ Server is waking up — please wait before uploading..."}
          </span>
        </div>

        {/* Countdown badge */}
        {status === "sleeping" && (
          <div style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: 99,
            padding: "4px 14px",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.02em",
          }}>
            Ready in ~{countdown}s
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        maxWidth: 820,
        margin: "8px auto 0",
        height: 3,
        background: "rgba(255,255,255,0.2)",
        borderRadius: 4,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          borderRadius: 4,
          background: "#fff",
          width: `${((30 - countdown) / 30) * 100}%`,
          transition: "width 1s linear",
        }} />
      </div>
    </div>
  )
}