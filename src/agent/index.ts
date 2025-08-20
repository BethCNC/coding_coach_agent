/**
 * Purpose: Context-aware OpenAI-backed reply generator using RAG retrieval and file analysis.
 * Inputs: userMessage string, sessionId string, files array (optional)
 * Outputs: assistant reply string
 * Example: const text = await generateAssistantReply('hello', sessionId, files)
 */
import {buildSystemPrompt} from './policy.js'
import {buildContext, formatContextForPrompt, needsContextEnrichment} from './retrieval.js'
import {env} from '../env.js'

export const generateAssistantReply = async (
  userMessage:string, 
  sessionId?:string, 
  files?:any[]
):Promise<string>=>{
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

    // Prepare messages array
    const messages: any[] = [
      {role:'system',content:baseSystem},
    ]

    // If files are uploaded, analyze them first
    if (files && files.length > 0) {
      const fileAnalysis = await analyzeFiles(files, openai)
      if (fileAnalysis) {
        enhancedPrompt = `File Analysis:\n${fileAnalysis}\n\nUser Question: ${enhancedPrompt}`
      }
    }

    messages.push({role:'user',content:enhancedPrompt})

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 500, // Increased for file analysis responses
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

/**
 * Analyze uploaded files using OpenAI's vision API and text extraction
 */
async function analyzeFiles(files: any[], openai: any): Promise<string> {
  try {
    const analyses: string[] = []
    
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        // Analyze image using vision API
        const imageAnalysis = await analyzeImage(file, openai)
        analyses.push(`📷 ${file.originalname}: ${imageAnalysis}`)
      } else if (file.mimetype === 'application/pdf') {
        // For PDFs, we'll extract text (simplified for now)
        analyses.push(`📄 ${file.originalname}: PDF document uploaded (text extraction not implemented in this version)`)
      }
    }
    
    return analyses.join('\n\n')
  } catch (error) {
    console.error('file_analysis_error', {name: (error as Error).name})
    return 'File analysis failed. Please try again.'
  }
}

/**
 * Analyze image using OpenAI's vision API
 */
async function analyzeImage(file: any, openai: any): Promise<string> {
  try {
    // Convert buffer to base64
    const base64Image = file.buffer.toString('base64')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and describe what you see. If it contains code, HTML, CSS, or design elements, provide detailed feedback and suggestions for improvement. Focus on web development aspects if applicable.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.mimetype};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    })
    
    return response.choices?.[0]?.message?.content?.trim() || 'Image analysis completed.'
  } catch (error) {
    console.error('image_analysis_error', {name: (error as Error).name})
    return 'Image analysis failed.'
  }
}

