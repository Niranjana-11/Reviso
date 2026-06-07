export default function ErrorBanner({ msg }) {
  if (!msg) return null

  return (
    <div style={{
      background: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: 10,
      padding: "11px 16px",
      color: "#b91c1c",
      fontSize: 13.5,
      marginBottom: 18,
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}>
      <span>⚠️</span>
      <span>{msg}</span>
    </div>
  )
}