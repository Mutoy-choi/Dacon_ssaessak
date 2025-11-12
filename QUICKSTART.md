# 🌱 Saessak (새싹) - Quick Start Guide

Welcome to Saessak! This guide will help you get started quickly.

## 📦 Installation

### Step 1: Install Node.js
If you haven't already, download and install Node.js from:
https://nodejs.org/ (recommended: LTS version 18.x or higher)

### Step 2: Clone or Download the Project
```bash
# If you have Git installed:
git clone https://github.com/yourusername/dacon_saessak.git
cd dacon_saessak

# Or download the ZIP file and extract it
```

### Step 3: Install Dependencies
Open a terminal in the project folder and run:
```bash
npm install
```

This will install all required packages (React, Vite, TypeScript, etc.)

### Step 4: Set Up API Key
1. Get your Google Gemini API key from: https://ai.google.dev/
2. Copy `.env.local.example` to `.env.local`:
   ```bash
   # Windows PowerShell:
   Copy-Item .env.local.example .env.local
   
   # macOS/Linux:
   cp .env.local.example .env.local
   ```
3. Open `.env.local` and replace `your_gemini_api_key_here` with your actual API key

### Step 5: Run the Development Server
```bash
npm run dev
```

The app will start at: http://localhost:5173

## 🎮 First Time Usage

1. **Pet Creation**: When you first open the app, you'll create your pet companion "Hatchi"
2. **API Keys**: Click the ⚙️ Settings icon to add API keys for other AI models (optional)
3. **Start Chatting**: Type a message to start your journey!
4. **Reflection**: Use `/pet reflect [question]` to have deeper conversations with your pet

## 🆘 Troubleshooting

### "Cannot find module" errors
```bash
# Delete node_modules and reinstall:
rm -rf node_modules package-lock.json
npm install
```

### "API_KEY is not defined"
Make sure you created `.env.local` file with your Gemini API key.

### Port 5173 already in use
```bash
# Kill the process using port 5173, or run on a different port:
npm run dev -- --port 3000
```

### Image generation not working
- Ensure you have access to Gemini 2.5 Flash Image model
- Check your API key has the correct permissions

## 📚 Learn More

- **README.md** - Full documentation
- **CONTRIBUTING.md** - How to contribute
- **CHANGELOG.md** - Version history

## 💬 Need Help?

- Open an issue on GitHub
- Check the FAQ in README.md
- Review existing issues for solutions

## 🎉 You're Ready!

Enjoy your journey with Saessak! 🌱

---

**Made with 💚 by Team Saessak**
