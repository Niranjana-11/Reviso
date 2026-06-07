import { useState, useEffect } from "react"

export function useTheme() {
  // Check system preference first, then localStorage override
  const getInitial = () => {
    const saved = localStorage.getItem("reviso-theme")
    if (saved) return saved
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }

  const [theme, setTheme] = useState(getInitial)

  useEffect(() => {
    // Apply theme to the HTML element
    document.documentElement.setAttribute("data-theme", theme)
    // Remember the user's choice
    localStorage.setItem("reviso-theme", theme)
  }, [theme])

  // Also listen for system preference changes
  useEffect(() => {
    const saved = localStorage.getItem("reviso-theme")
    if (saved) return // user has manually chosen — don't override

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e) => setTheme(e.matches ? "dark" : "light")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark")

  return { theme, toggle }
}