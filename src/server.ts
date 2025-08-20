/**
 * Purpose: Minimal Express server exposing /chat placeholder.
 * Inputs: HTTP requests
 * Outputs: JSON responses
 * Example: curl -s http://localhost:3001/health
 */
import express from 'express'
import bodyParser from 'body-parser'
import {env} from './env.js'
import {prisma} from './db/client.js'
import {generateAssistantReply} from './agent/index.js'
import {summarizeSession} from './agent/summarizer.js'
import path from 'path'
import {fileURLToPath} from 'url'

const app = express()
app.use(bodyParser.json({limit: '1mb'}))

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '../public')))

app.get('/ping', (_req,res)=>{res.json({pong: true, timestamp: new Date().toISOString()})})

app.get('/health', async (_req,res)=>{
  const health = {
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      database_url_present: Boolean(env.DATABASE_URL),
      openai_key_present: Boolean(env.OPENAI_API_KEY)
    },
    database: 'unknown',
    prisma_client: 'unknown'
  }
  
  try {
    await prisma.$connect()
    await prisma.session.findFirst()
    health.database = 'connected'
    health.prisma_client = 'working'
  } catch (error) {
    health.ok = false
    health.database = `error: ${(error as Error).name}`
    health.prisma_client = 'failed'
  }
  
  res.json(health)
})

// Serve the main page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Placeholder /chat: returns shape required by acceptance; DB wiring in next step
app.post('/chat', async (req,res)=>{
  try{
    const userMessage = (req.body && req.body.message) || ''
    
    // Create a session on first use for simplicity; in real app, client provides sessionId
    const session = await prisma.session.create({data:{}})
    const sessionId = session.id
    await prisma.message.create({data:{sessionId,role:'user',content:userMessage}})
    const assistantReply = await generateAssistantReply(userMessage, sessionId)
    let usedFallback = false
    if(assistantReply.startsWith('Tiny step: create an index.html')){
      // eslint-disable-next-line no-console
      console.error('assistant_fallback_used')
      usedFallback = true
    }
    await prisma.message.create({data:{sessionId,role:'assistant',content:assistantReply}})
    
    // Generate summary if session has enough messages (background task)
    const messageCount = await prisma.message.count({where: {sessionId}})
    if (messageCount >= 6) { // At least 3 exchanges
      summarizeSession(sessionId).catch(err => 
        console.error('summary_background_error', {name: (err as Error).name})
      )
    }
    
    const debug = req.header('x-debug')
    const payload:any = {sessionId,assistantReply}
    if(debug){payload.source = usedFallback ? 'fallback' : 'openai'}
    res.json(payload)
  }catch(err){
    // eslint-disable-next-line no-console
    console.error('chat_error', {
      name: (err as Error).name, 
      message: (err as Error).message,
      stack: (err as Error).stack?.split('\n').slice(0, 3).join('\n')
    })
    res.status(500).json({error:'internal_error'})
  }
})

const port = Number(env.PORT || 3001)
app.listen(port, async ()=>{
  // eslint-disable-next-line no-console
  console.log(`AI coach API on :${port}`)
  // Safe metadata only; never log secrets
  // eslint-disable-next-line no-console
  console.log('openai_key_present', Boolean(env.OPENAI_API_KEY))
  console.log('database_url_present', Boolean(env.DATABASE_URL))
  
  // Test database connection
  try {
    await prisma.$connect()
    console.log('database_connection_success')
  } catch (error) {
    console.error('database_connection_failed', {name: (error as Error).name})
  }
})

