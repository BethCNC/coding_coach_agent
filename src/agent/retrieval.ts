/**
 * Purpose: Build contextual information for AI responses using RAG.
 * Inputs: user message, session ID
 * Outputs: enriched context combining recent messages, summaries, and relevant docs
 * Example: const context = await buildContext('How do I center a div?', sessionId)
 */
import {prisma} from '../db/client.js'
import {searchChunks} from '../db/vectors.js'
import {getLatestSummary} from './summarizer.js'

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

/**
 * Get recent messages from the conversation
 */
export const getRecentMessages = async (
  sessionId: string, 
  limit: number = 20
): Promise<ConversationMessage[]> => {
  try {
    const messages = await prisma.message.findMany({
      where: {sessionId},
      orderBy: {createdAt: 'desc'},
      take: limit,
    })
    
    return messages
      .reverse() // Restore chronological order
      .map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.createdAt,
      }))
  } catch (err) {
    console.error('recent_messages_error', {name: (err as Error).name})
    return []
  }
}

/**
 * Search for relevant documents based on user query
 */
export const getRelevantDocuments = async (
  query: string,
  limit: number = 8,
  threshold: number = 0.7
): Promise<RelevantDocument[]> => {
  try {
    const results = await searchChunks(query, limit, threshold)
    
    return results.map(result => ({
      source: result.source,
      sourceId: result.sourceId,
      chunk: result.chunk,
      similarity: result.similarity,
    }))
  } catch (err) {
    console.error('relevant_docs_error', {name: (err as Error).name})
    return []
  }
}

/**
 * Get conversation summary from summarizer
 */
export const getConversationSummary = async (sessionId: string): Promise<string | undefined> => {
  try {
    return await getLatestSummary(sessionId)
  } catch (err) {
    console.error('summary_error', {name: (err as Error).name})
    return undefined
  }
}

/**
 * Extract topics from conversation messages (simple implementation)
 */
const extractTopics = (messages: ConversationMessage[]): string[] => {
  const topics = new Set<string>()
  const keywords = [
    'html', 'css', 'javascript', 'flexbox', 'grid', 'dom', 'api',
    'function', 'variable', 'element', 'selector', 'property',
    'event', 'array', 'object', 'component', 'layout', 'responsive'
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
 * Get skill progress (placeholder for now)
 */
export const getSkillProgress = async (sessionId: string): Promise<SkillProgress[]> => {
  try {
    // TODO: Implement actual skill tracking in progress.ts
    // For now, return basic skill categories
    return [
      {skill: 'html-basics', score: 75, notes: 'Good understanding of elements and structure'},
      {skill: 'css-selectors', score: 60, notes: 'Working on advanced selectors'},
      {skill: 'javascript-fundamentals', score: 45, notes: 'Learning functions and variables'},
    ]
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
