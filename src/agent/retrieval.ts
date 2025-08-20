/**
 * Purpose: Build contextual information for AI responses using local storage and external APIs.
 * Inputs: user message, session ID
 * Outputs: enriched context combining recent messages and relevant docs
 * Example: const context = await buildContext('How do I center a div?', sessionId)
 */

export interface RetrievalContext {
  recentMessages: ConversationMessage[]
  relevantDocs: RelevantDocument[]
  summary?: string | undefined
  skillProgress?: SkillProgress[] | undefined
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface RelevantDocument {
  source: string
  sourceId: string
  chunk: string
  similarity: number
}

export interface SkillProgress {
  skill: string
  score: number
  lastPracticed?: Date
  notes?: string
}

// In-memory storage for local development
const messageHistory = new Map<string, ConversationMessage[]>()

/**
 * Get recent messages from in-memory storage
 */
export const getRecentMessages = async (
  sessionId: string, 
  limit: number = 20
): Promise<ConversationMessage[]> => {
  try {
    const messages = messageHistory.get(sessionId) || []
    return messages.slice(-limit) // Get last N messages
  } catch (err) {
    console.error('recent_messages_error', {name: (err as Error).name})
    return []
  }
}

/**
 * Store a message in memory
 */
export const storeMessage = (sessionId: string, message: ConversationMessage): void => {
  if (!messageHistory.has(sessionId)) {
    messageHistory.set(sessionId, [])
  }
  messageHistory.get(sessionId)!.push(message)
}

/**
 * Search for relevant documents from your learning materials
 */
export const getRelevantDocuments = async (
  query: string,
  limit: number = 8,
  threshold: number = 0.7
): Promise<RelevantDocument[]> => {
  try {
    // Simple keyword matching for local development
    const learningMaterials = [
      {
        source: 'css-design-system-best-practices',
        sourceId: 'design-system-guide',
        chunk: 'CSS Design Systems: Best Practices & Learning Guide. A design system is a collection of reusable styles and rules (colors, typography, spacing, components) that create consistency across your website or app.',
        keywords: ['css', 'design', 'system', 'style', 'component', 'reusable']
      },
      {
        source: 'css-design-system-documentation',
        sourceId: 'design-system-docs',
        chunk: 'Token Architecture: Your tokens are organized into layers - Primitives (raw values), Alias (meaningful names), Mapped (semantic), Components (scoped tokens), and Responsive tokens.',
        keywords: ['token', 'architecture', 'primitive', 'alias', 'component', 'responsive']
      },
      {
        source: 'html-basics',
        sourceId: 'html-guide',
        chunk: 'HTML is the structure of your webpage. Basic HTML structure includes DOCTYPE, html, head, and body elements. Use semantic elements like h1, p, div, span for better accessibility.',
        keywords: ['html', 'structure', 'element', 'semantic', 'head', 'body']
      },
      {
        source: 'javascript-fundamentals',
        sourceId: 'js-guide',
        chunk: 'JavaScript makes your page interactive. Learn variables, functions, events, DOM manipulation. Start with simple interactions like button clicks and form handling.',
        keywords: ['javascript', 'interactive', 'function', 'variable', 'event', 'dom']
      }
    ]
    
    const queryLower = query.toLowerCase()
    const relevantDocs = learningMaterials
      .filter(doc => doc.keywords.some(keyword => queryLower.includes(keyword)))
      .map(doc => ({
        source: doc.source,
        sourceId: doc.sourceId,
        chunk: doc.chunk,
        similarity: 0.8, // High similarity for keyword matches
      }))
      .slice(0, limit)
    
    return relevantDocs
  } catch (err) {
    console.error('relevant_docs_error', {name: (err as Error).name})
    return []
  }
}

/**
 * Get conversation summary from recent messages
 */
export const getConversationSummary = async (sessionId: string): Promise<string | undefined> => {
  try {
    const messages = messageHistory.get(sessionId) || []
    if (messages.length < 4) return undefined
    
    // Simple summary based on recent conversation
    const recentMessages = messages.slice(-6) // Last 6 messages
    const topics = extractTopics(recentMessages)
    
    if (topics.length > 0) {
      return `Recent conversation focused on: ${topics.join(', ')}`
    }
    
    return undefined
  } catch (err) {
    console.error('summary_error', {name: (err as Error).name})
    return undefined
  }
}

/**
 * Extract topics from conversation messages
 */
const extractTopics = (messages: ConversationMessage[]): string[] => {
  const topics = new Set<string>()
  const keywords = [
    'html', 'css', 'javascript', 'flexbox', 'grid', 'dom', 'api',
    'function', 'variable', 'element', 'selector', 'property',
    'event', 'array', 'object', 'component', 'layout', 'responsive',
    'design', 'system', 'token', 'style', 'color', 'font'
  ]
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase()
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topics.add(keyword)
      }
    })
  })
  
  return Array.from(topics).slice(0, 5) // Limit to 5 topics
}

