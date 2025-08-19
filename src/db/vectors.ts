/**
 * Purpose: Vector operations for RAG system - embed, upsert, search.
 * Inputs: text chunks, search queries
 * Outputs: embeddings, similarity search results
 * Example: const embeddings = await embedChunks(['chunk1', 'chunk2'])
 */
import {env} from '../env.js'
import {prisma} from './client.js'

// OpenAI embedding model for text-embedding-3-large (3072 dimensions)
const EMBEDDING_MODEL = 'text-embedding-3-large'

export interface EmbeddingChunk {
  source: string
  sourceId: string
  chunk: string
}

export interface SearchResult {
  id: string
  source: string
  sourceId: string
  chunk: string
  similarity: number
}

/**
 * Generate embeddings for text chunks using OpenAI
 */
export const embedChunks = async (chunks: string[]): Promise<number[][]> => {
  try {
    const {default: OpenAI} = await import('openai')
    const openai = new OpenAI({apiKey: env.OPENAI_API_KEY})
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: chunks,
      encoding_format: 'float',
    })
    
    return response.data.map(item => item.embedding)
  } catch (err) {
    console.error('embedding_error', {name: (err as Error).name})
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Upsert chunks with embeddings to vector database
 */
export const upsertChunks = async (chunks: EmbeddingChunk[]): Promise<void> => {
  if (chunks.length === 0) return
  
  try {
    // Generate embeddings for all chunks
    const texts = chunks.map(c => c.chunk)
    const embeddings = await embedChunks(texts)
    
    // Upsert each chunk with its embedding (store as JSON string for local testing)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = embeddings[i]
      
      if (!chunk || !embedding) continue
      
      await prisma.vectorEmbedding.upsert({
        where: {
          source_sourceId: {
            source: chunk.source,
            sourceId: chunk.sourceId,
          },
        },
        update: {
          chunk: chunk.chunk,
          embedding: JSON.stringify(embedding),
        },
        create: {
          source: chunk.source,
          sourceId: chunk.sourceId,
          chunk: chunk.chunk,
          embedding: JSON.stringify(embedding),
        },
      })
    }
  } catch (err) {
    console.error('upsert_error', {name: (err as Error).name, message: (err as Error).message})
    throw new Error('Failed to upsert chunks')
  }
}

/**
 * Search for similar chunks using basic text search (for local testing)
 */
export const searchChunks = async (
  query: string,
  limit: number = 8,
  threshold: number = 0.7
): Promise<SearchResult[]> => {
  try {
    // For local testing, use basic text search instead of vector similarity
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT 
        id,
        source,
        "sourceId",
        chunk,
        0.8 as similarity
      FROM "VectorEmbedding"
      WHERE to_tsvector('english', chunk) @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(to_tsvector('english', chunk), plainto_tsquery('english', ${query})) DESC
      LIMIT ${limit}
    `
    
    return results
  } catch (err) {
    console.error('search_error', {name: (err as Error).name})
    return []
  }
}

/**
 * Chunk text into ~800-1200 token pieces with ~15% overlap
 */
export const chunkText = (text: string, maxTokens: number = 1000, overlap: number = 0.15): string[] => {
  // Simple chunking by sentences for now
  // TODO: implement proper token-based chunking
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence + '. '
    if (testChunk.length > maxTokens * 4) { // Rough token estimate
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        // Add overlap
        const overlapText = currentChunk.split(' ').slice(-Math.floor(currentChunk.split(' ').length * overlap)).join(' ')
        currentChunk = overlapText + sentence + '. '
      } else {
        currentChunk = sentence + '. '
      }
    } else {
      currentChunk = testChunk
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}
