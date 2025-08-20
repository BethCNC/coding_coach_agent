/**
 * Purpose: Generate long-term memory summaries from conversation history.
 * Inputs: session messages, conversation context
 * Outputs: rolling summaries for long-term memory
 * Example: const summary = await generateSummary(sessionId)
 */
import {prisma} from '../db/client.js'
import {env} from '../env.js'

export interface ConversationSummary {
  sessionId: string
  summary: string
  topics: string[]
  skillProgress: SkillUpdate[]
  learningStyle: LearningStyle
  createdAt: Date
}

export interface SkillUpdate {
  skill: string
  change: number // -100 to +100
  evidence: string
}

export interface LearningStyle {
  preferredFormat: 'step-by-step' | 'examples' | 'concepts' | 'mixed'
  pace: 'slow' | 'medium' | 'fast'
  feedback: 'detailed' | 'brief' | 'mixed'
  notes: string[]
}

/**
 * Generate a summary of a conversation session
 */
export const generateSummary = async (sessionId: string): Promise<ConversationSummary | null> => {
  try {
    // Get all messages for this session
    const messages = await prisma.message.findMany({
      where: {sessionId},
      orderBy: {createdAt: 'asc'},
    })
    
    if (messages.length < 4) {
      // Need at least 2 exchanges to generate meaningful summary
      return null
    }
    
    // Extract conversation content
    const conversation = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')
    
    // Generate summary using OpenAI
    const summary = await generateAISummary(conversation)
    
    // Extract topics and learning insights
    const topics = extractTopics(messages)
    const skillProgress = analyzeSkillProgress(messages)
    const learningStyle = analyzeLearningStyle(messages)
    
    return {
      sessionId,
      summary: summary,
      topics,
      skillProgress,
      learningStyle,
      createdAt: new Date(),
    }
  } catch (err) {
    console.error('summary_generation_error', {name: (err as Error).name})
    return null
  }
}

/**
 * Use OpenAI to generate a conversation summary
 */
const generateAISummary = async (conversation: string): Promise<string> => {
  try {
    const {default: OpenAI} = await import('openai')
    const openai = new OpenAI({apiKey: env.OPENAI_API_KEY})
    
    const prompt = 'Summarize this coding coaching conversation in 2-3 sentences. Focus on:\n' +
      '1. What the student learned or practiced\n' +
      '2. Their current skill level and progress\n' +
      '3. Any challenges or breakthroughs\n' +
      '4. Learning style preferences observed\n\n' +
      'Conversation:\n' +
      conversation + '\n\n' +
      'Summary:'
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: 'You are a coding coach analyzing a learning session. Be concise and insightful.'},
        {role: 'user', content: prompt},
      ],
      temperature: 0.3,
      max_tokens: 150,
    })
    
    return completion.choices?.[0]?.message?.content?.trim() || 'Session completed with progress made.'
  } catch (err) {
    console.error('ai_summary_error', {name: (err as Error).name})
    return 'Session completed with progress made.'
  }
}

/**
 * Extract topics from conversation messages
 */
function extractTopics(messages: any[]): string[] {
  const topics = new Set<string>()
  const topicKeywords = {
    'html': ['html', 'element', 'tag', 'attribute', 'semantic'],
    'css': ['css', 'style', 'selector', 'property', 'flexbox', 'grid', 'layout'],
    'javascript': ['javascript', 'js', 'function', 'variable', 'array', 'object', 'dom'],
    'responsive': ['responsive', 'mobile', 'breakpoint', 'media query'],
    'accessibility': ['accessibility', 'a11y', 'screen reader', 'semantic'],
    'performance': ['performance', 'optimization', 'speed', 'loading'],
    'testing': ['test', 'debug', 'console', 'error', 'validation'],
  }
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase()
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        topics.add(topic)
      }
    })
  })
  
  return Array.from(topics).slice(0, 5) // Limit to 5 topics
}

/**
 * Analyze skill progress from conversation
 */
