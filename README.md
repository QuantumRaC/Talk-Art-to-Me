
# Talk Art to Me

**Giving voice to visual art.**

## Overview

**Talk Art to Me** is an AI-powered web app that generates *natural, spoken descriptions* of visual art.
It’s designed to make paintings and digital artworks accessible for people who are blind or visually impaired — or for anyone exploring art through sound.

The app uses **Google Gemini’s multimodal AI** to analyze an artwork and produce both:

* a **global description** (what the whole artwork conveys), and
* **regional captions** (detailed descriptions of smaller areas).

Users can:

* Tap on the artwork to hear descriptions of each region,
* Toggle an interactive grid overlay,
* Load random artworks, and
* Listen to AI-generated narration through browser text-to-speech.

---

## Motivation

Art accessibility often stops at one-line alt-text.
As a **full-stack developer** and **digital artist**, I wanted to create something that bridges technology and empathy — a project that uses AI to make art *audible* and *inclusive*.

This project was built for **GatorHack 2025**, but it also represents a larger goal:

> To use AI not just to build something new, but to make something meaningful.

---

## Tech Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Frontend         | Next.js (React + TypeScript), TailwindCSS |
| Backend          | Next.js API Routes                        |
| AI Model         | Google Gemini (Vision + Text multimodal)  |
| Accessibility    | Web Speech API (Text-to-Speech)           |
| Image Processing | Custom region tiling + Canvas API         |
| Hosting          | Vercel                                    |

---

## Architecture

```
Frontend (Next.js) 
 ├── Loads artwork (from /public or user upload)
 ├── Divides image into square regions
 ├── Sends image + region data → /api/describe
 ├── Receives AI JSON (global + region captions)
 ├── Displays grid overlay and plays narration
 └── User can interact, toggle grid, or randomize art

Backend (API Route)
 ├── Receives base64 image and region metadata
 ├── Calls Gemini multimodal model
 ├── Returns JSON { description, regions[] }
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/talk-art-to-me.git
cd talk-art-to-me
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your environment variables

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Accessibility Features

✅ Automatic AI-generated description narration
✅ Interactive clickable grid overlay
✅ Adjustable speech rate (coming soon)
✅ Multilingual TTS (planned)
✅ Keyboard navigation (planned)

---

## Next Steps (2025/10/26)

* [ ] Add **local artwork upload** support
* [ ] Add **server-side caching** for faster AI responses
* [ ] Implement **adjustable speech speed** and **language selection**
* [ ] Add **keyboard navigation** and **ARIA improvements**
* [ ] Extend to **education and digital museum** applications

---

## 📸 Credits

Sample artworks used are for **demonstration and educational purposes only**. File names are the artworks' names and source.
Project created by **Cynthia Yao** ([@QuantumRaC](https://github.com/QuantumRaC)).
