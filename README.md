<div align="center">

# 📖 Reviso
### Upload Notes. Get Answers.

**Reviso is a free AI-powered study tool that reads your notes and either answers your question paper or generates possible exam questions — then exports everything as a clean PDF with page references.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://reviso-smoky.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge&logo=render)](https://reviso-backend-y07n.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Niranjana--11-181717?style=for-the-badge&logo=github)](https://github.com/Niranjana-11/Reviso)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

![Reviso Screenshot](Reviso.png)

## 🎥 Demo Video
🔗 [Watch Demo Video](https://drive.google.com/file/d/1ZKRgtRx8uVe7VRdv4uRTEXFSyyd-MuhM/view?usp=sharing)




</div>

---

## ✨ Features

- 📓 **Upload multiple notes** — PDF or PPTX files, all processed together
- 📝 **Upload question papers** — AI answers every question using your notes
- 📄 **Page number references** — QP answers show exactly which page in your notes to refer to
- ✨ **Generate possible questions** — when no QP, AI creates exam questions per notes file
- 📋 **Per-note tagging** — each question tagged with which notes file it came from
- 🎚️ **Full control** — choose difficulty, marks (3 or 7-8), and question count (1-20)
- 📊 **Smart answers** — 3-mark: concise 4-6 sentences · 7-8 mark: detailed 200+ word structured answers
- 📄 **Download PDF** — beautifully formatted blue academic study sheet
- 🌙 **Dark / Light mode** — follows system preference, remembers your choice
- 💾 **Session history** — saved locally and online via Supabase
- ✨ **PPTX auto-conversion** — PowerPoint slides converted to PDF automatically
- 🔄 **Multi-file upload** — add, replace, or remove individual files
- ➕ **New upload without refresh** — generate new Q&A without refreshing the page
- ☕ **Smart wake-up** — auto-detects server sleep and retries with countdown timer

---

## 🚀 How it works

```
WITH Question Paper:
  notes.pdf + qp.pdf
        ↓
  AI reads notes WITH page number tags [PAGE 1], [PAGE 2]...
        ↓
  Answers every QP question using ONLY your notes
  3-mark → concise · 7-mark → detailed 200+ words
  Each answer shows: 📄 Page 3 in your notes
        ↓
  Download PDF with page references ✅

WITHOUT Question Paper:
  notes1.pdf + notes2.pdf + difficulty + marks + count
        ↓
  AI generates questions from EACH notes file separately
  Questions tagged: 📋 Notes File Name
        ↓
  Download PDF ✅
```

---

## 🛠️ Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| AI Model | Groq + Llama 3.3 70B Versatile | Free |
| Backend | FastAPI + Uvicorn | Free |
| PDF Reading | pdfplumber (with page tracking) | Free |
| PDF Creation | ReportLab | Free |
| PPTX Conversion | python-pptx + Pillow | Free |
| Frontend | React + Vite | Free |
| Database | Supabase (PostgreSQL) | Free |
| Backend Hosting | Render | Free |
| Frontend Hosting | Vercel | Free |
| Keep-Alive | GitHub Actions (ping every 5 min) | Free |
| Code Hosting | GitHub | Free |
| **Total Cost** | | **$0** 🎉 |

---

## 📁 Project Structure

```
Reviso/
├── .github/
│   └── workflows/
│       └── keepalive.yml           # Pings Render every 5 min
├── backend/
│   ├── main.py                     # FastAPI — unified upload+generate endpoint
│   ├── requirements.txt            # Pinned Python dependencies
│   └── services/
│       ├── pdf_extractor.py        # extract_text() + extract_text_with_pages()
│       ├── qa_engine.py            # Groq AI — QP answers + question generation
│       ├── pdf_builder.py          # ReportLab PDF with page references
│       └── pptx_converter.py       # PPTX → PDF with special char handling
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # 3-step wizard UI
│   │   ├── hooks/
│   │   │   ├── useReviso.js        # All state + resetForNewUpload
│   │   │   └── useTheme.js         # Dark/light + localStorage
│   │   ├── components/
│   │   │   ├── Header.jsx          # Sticky header + stepper + theme toggle
│   │   │   ├── FileList.jsx        # Multi-file upload with per-file cards
│   │   │   ├── ModeControls.jsx    # Difficulty + marks + count slider
│   │   │   ├── QuestionCard.jsx    # Q&A card + note tag + 📄 page reference
│   │   │   ├── HistoryPopup.jsx    # Floating history button + popup
│   │   │   ├── BackendStatus.jsx   # Wake-up banner with countdown + progress bar
│   │   │   └── ErrorBanner.jsx     # Error display
│   │   └── utils/
│   │       ├── api.js              # Fetch wrapper with auto-retry (3 attempts)
│   │       └── supabase.js         # History save/load — local + Supabase
│   ├── index.html
│   ├── vercel.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🏃 Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free [Groq API key](https://console.groq.com)
- Free [Supabase](https://supabase.com) project

### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable
echo "GROQ_API_KEY=your_key_here" > .env

# Run server
python main.py
# → http://localhost:8000
# → http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## ☁️ Deploy (Free)

### Step 1 — Get Free API Keys

| Service | URL | What for |
|---------|-----|----------|
| Groq | [console.groq.com](https://console.groq.com) | AI model (free 14k req/day) |
| Supabase | [supabase.com](https://supabase.com) | Session history database |

### Step 2 — Backend → Render

1. Push repo to GitHub
2. [render.com](https://render.com) → New → Web Service → connect repo
3. Configure:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

4. Add Environment Variable: `GROQ_API_KEY` = your key
5. Deploy ✅

### Step 3 — Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → Import repo
2. Root Directory: `frontend`
3. Add Environment Variable: `VITE_API_URL` = your Render URL
4. Deploy ✅

### Step 4 — Keep Render Awake

The `.github/workflows/keepalive.yml` automatically pings your backend every 5 minutes via GitHub Actions — no extra setup needed. Just push to GitHub.

---

## 🗄️ Supabase Setup

Run this in your Supabase SQL Editor:

```sql
create table sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text,
  mode text,
  difficulty text,
  marks integer,
  items jsonb
);

