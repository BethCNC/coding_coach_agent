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

const app = express()
app.use(bodyParser.json({limit: '1mb'}))

app.get('/health', (_req,res)=>{res.json({ok:true})})

// Placeholder /chat: returns shape required by acceptance; DB wiring in next step
app.post('/chat', async (req,res)=>{
  try{
    const userMessage = (req.body && req.body.message) || ''
    // Create a session on first use for simplicity; in real app, client provides sessionId
    const session = await prisma.session.create({data:{}})
    const sessionId = session.id
    await prisma.message.create({data:{sessionId,role:'user',content:userMessage}})
    const assistantReply = await generateAssistantReply(userMessage)
    let usedFallback = false
    if(assistantReply.startsWith('Tiny step: create an index.html')){
      // eslint-disable-next-line no-console
      console.error('assistant_fallback_used')
      usedFallback = true
    }
    await prisma.message.create({data:{sessionId,role:'assistant',content:assistantReply}})
    const debug = req.header('x-debug')
    const payload:any = {sessionId,assistantReply}
    if(debug){payload.source = usedFallback ? 'fallback' : 'openai'}
    res.json(payload)
  }catch(err){
    // eslint-disable-next-line no-console
    console.error('chat_error', {name:(err as Error).name})
    res.status(500).json({error:'internal_error'})
  }
})

const port = Number(env.PORT || 3001)
app.listen(port, ()=>{
  // eslint-disable-next-line no-console
  console.log(`AI coach API on :${port}`)
  // Safe metadata only; never log secrets
  // eslint-disable-next-line no-console
  console.log('openai_key_present', Boolean(env.OPENAI_API_KEY))
})

