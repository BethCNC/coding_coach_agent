/**
 * Purpose: Context-aware OpenAI-backed reply generator using RAG retrieval.
 * Inputs: userMessage string, sessionId string
 * Outputs: assistant reply string
 * Example: const text = await generateAssistantReply('hello', sessionId)
 */
import {buildSystemPrompt} from './policy.js'
import {buildContext, formatContextForPrompt, needsContextEnrichment} from './retrieval.js'
import {env} from '../env.js'

export const generateAssistantReply = async (userMessage:string, sessionId?:string):Promise<string>=>{
  try{
    if (!env.OPENAI_API_KEY) {
      return 'Tiny step: create an index.html with <h1>Hello</h1> in a folder. Then open it in your browser.'
    }
    const {default: OpenAI} = await import('openai')
    const openai = new OpenAI({apiKey: env.OPENAI_API_KEY})
    const baseSystem = buildSystemPrompt()
    const content = userMessage || 'Say hello briefly.'
    
    // Build enhanced context if needed and sessionId is provided
    let enhancedPrompt = content
    if (sessionId && needsContextEnrichment(userMessage)) {
      const context = await buildContext(userMessage, sessionId)
      const contextPrompt = formatContextForPrompt(context, userMessage)
      enhancedPrompt = contextPrompt
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role:'system',content:baseSystem},
        {role:'user',content:enhancedPrompt},
      ],
      temperature: 0.3,
      max_tokens: 300, // Increased for context-aware responses
    })
    const text = completion.choices?.[0]?.message?.content?.trim() || 'Okay.'
    return text
  }catch(_err){
    const err = _err as any
    // Safe structured log: no secrets, just metadata
    // eslint-disable-next-line no-console
    console.error('openai_error', {name:err?.name, status:err?.status, code:err?.code})
    return 'Tiny step: create an index.html with <h1>Hello</h1> in a folder. Then open it in your browser.'
  }
}

