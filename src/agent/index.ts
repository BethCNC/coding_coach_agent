/**
 * Purpose: Minimal OpenAI-backed reply generator using project policy.
 * Inputs: userMessage string
 * Outputs: assistant reply string
 * Example: const text = await generateAssistantReply('hello')
 */
import {buildSystemPrompt} from './policy.js'
import {env} from '../env.js'

export const generateAssistantReply = async (userMessage:string):Promise<string>=>{
  try{
    const {default: OpenAI} = await import('openai')
    const openai = new OpenAI({apiKey: env.OPENAI_API_KEY})
    const system = buildSystemPrompt()
    const content = userMessage || 'Say hello briefly.'
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role:'system',content:system},
        {role:'user',content},
      ],
      temperature: 0.3,
      max_tokens: 200,
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

