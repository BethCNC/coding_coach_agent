# Coding Coach AI Agent

A personalized AI coding coach that teaches HTML, CSS, and JavaScript using an Odin-style approach: simple explanations, tiny hands-on steps, verification, and progress tracking.

## 🎯 Features

- **Context-Aware Teaching**: Remembers your learning history and adapts explanations
- **RAG-Powered Responses**: Uses your learning materials and conversation history
- **Progress Tracking**: Monitors skill development across HTML, CSS, and JavaScript
- **Personalized Learning**: Adapts to your preferred learning style and pace
- **Long-term Memory**: Generates summaries to maintain learning continuity

## 🏗️ Architecture

```
src/
├── server.ts              # Express API with /chat endpoint
├── env.ts                 # Environment validation with Zod
├── agent/
│   ├── index.ts          # OpenAI-powered response generation
│   ├── policy.ts         # Teaching style and system prompts
│   ├── retrieval.ts      # RAG context building
│   └── summarizer.ts     # Long-term memory summaries
├── db/
│   ├── client.ts         # Prisma database client
│   └── vectors.ts        # Vector embeddings and search
├── jobs/
│   └── ingest.ts         # Content ingestion from external sources
└── test-*.ts             # Test scripts for components
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Supabase)
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd coding_coach_agent
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and database URL
   ```

3. **Set up database:**
   ```bash
   npm run migrate
   npm run ingest  # Populate with learning materials
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   curl -X POST http://localhost:3001/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "How do I center a div?"}'
   ```

## 📚 API Reference

### POST /chat

Send a message to your coding coach.

**Request:**
```json
{
  "message": "How do I create a button in HTML?"
}
```

**Response:**
```json
{
  "sessionId": "cmej3w1bs0000it4jriw7bysm",
  "assistantReply": "Great to see your progress! Let's create a button in HTML step by step..."
}
```

**Headers:**
- `x-debug: true` - Include source information in response

## 🧪 Testing

### Test Vector Operations
```bash
npm run test-vectors
```

### Test Summarizer
```bash
npm run test-summarizer
```

### Type Checking
```bash
npm run typecheck
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run ingest` - Ingest content from Notion, GitHub, and Figma
- `npm run migrate` - Run database migrations
- `npm run typecheck` - TypeScript type checking
- `npm run test-vectors` - Test vector operations
- `npm run test-summarizer` - Test summarizer functionality

### Database Schema

**Sessions** - Track learning sessions
```sql
CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

**Messages** - Store conversation history
```sql
CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

**VectorEmbeddings** - Store learning materials for RAG
```sql
CREATE TABLE "VectorEmbedding" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "chunk" TEXT NOT NULL,
  "embedding" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

## 🎓 Teaching Methodology

The coach follows an Odin-style approach:

1. **Simple Explanation** - Clear, jargon-free explanations
2. **Tiny Hands-On Step** - One small, achievable task at a time
3. **Verification** - Check understanding before moving forward
4. **Progress Logging** - Track skills and learning preferences

### Learning Style Adaptation

The system automatically detects and adapts to:
- **Format Preferences**: Step-by-step, examples, or conceptual explanations
- **Pace**: Slow, medium, or fast learning speed
- **Feedback Style**: Detailed, brief, or mixed explanations

## 🔍 RAG System

The Retrieval-Augmented Generation system combines:

1. **Recent Messages** - Last 20 conversation exchanges
2. **Long-term Summaries** - AI-generated session summaries
3. **Relevant Documents** - Vector search through learning materials
4. **Skill Progress** - Current skill levels and learning history

## 📊 Progress Tracking

Skills are tracked across:
- **HTML Basics** - Elements, structure, semantics
- **CSS Selectors** - Styling, layout, responsive design
- **JavaScript Fundamentals** - Variables, functions, DOM manipulation
- **Advanced Topics** - Flexbox, Grid, APIs, testing

## 🔐 Security

- Environment variables validated with Zod
- No secrets logged in production
- Minimal token scopes for external APIs
- Structured logging without sensitive data

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_postgresql_url
NOTION_TOKEN=your_notion_token
GITHUB_TOKEN=your_github_token
FIGMA_TOKEN=your_figma_token
```

## 🤝 Contributing

1. Follow the established code style (arrow functions, minimal spacing)
2. Add TypeScript types for all functions
3. Include JSDoc comments with purpose, inputs, outputs, and examples
4. Test your changes with the provided test scripts

## 📝 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for effective coding education**
