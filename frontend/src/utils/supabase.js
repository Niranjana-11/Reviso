import { createClient } from "@supabase/supabase-js"

// Replace these with your actual values from Supabase dashboard
const SUPABASE_URL = "https://cbqnxkxjcgrycoxtvxcu.supabase.co"
const SUPABASE_KEY = "sb_publishable_jD_3y-LF2KXjmum2jiqfzQ_B1uGxopC"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Save a session ────────────────────────────────────────────────────────────
export async function saveSession(session) {
  // Always save to localStorage first (instant, offline)
  const local = getLocalHistory()
  local.unshift(session)                        // add to front
  const trimmed = local.slice(0, 50)            // keep max 50
  localStorage.setItem("reviso-history", JSON.stringify(trimmed))

  // Then try to save to Supabase (online backup)
  try {
    await supabase.from("sessions").insert({
      title:      session.title,
      mode:       session.mode,
      difficulty: session.difficulty ?? null,
      marks:      session.marks ?? null,
      items:      session.items,
    })
  } catch (e) {
    console.warn("Supabase save failed (offline?):", e.message)
    // Not critical — localStorage already saved it
  }
}

// ── Get local history ─────────────────────────────────────────────────────────
export function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem("reviso-history") ?? "[]")
  } catch {
    return []
  }
}

// ── Get online history ────────────────────────────────────────────────────────
export async function getOnlineHistory() {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) throw error
    return data.map(row => ({
      id:         row.id,
      title:      row.title,
      date:       row.created_at,
      mode:       row.mode,
      difficulty: row.difficulty,
      marks:      row.marks,
      items:      row.items,
    }))
  } catch (e) {
    console.warn("Supabase fetch failed:", e.message)
    return []
  }
}

// ── Delete a session ──────────────────────────────────────────────────────────
export async function deleteSession(id) {
  // Remove from localStorage
  const local = getLocalHistory().filter(s => s.id !== id)
  localStorage.setItem("reviso-history", JSON.stringify(local))

  // Remove from Supabase
  try {
    await supabase.from("sessions").delete().eq("id", id)
  } catch (e) {
    console.warn("Supabase delete failed:", e.message)
  }
}