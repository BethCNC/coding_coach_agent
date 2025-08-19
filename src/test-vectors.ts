/**
 * Purpose: Test vectors.ts functionality
 * Example: npm run test-vectors
 */
import {chunkText, embedChunks, upsertChunks, searchChunks} from './db/vectors.js'

const testText = `
HTML is the standard markup language for creating web pages. 
HTML stands for Hyper Text Markup Language. HTML describes the structure of a web page semantically and originally included cues for the appearance of the document.

HTML elements are the building blocks of HTML pages. With HTML constructs, images and other objects such as interactive forms may be embedded into the rendered page.

CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in a markup language such as HTML. CSS is designed to enable the separation of presentation and content, including layout, colors, and fonts.

JavaScript is a programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS. JavaScript enables interactive web pages and is an essential part of web applications.
`

async function testVectors() {
  console.log('🧪 Testing vectors.ts functionality...')
  
  try {
    // Test chunking
    console.log('1. Testing text chunking...')
    const chunks = chunkText(testText)
    console.log(`   Created ${chunks.length} chunks`)
    
    // Test embedding generation
    console.log('2. Testing embedding generation...')
    const embeddings = await embedChunks(chunks.slice(0, 2)) // Test with first 2 chunks
    console.log(`   Generated ${embeddings.length} embeddings (${embeddings[0]?.length} dimensions)`)
    
    // Test upsert
    console.log('3. Testing chunk upsert...')
    const testChunks = chunks.slice(0, 2).map((chunk, i) => ({
      source: 'test',
      sourceId: `test-${i}`,
      chunk
    }))
    await upsertChunks(testChunks)
    console.log('   ✅ Chunks upserted successfully')
    
    // Test search
    console.log('4. Testing similarity search...')
    const results = await searchChunks('HTML elements and CSS styling', 3)
    console.log(`   Found ${results.length} similar chunks`)
    
    console.log('✅ All vector tests passed!')
  } catch (error) {
    console.error('❌ Vector test failed:', error)
  }
}

testVectors()
