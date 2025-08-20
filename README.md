# Coding Coach AI

Your personalized AI tutor for HTML, CSS & JavaScript with persistent memory and file analysis capabilities.

## 🚀 Quick Start

### Option 1: Simple Startup Script (Recommended)
```bash
./start-coach.sh
```

### Option 2: Manual Start
```bash
# Install dependencies
npm install

# Start the server
npm run dev
```

Then open **http://localhost:3001** in your browser!

## ✨ Features

### 🤖 AI-Powered Learning
- **Context-aware responses** - Remembers your learning progress
- **Step-by-step guidance** - Odin-style teaching approach
- **Skill tracking** - Monitors your progress across topics
- **Personalized feedback** - Adapts to your learning style

### 📁 File Analysis
- **Image upload** - Drag & drop images for analysis
- **Code review** - AI analyzes your HTML/CSS/JS screenshots
- **Design feedback** - Get suggestions for UI improvements
- **PDF support** - Upload documentation for analysis

### 💾 Persistent Memory
- **Chat history** - All conversations saved automatically
- **Session management** - Multiple learning sessions
- **Progress tracking** - Skills and topics remembered
- **Local storage** - Data saved to `./data/` directory

### 🎯 Learning Topics
- HTML structure and semantics
- CSS styling and layout (Flexbox, Grid)
- JavaScript fundamentals and DOM manipulation
- Design systems and best practices
- Responsive web design
- Accessibility principles

## 📁 Data Storage

Your learning data is automatically saved to:
- `./data/messages.json` - All chat conversations
- `./data/sessions.json` - Session information

**No data leaves your machine** - everything stays local for privacy!

## 🔧 Development

### Project Structure
```
src/
├── agent/           # AI logic and context building
├── db/             # Database utilities (for future use)
├── jobs/           # Background tasks
└── server.ts       # Express server
public/
├── index.html      # Main interface
└── avatar/         # UI assets
data/               # Persistent storage (auto-created)
```

### Environment Variables
Create a `.env.local` file:
```env
OPENAI_API_KEY=your_openai_key_here
PORT=3001
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Check TypeScript types

## 🎓 How to Use

1. **Start a Session** - Click "New Chat" to begin fresh
2. **Ask Questions** - Type your coding questions
3. **Upload Files** - Drag images/PDFs for analysis
4. **Track Progress** - AI remembers your learning journey
5. **Get Feedback** - Receive personalized suggestions

## 🔒 Privacy & Security

- **Local-first** - All data stored on your machine
- **No cloud dependencies** - Works completely offline (except AI responses)
- **Open source** - Full transparency of code
- **No tracking** - No analytics or data collection

## 🛠️ Troubleshooting

### Server won't start?
```bash
# Check if port 3001 is available
lsof -i :3001

# Kill any existing processes
pkill -f "node.*server"
```

### Data not persisting?
```bash
# Check data directory exists
ls -la data/

# Check file permissions
chmod 755 data/
```

### File upload issues?
- Ensure files are under 10MB
- Supported formats: PNG, JPG, GIF, PDF
- Check browser console for errors

## 📈 Learning Path

The AI coach adapts to your progress:

1. **Beginner** - HTML basics, simple styling
2. **Intermediate** - CSS layout, JavaScript fundamentals
3. **Advanced** - Design systems, responsive design
4. **Expert** - Performance, accessibility, best practices

## 🤝 Contributing

This is a personal learning tool, but suggestions are welcome!

## 📄 License

MIT License - Feel free to use and modify for your own learning!
