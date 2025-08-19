/**
 * Purpose: Ingest content from Notion/GitHub/Figma into vector database for RAG.
 * Inputs: API tokens, source configurations
 * Outputs: Chunked and embedded content in vector database
 * Example: npm run ingest
 */
import {env} from '../env.js'
import {chunkText, upsertChunks, type EmbeddingChunk} from '../db/vectors.js'

// Source types for tracking
type SourceType = 'notion' | 'github' | 'figma' | 'internal'

interface IngestConfig {
  source: SourceType
  sourceId: string
  content: string
  metadata?: Record<string, any>
}

/**
 * Ingest content from Notion database
 */
async function ingestNotion(): Promise<void> {
  if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) {
    console.log('⚠️  Notion credentials not configured, skipping...')
    return
  }

  try {
    console.log('📚 Ingesting Notion content...')
    const {Client} = await import('@notionhq/client')
    const notion = new Client({auth: env.NOTION_TOKEN})
    
    // Query database for pages
    const response = await notion.databases.query({
      database_id: env.NOTION_DATABASE_ID,
      page_size: 100,
    })
    
    const chunks: EmbeddingChunk[] = []
    
    for (const page of response.results) {
      if ('properties' in page) {
        // Extract page content (simplified - you can expand this)
        const title = 'Notion Page' // Simplified for now
        const content = `Title: ${title}\nPage ID: ${page.id}\nLast edited: ${new Date().toISOString()}`
        
        // Chunk the content
        const textChunks = chunkText(content)
        textChunks.forEach((chunk, index) => {
          chunks.push({
            source: 'notion',
            sourceId: `${page.id}-${index}`,
            chunk,
          })
        })
      }
    }
    
    if (chunks.length > 0) {
      await upsertChunks(chunks)
      console.log(`✅ Ingested ${chunks.length} Notion chunks`)
    }
  } catch (err) {
    console.error('❌ Notion ingest failed:', err)
  }
}

/**
 * Ingest content from GitHub repository
 */
async function ingestGitHub(): Promise<void> {
  if (!env.GITHUB_TOKEN) {
    console.log('⚠️  GitHub token not configured, skipping...')
    return
  }

  try {
    console.log('📚 Ingesting GitHub content...')
    const {Octokit} = await import('@octokit/rest')
    const octokit = new Octokit({auth: env.GITHUB_TOKEN})
    
    // For now, ingest from a specific repo (you can make this configurable)
    const owner = 'BethCNC'
    const repo = 'coding_coach_agent'
    
    // Get repository files
    const {data: filesResponse} = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    })
    
    const chunks: EmbeddingChunk[] = []
    
    // Ensure files is an array
    const files = Array.isArray(filesResponse) ? filesResponse : []
    
    // Process files (simplified - you can expand this)
    for (const file of files) {
      if (file.type === 'file' && file.name.endsWith('.md')) {
        try {
          const {data: content} = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
          })
          
          if ('content' in content) {
            const textContent = Buffer.from(content.content, 'base64').toString()
            const textChunks = chunkText(textContent)
            
            textChunks.forEach((chunk, index) => {
              chunks.push({
                source: 'github',
                sourceId: `${file.path}-${index}`,
                chunk,
              })
            })
          }
        } catch (err) {
          console.warn(`⚠️  Failed to process ${file.path}:`, err)
        }
      }
    }
    
    if (chunks.length > 0) {
      await upsertChunks(chunks)
      console.log(`✅ Ingested ${chunks.length} GitHub chunks`)
    }
  } catch (err) {
    console.error('❌ GitHub ingest failed:', err)
  }
}

/**
 * Ingest content from Figma file
 */
async function ingestFigma(): Promise<void> {
  if (!env.FIGMA_TOKEN) {
    console.log('⚠️  Figma token not configured, skipping...')
    return
  }

  try {
    console.log('📚 Ingesting Figma content...')
    
    // For now, add placeholder Figma content (you can implement API later)
    const figmaContent = `
Figma Design System:
- Color palette: Primary blue, secondary gray, accent orange
- Typography: Heading fonts, body text, code fonts
- Components: Buttons, forms, navigation, cards
- Layout: Grid system, spacing, responsive breakpoints
- Icons: SVG icon library, consistent sizing
    `
    
    const chunks: EmbeddingChunk[] = []
    const textChunks = chunkText(figmaContent)
    
    textChunks.forEach((chunk, index) => {
      chunks.push({
        source: 'figma',
        sourceId: `design-system-${index}`,
        chunk,
      })
    })
    
    if (chunks.length > 0) {
      await upsertChunks(chunks)
      console.log(`✅ Ingested ${chunks.length} Figma chunks`)
    }
  } catch (err) {
    console.error('❌ Figma ingest failed:', err)
  }
}

