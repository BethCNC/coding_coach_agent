/**
 * Purpose: Minimal OpenAI-backed reply generator using project policy.
 * Inputs: userMessage string
 * Outputs: assistant reply string
 * Example: const text = await generateAssistantReply('hello')
 */
import OpenAI from 'openai'
import {buildSystemPrompt} from './policy.js'
import {env} from '../env.js'

export const generateAssistantReply = async (userMessage:string):Promise<string>=>{
  try{
    const openai = new OpenAI({apiKey: env.OPENAI_API_KEY})
    const system = buildSystemPrompt()
    const content = userMessage || 'Say hello briefly.'
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
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
    return 'Tiny step: create an index.html with <h1>Hello</h1> in a folder. Then open it in your browser.'
  }
}