function analyzeSkillProgress(messages: any[]): SkillUpdate[] {
  const skillUpdates: SkillUpdate[] = []
  const skillIndicators = {
    'html-basics': {
      positive: ['created', 'understood', 'successful', 'working'],
      negative: ['confused', 'error', 'broken', 'not working'],
    },
    'css-selectors': {
      positive: ['styled', 'centered', 'layout', 'responsive'],
      negative: ['not styling', 'not centered', 'layout broken'],
    },
    'javascript-fundamentals': {
      positive: ['function', 'variable', 'working', 'console.log'],
      negative: ['syntax error', 'undefined', 'not working'],
    },
  }
  
  Object.entries(skillIndicators).forEach(([skill, indicators]) => {
    let change = 0
    let evidence = ''
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase()
      
      // Count positive indicators
      indicators.positive.forEach(indicator => {
        if (content.includes(indicator)) {
          change += 10
          evidence += `Used ${indicator}, `
        }
      })
      
      // Count negative indicators
      indicators.negative.forEach(indicator => {
        if (content.includes(indicator)) {
          change -= 5
          evidence += `Struggled with ${indicator}, `
        }
      })
    })
    
    if (change !== 0) {
      skillUpdates.push({
        skill,
        change: Math.max(-100, Math.min(100, change)), // Clamp to -100 to +100
        evidence: evidence.slice(0, -2), // Remove trailing comma
      })
    }
  })
  
  return skillUpdates
}

/**
 * Analyze learning style preferences
 */
function analyzeLearningStyle(messages: any[]): LearningStyle {
  const learningStyle: LearningStyle = {
    preferredFormat: 'mixed',
    pace: 'medium',
    feedback: 'mixed',
    notes: [],
  }
  
  const content = messages.map(msg => msg.content.toLowerCase()).join(' ')
  
  // Analyze format preferences
  if (content.includes('step by step') || content.includes('tiny step')) {
    learningStyle.preferredFormat = 'step-by-step'
    learningStyle.notes.push('Prefers step-by-step instructions')
  } else if (content.includes('example') || content.includes('show me')) {
    learningStyle.preferredFormat = 'examples'
    learningStyle.notes.push('Learns well from examples')
  } else if (content.includes('concept') || content.includes('explain')) {
    learningStyle.preferredFormat = 'concepts'
    learningStyle.notes.push('Wants conceptual understanding')
  }
  
  // Analyze pace
  if (content.includes('slow') || content.includes('take time')) {
    learningStyle.pace = 'slow'
    learningStyle.notes.push('Prefers slower pace')
  } else if (content.includes('fast') || content.includes('quick')) {
    learningStyle.pace = 'fast'
    learningStyle.notes.push('Prefers faster pace')
  }
  
  // Analyze feedback preferences
  if (content.includes('detailed') || content.includes('explain more')) {
    learningStyle.feedback = 'detailed'
    learningStyle.notes.push('Wants detailed explanations')
  } else if (content.includes('brief') || content.includes('short')) {
    learningStyle.feedback = 'brief'
    learningStyle.notes.push('Prefers brief explanations')
  }
  
  return learningStyle
}

/**
 * Store summary in database (placeholder for now)
 */
export const storeSummary = async (summary: ConversationSummary): Promise<void> => {
  try {
    // TODO: Create a Summary table in Prisma schema
    // For now, we'll store it as a system message in the session
    await prisma.message.create({
      data: {
        sessionId: summary.sessionId,
        role: 'system',
        content: `SESSION SUMMARY: ${summary.summary}\nTOPICS: ${summary.topics.join(', ')}\nLEARNING STYLE: ${JSON.stringify(summary.learningStyle)}`,
      },
    })
  } catch (err) {
    console.error('store_summary_error', {name: (err as Error).name})
  }
}

/**
 * Get the latest summary for a session
 */
export const getLatestSummary = async (sessionId: string): Promise<string | undefined> => {
  try {
    const summaryMessage = await prisma.message.findFirst({
      where: {
        sessionId,
        role: 'system',
        content: {startsWith: 'SESSION SUMMARY:'},
      },
      orderBy: {createdAt: 'desc'},
    })
    
    return summaryMessage?.content
  } catch (err) {
    console.error('get_summary_error', {name: (err as Error).name})
    return undefined
  }
}

/**
 * Generate and store summary for a completed session
 */
export const summarizeSession = async (sessionId: string): Promise<void> => {
  try {
    const summary = await generateSummary(sessionId)
    if (summary) {
      await storeSummary(summary)
      console.log(`✅ Generated summary for session ${sessionId}`)
    }
  } catch (err) {
    console.error('summarize_session_error', {name: (err as Error).name})
  }
}