/**
 * Get skill progress (simplified for local development)
 */
export const getSkillProgress = async (sessionId: string): Promise<SkillProgress[]> => {
  try {
    const messages = messageHistory.get(sessionId) || []
    const topics = extractTopics(messages)
    
    // Simple skill assessment based on conversation topics
    const skills = [
      {skill: 'html-basics', keywords: ['html', 'element', 'structure']},
      {skill: 'css-selectors', keywords: ['css', 'selector', 'style', 'color']},
      {skill: 'css-layout', keywords: ['flexbox', 'grid', 'layout', 'responsive']},
      {skill: 'javascript-fundamentals', keywords: ['javascript', 'function', 'variable', 'event']},
      {skill: 'design-systems', keywords: ['design', 'system', 'token', 'component']}
    ]
    
    return skills.map(skill => {
      const relevantTopics = topics.filter(topic => 
        skill.keywords.some(keyword => topic.includes(keyword))
      )
      const score = Math.min(100, relevantTopics.length * 25) // 25 points per relevant topic
      
      return {
        skill: skill.skill,
        score,
        notes: relevantTopics.length > 0 ? `Discussed: ${relevantTopics.join(', ')}` : 'Not yet covered'
      }
    }).filter(skill => skill.score > 0)
  } catch (err) {
    console.error('skill_progress_error', {name: (err as Error).name})
    return []
  }
}

/**
 * Build comprehensive context for AI response
 */
export const buildContext = async (
  userMessage: string,
  sessionId: string
): Promise<RetrievalContext> => {
  try {
    // Gather context from multiple sources in parallel
    const [recentMessages, relevantDocs, summary, skillProgress] = await Promise.all([
      getRecentMessages(sessionId, 20),
      getRelevantDocuments(userMessage, 8),
      getConversationSummary(sessionId),
      getSkillProgress(sessionId),
    ])
    
    return {
      recentMessages,
      relevantDocs,
      summary,
      skillProgress,
    }
  } catch (err) {
    console.error('build_context_error', {name: (err as Error).name})
    return {
      recentMessages: [],
      relevantDocs: [],
    }
  }
}

/**
 * Format context into system prompt for OpenAI
 */
export const formatContextForPrompt = (context: RetrievalContext, userMessage: string): string => {
  const parts: string[] = []
  
  // Add conversation summary if available
  if (context.summary) {
    parts.push(`CONVERSATION SUMMARY: ${context.summary}`)
  }
  
  // Add skill progress
  if (context.skillProgress && context.skillProgress.length > 0) {
    const skillSummary = context.skillProgress
      .map(skill => `${skill.skill}: ${skill.score}% (${skill.notes || 'no notes'})`)
      .join(', ')
    parts.push(`SKILL PROGRESS: ${skillSummary}`)
  }
  
  // Add recent conversation context (last few messages)
  if (context.recentMessages.length > 0) {
    const recentContext = context.recentMessages
      .slice(-6) // Last 3 exchanges (6 messages)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')
    parts.push(`RECENT CONVERSATION:\n${recentContext}`)
  }
  
  // Add relevant documentation
  if (context.relevantDocs.length > 0) {
    const docContext = context.relevantDocs
      .slice(0, 3) // Top 3 most relevant docs
      .map(doc => `${doc.source}: ${doc.chunk}`)
      .join('\n\n')
    parts.push(`RELEVANT LEARNING MATERIALS:\n${docContext}`)
  }
  
  // Current user message
  parts.push(`CURRENT QUESTION: ${userMessage}`)
  
  return parts.join('\n\n')
}

/**
 * Check if user message needs context enrichment
 */
export const needsContextEnrichment = (userMessage: string): boolean => {
  const contextTriggers = [
    'how', 'what', 'why', 'when', 'where', 'explain', 'help',
    'problem', 'issue', 'error', 'debug', 'fix', 'center',
    'layout', 'style', 'function', 'variable', 'element'
  ]
  
  const message = userMessage.toLowerCase()
  return contextTriggers.some(trigger => message.includes(trigger))
}
