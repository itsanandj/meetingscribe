# Meeting Scribe — Plan

## One-Line Summary
Upload a meeting recording, get a clean transcript and AI-powered summary with action items.

## Core Features (MVP)
- User accounts (signup, login, password reset)
- Upload audio files (mp3, wav, m4a — up to 25 MB for now)
- AI transcription (OpenAI API)
- AI summarization with action items (DeepSeek API)
- Dashboard to view past meetings
- Basic subscription (free tier + paid)

## Not Building Yet
- Live recording in browser
- Team/shared workspaces
- Calendar integration
- Multiple languages (saving for V2)
- Mobile app

## Tech Stack
- Next.js (the app framework)
- Supabase (database, auth, file storage)
- OpenAI transcription API (audio → text)
- DeepSeek API (text → smart summary)
- Polar.sh (payments)
- Vercel (deployment)

## Building Blocks
- Auth block (from the starter kit)
- Upload block (audio files → Supabase Storage)
- Transcription wrapper (OpenAI)
- Summarization wrapper (DeepSeek)
- Payments block (Polar.sh checkout + webhook)
- Core logic: meetings dashboard tying it all together