/**
 * Ingest internal content (learning materials, documentation)
 */
async function ingestInternal(): Promise<void> {
  console.log('📚 Ingesting internal content...')
  
  const internalContent = [
    {
      title: 'HTML Basics',
      content: `
HTML (HyperText Markup Language) is the standard markup language for creating web pages.
HTML describes the structure of a web page semantically and originally included cues for the appearance of the document.

Key HTML concepts:
- Elements are the building blocks of HTML pages
- Tags come in pairs: opening and closing tags
- Attributes provide additional information about elements
- Semantic HTML helps with accessibility and SEO

Common HTML elements:
- <html>: Root element of an HTML page
- <head>: Contains meta information about the document
- <body>: Contains the visible page content
- <h1> to <h6>: Heading elements
- <p>: Paragraph element
- <div>: Division or section element
- <span>: Inline element for grouping text
- <a>: Anchor element for links
- <img>: Image element
- <ul>, <ol>, <li>: List elements
      `,
    },
    {
      title: 'CSS Fundamentals',
      content: `
CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in HTML.
CSS is designed to enable the separation of presentation and content, including layout, colors, and fonts.

CSS Selectors:
- Element selectors: p, div, h1
- Class selectors: .classname
- ID selectors: #idname
- Descendant selectors: div p
- Child selectors: div > p
- Pseudo-classes: :hover, :focus, :active

CSS Box Model:
- Content: The actual content of the element
- Padding: Space between content and border
- Border: Border around the element
- Margin: Space outside the border

CSS Layout:
- Display: block, inline, inline-block, flex, grid
- Position: static, relative, absolute, fixed, sticky
- Flexbox: flex-direction, justify-content, align-items
- Grid: grid-template-columns, grid-template-rows
      `,
    },
    {
      title: 'JavaScript Essentials',
      content: `
JavaScript is a programming language that is one of the core technologies of the World Wide Web.
JavaScript enables interactive web pages and is an essential part of web applications.

JavaScript Fundamentals:
- Variables: let, const, var
- Data types: string, number, boolean, object, array, null, undefined
- Functions: function declarations, expressions, arrow functions
- Control flow: if/else, switch, loops (for, while, forEach)
- Objects and arrays: creation, manipulation, methods

DOM Manipulation:
- Selecting elements: getElementById, querySelector, querySelectorAll
- Modifying content: innerHTML, textContent, innerText
- Changing attributes: setAttribute, getAttribute
- Event handling: addEventListener, removeEventListener
- Creating elements: createElement, appendChild, removeChild

Modern JavaScript:
- ES6+ features: arrow functions, destructuring, spread operator
- Promises and async/await for asynchronous operations
- Modules: import/export statements
- Template literals for string interpolation
      `,
    },
  ]
  
  const chunks: EmbeddingChunk[] = []
  
  internalContent.forEach((item, itemIndex) => {
    const textChunks = chunkText(item.content)
    textChunks.forEach((chunk, chunkIndex) => {
      chunks.push({
        source: 'internal',
        sourceId: `${item.title.toLowerCase().replace(/\s+/g, '-')}-${itemIndex}-${chunkIndex}`,
        chunk,
      })
    })
  })
  
  if (chunks.length > 0) {
    await upsertChunks(chunks)
    console.log(`✅ Ingested ${chunks.length} internal chunks`)
  }
}

/**
 * Main ingest function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting content ingestion...')
  
  try {
    // Ingest from all sources
    await Promise.all([
      ingestNotion(),
      ingestGitHub(),
      ingestFigma(),
      ingestInternal(),
    ])
    
    console.log('✅ Content ingestion completed!')
  } catch (err) {
    console.error('❌ Ingestion failed:', err)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