alter table sessions enable row level security;

create policy "allow insert" on sessions for insert with check (true);
create policy "allow select" on sessions for select using (true);
create policy "allow delete" on sessions for delete using (true);
```

Then update `frontend/src/utils/supabase.js` with your project URL and publishable key.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Frontend (`frontend/.env.production`)
```
VITE_API_URL=https://your-render-app.onrender.com
```

---

## 📖 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check — returns app version |
| POST | `/generate/all` | Upload files + generate Q&A in one request |
| POST | `/download/pdf` | Export selected Q&A as styled PDF |

### `/generate/all` — Form Data

| Field | Type | Description |
|-------|------|-------------|
| `notes_files` | File[] | One or more notes PDFs or PPTXs |
| `qp_files` | File[] | Optional — question paper PDFs or PPTXs |
| `difficulty` | string | `easy` · `medium` · `hard` |
| `marks` | int | `3` or `7` |
| `count` | int | Questions per notes file (1–20) |

---

## 🧠 AI Answer Quality

| Mode | Marks | Answer Style | Length |
|------|-------|-------------|--------|
| QP answers | 3 marks | Concise, direct | 4–6 sentences |
| QP answers | 7–8 marks | Detailed essay | 200+ words with structure |
| QP answers | Any | Page reference added | 📄 Page X in your notes |
| Generated | 3 marks | Short answer | 4–6 sentences |
| Generated | 7–8 marks | Long answer | 200+ words |

---

## 📄 Page Reference Feature

When answering a question paper, Reviso tracks which page of your notes contains the relevant information:

```
Q1. What is a stack?

Answer: A stack is a linear data structure that follows
the LIFO (Last In First Out) principle...

📄 Page 3  in your notes
```

This helps students quickly locate the relevant section in their notes for deeper study.

---

## 🕐 Session History

Every generated session is automatically saved:

| Storage | Access | Works offline |
|---------|--------|--------------|
| localStorage | This device only | ✅ Yes |
| Supabase | Any device | ❌ Needs internet |

Click the **🕐 floating button** (bottom right) to view, restore, or delete sessions.

---

## ☕ Render Free Tier — Sleep Handling

Render's free tier sleeps after 15 minutes of inactivity. Reviso handles this gracefully:

1. **On page load** — silently pings backend to start wake-up
2. **Wake-up banner** — shows countdown timer while server starts
3. **Auto-retry** — if a request fails, waits and retries automatically
4. **GitHub Actions** — pings every 5 minutes to prevent sleep entirely

---

## 🛣️ Roadmap

- [ ] User authentication (login per user)
- [ ] Permanent notes storage per user
- [ ] Chat with your notes (RAG)
- [ ] OCR support for scanned PDFs
- [ ] Multiple language support
- [ ] Share sessions with classmates
- [ ] Mobile app

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Server is waking up" banner | Wait for countdown — retries automatically |
| "Could not extract text" | PDF is a scanned image — use a typed PDF |
| "AI returned no questions" | Notes too short — try a longer document |
| Page reference missing | Only shown in QP mode — not in generated mode |
| History not syncing | Check Supabase URL and publishable key |
| Vercel build fails | Set Root Directory to `frontend` |
| PPTX conversion error | Save PPTX as PDF manually and upload that |

---

## 🤝 Contributing

```bash
git clone https://github.com/Niranjana-11/Reviso.git
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a Pull Request on GitHub
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ by **Niranjana Rajesh**

⭐ **Star this repo if Reviso helped you study smarter!**

</div>
