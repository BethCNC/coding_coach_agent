/**
 * Purpose: Express server for AI coding coach with file upload and analysis capabilities.
 * Inputs: HTTP requests, file uploads
 * Outputs: AI responses, file analysis
 * Example: curl -s http://localhost:3001/health
 */
import express from 'express'
import bodyParser from 'body-parser'
import multer from 'multer'
import {env} from './env.js'
import {generateAssistantReply} from './agent/index.js'
import {storeMessage, getRecentMessages, getAllSessions, deleteSession} from './agent/retrieval.js'
import path from 'path'
import {fileURLToPath} from 'url'

const app = express()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only images and PDFs are allowed'))
    }
  }
})

app.use(bodyParser.json({limit: '1mb'}))

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '../public')))

app.get('/health', (_req,res)=>{res.json({ok:true, mode: 'local-development'})})

// Serve the main page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Enhanced /chat endpoint with file upload and analysis
app.post('/chat', upload.array('files', 5), async (req,res)=>{
  try{
    const userMessage = (req.body && req.body.message) || ''
    const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const files = (req as any).files || []

    // Store user message in the retrieval system
    storeMessage(sessionId, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    })

    // Generate AI response with file analysis if files are uploaded
    const assistantReply = await generateAssistantReply(userMessage, sessionId, files)

    // Store assistant message in the retrieval system
    storeMessage(sessionId, {
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date()
    })

    // Get recent messages for context (last 10 messages)
    const recentMessages = await getRecentMessages(sessionId, 10)

    const payload = {
      sessionId,
      assistantReply,
      recentMessages: recentMessages.slice(-6), // Last 3 exchanges for context
      sessionInfo: {
        createdAt: recentMessages[0]?.timestamp,
        messageCount: recentMessages.length
      }
    }

    res.json(payload)
  }catch(err){
    // eslint-disable-next-line no-console
    console.error('chat_error', {name:(err as Error).name})
    res.status(500).json({error:'internal_error'})
  }
})

// Get chat history for a session
app.get('/chat/:sessionId', async (req, res) => {
  try {
    const {sessionId} = req.params
    const recentMessages = await getRecentMessages(sessionId, 50) // Get last 50 messages

    res.json({
      sessionId,
      messages: recentMessages,
      sessionInfo: {
        createdAt: recentMessages[0]?.timestamp,
        lastActivity: recentMessages[recentMessages.length - 1]?.timestamp,
        messageCount: recentMessages.length
      }
    })
  } catch (err) {
    console.error('get_chat_history_error', {name: (err as Error).name})
    res.status(500).json({error: 'internal_error'})
  }
})

// List all sessions with persistent data
app.get('/sessions', (_req, res) => {
  const sessions = getAllSessions()
  res.json({sessions})
})

// Delete a session
app.delete('/sessions/:sessionId', (req, res) => {
  try {
    const {sessionId} = req.params
    const deleted = deleteSession(sessionId)
    
    if (deleted) {
      res.json({success: true, message: 'Session deleted'})
    } else {
      res.status(404).json({error: 'Session not found'})
    }
  } catch (err) {
    console.error('delete_session_error', {name: (err as Error).name})
    res.status(500).json({error: 'internal_error'})
  }
})

const port = Number(env.PORT || 3001)
app.listen(port, ()=>{
  // eslint-disable-next-line no-console
  console.log(`AI coach API on :${port}`)
  console.log('mode: local-development (with AI integration, chat history, file analysis, and persistent storage)')
})

