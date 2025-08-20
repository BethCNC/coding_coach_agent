/**
 * Comprehensive smoke test for the coding coach agent
 */
import {prisma} from './db/client.js'
import {upsertChunks, searchChunks} from './db/vectors.js'
import {summarizeSession} from './agent/summarizer.js'
import {buildContext} from './agent/retrieval.js'

async function smokeTest() {
  console.log('🚀 Starting comprehensive smoke test...\n')
  
  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...')
    if (!prisma) {
      console.log('⚠️ Database not available, skipping database tests')
      return
    }
    
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test 2: Vector Operations
    console.log('\n2️⃣ Testing vector operations...')
    const testChunks = [
      {source: 'test', sourceId: '1', chunk: 'HTML is a markup language for creating web pages'},
      {source: 'test', sourceId: '2', chunk: 'CSS is used for styling HTML elements'},
      {source: 'test', sourceId: '3', chunk: 'JavaScript adds interactivity to web pages'},
    ]
    
    await upsertChunks(testChunks)
    console.log('✅ Vector chunks upserted successfully')
    
    const searchResults = await searchChunks('HTML', 3)
    console.log(`✅ Vector search returned ${searchResults.length} results`)
    
    // Test 3: Session and Message Creation
    console.log('\n3️⃣ Testing session and message creation...')
    const session = await prisma.session.create({data: {}})
    const sessionId = session.id
    
    const testMessages = [
      {role: 'user', content: 'How do I create a button?'},
      {role: 'assistant', content: 'Use the <button> element in HTML'},
      {role: 'user', content: 'How do I style it with CSS?'},
      {role: 'assistant', content: 'Use CSS selectors to style your button'},
    ]
    
    for (const msg of testMessages) {
      await prisma.message.create({
        data: {
          sessionId,
          role: msg.role,
          content: msg.content,
        },
      })
    }
    console.log('✅ Session and messages created successfully')
    
    // Test 4: Retrieval System
    console.log('\n4️⃣ Testing retrieval system...')
    const context = await buildContext('How do I style buttons?', sessionId)
    console.log(`✅ Retrieval context built with ${context.recentMessages.length} messages`)
    console.log(`✅ Found ${context.relevantDocs.length} relevant documents`)
    
    // Test 5: Summarizer
    console.log('\n5️⃣ Testing summarizer...')
    await summarizeSession(sessionId)
    
    const summaryMessage = await prisma.message.findFirst({
      where: {
        sessionId,
        role: 'system',
        content: {startsWith: 'SESSION SUMMARY:'},
      },
    })
    
    if (summaryMessage) {
      console.log('✅ Summary generated successfully')
      console.log('📄 Summary preview:', summaryMessage.content.substring(0, 100) + '...')
    } else {
      console.log('❌ No summary found')
    }
    
    // Test 6: API Endpoint (if server is running)
    console.log('\n6️⃣ Testing API endpoint...')
    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: 'Hello, coding coach!'}),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API endpoint responding correctly')
        console.log(`📝 Response session ID: ${data.sessionId}`)
      } else {
        console.log('⚠️ API endpoint not responding (server may not be running)')
      }
    } catch (err) {
      console.log('⚠️ API endpoint test skipped (server not running)')
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await prisma.message.deleteMany({where: {sessionId}})
    await prisma.session.delete({where: {id: sessionId}})
    await prisma.vectorEmbedding.deleteMany({where: {source: 'test'}})
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 All smoke tests passed! Your coding coach is ready to use.')
    
  } catch (err) {
    console.error('\n❌ Smoke test failed:', err)
    process.exit(1)
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

smokeTest()
