import Content from '../models/Content.js'
import Group from '../models/Group.js'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY environment variable. Set OPENROUTER_API_KEY in your secrets manager.');
}
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions' 

// Study jokes collection
const studyJokes = [
  "Why did the student bring a ladder to class? Because the assignment was high level! 📚😄",
  "Debugging: removing needles from haystacks one print statement at a time. 🪲🔍",
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛💡",
  "I told my computer I needed a break, and now it won't stop sending me Kit-Kat ads. 🍫💻",
  "Why was the math book sad? It had too many problems! 📖😢",
  "Focus tip: Tab-switch squats burn 0 calories. Stay focused instead! 💪🎯",
  "Why did the student eat their homework? Because their teacher told them it was a piece of cake! 🎂📝",
  "A SQL query walks into a bar, walks up to two tables and asks 'Can I join you?' 🍺👨‍💻",
  "There are only 10 types of people: those who understand binary and those who don't! 🤓",
  "Why do Java developers wear glasses? Because they can't C#! 👓☕"
]

// Motivational quotes
const motivations = [
  "🌟 You're doing amazing! Every page you read is a step toward your dreams!",
  "💪 Stay focused! Small progress is still progress!",
  "🎯 Remember why you started. You've got this!",
  "🚀 Learning is a superpower, and you're becoming unstoppable!",
  "📚 Difficult roads lead to beautiful destinations. Keep going!",
  "✨ Your future self will thank you for studying today!",
  "🔥 Champions are made in the moments when no one is watching!",
  "🌈 Every expert was once a beginner. You're on the right path!",
  "💡 Knowledge is the only treasure that grows when you share it!",
  "🏆 Success is the sum of small efforts repeated day in and day out!"
]

// Website help responses
const websiteHelp = {
  general: `🎯 **Welcome to FocusUp!**

FocusUp is your digital balance companion for focused studying. Here's what you can do:

📚 **Learn Section** - Store and access your study materials
👥 **Groups** - Join study groups and share resources
⏱️ **Focus Timer** - Track study sessions with distraction monitoring
📊 **Analytics** - View your focus scores and study patterns
🔍 **Search** - Find users and groups to study with

What would you like to know more about? Just ask! 😊`,

  learn: `📚 **How to Use the Learn Section:**

1️⃣ **Upload PDFs** - Click "Upload PDF" and select your file
2️⃣ **Add YouTube Links** - Paste any YouTube tutorial URL

**Starting a Focus Session:**
1. Set your target time (in minutes)
2. Click "Open & start focus" on any material
3. Stay focused - the timer tracks your activity!
4. Your focus score improves with consistent study 📈

💡 Tip: Materials stay in your browser, so keep them organized!`,

  groups: `👥 **How to Use Groups:**

**Creating a Group:**
1. Go to Groups page
2. Click "Create Group"
3. Share your unique group code with friends

**Joining a Group:**
1. Get the 8-character group code from a friend
2. Click "Join Group" and enter the code
3. You're in! Start sharing resources 🎉

**Sharing Resources:**
- Add PDFs, YouTube links, or other study materials
- All members can access shared materials
- Compete on the focus score leaderboard! 🏆`,

  timer: `⏱️ **How the Focus Timer Works:**

1️⃣ **Set Target Time** - Choose how long you want to study
2️⃣ **Start Session** - Click "Open & start focus" on any material
3️⃣ **Stay Focused** - The timer tracks:
   - ✅ Active study time
   - ⚠️ Tab switches (minimize these!)
   - 😴 Idle time

**Focus Score Calculation:**
- Completing sessions = Higher score ⬆️
- Tab switches = Penalty ⬇️
- Idle time = Small penalty ⬇️

💡 Tip: Try the Pomodoro method - 25 min study, 5 min break!`,

  analytics: `📊 **Understanding Analytics:**

**Focus Score** - Your overall study effectiveness (0-100+)
**Streak** - Consecutive days with completed sessions 🔥
**Study Patterns** - See when you study best

**Improving Your Score:**
1. Complete full sessions without stopping early
2. Minimize tab switches during study
3. Stay active (move mouse, scroll, type)
4. Study consistently to build streaks

💡 Tip: Check analytics weekly to see your progress!`,

  search: `🔍 **Using Search:**

**Find Users:**
- Search by username to find study buddies
- View their public focus scores
- Connect through groups

**Find Groups:**
- Browse public study groups
- Join groups matching your subjects
- Discover new study resources

💡 Tip: Make your profile public to help others find you!`,

  helpbot: `🤖 **How to Use AI Study Buddy (Me!):**

**I can help you with:**
📚 **Find Materials** - "Do I have any Python tutorials?"
💡 **Explain Topics** - "Explain recursion to me"
🔍 **Search** - "Find JavaScript in my library"
😄 **Jokes** - "Tell me a funny joke"
💪 **Motivation** - "I need motivation to study"
❓ **Help** - "How do I use FocusUp?"

**Quick Actions:**
Use the buttons below the chat for quick access to jokes, motivation, and help!

💡 Tip: When I find materials, click on them to open directly!`
}

// Check if message is asking about website help
const getWebsiteHelpResponse = (message) => {
  const lower = message.toLowerCase()
  
  // Check for specific feature questions
  if (lower.includes('learn') && (lower.includes('how') || lower.includes('use') || lower.includes('what'))) {
    return websiteHelp.learn
  }
  if ((lower.includes('group') || lower.includes('join') || lower.includes('create group')) && 
      (lower.includes('how') || lower.includes('use') || lower.includes('what'))) {
    return websiteHelp.groups
  }
  if ((lower.includes('timer') || lower.includes('focus session') || lower.includes('pomodoro')) && 
      (lower.includes('how') || lower.includes('use') || lower.includes('what') || lower.includes('work'))) {
    return websiteHelp.timer
  }
  if ((lower.includes('analytics') || lower.includes('score') || lower.includes('streak')) && 
      (lower.includes('how') || lower.includes('use') || lower.includes('what') || lower.includes('work'))) {
    return websiteHelp.analytics
  }
  if (lower.includes('search') && (lower.includes('how') || lower.includes('use') || lower.includes('find user'))) {
    return websiteHelp.search
  }
  if ((lower.includes('helpbot') || lower.includes('study buddy') || lower.includes('ai help') || lower.includes('bot')) && 
      (lower.includes('how') || lower.includes('use') || lower.includes('what can'))) {
    return websiteHelp.helpbot
  }
  
  // General help questions
  if (lower.includes('how') && (lower.includes('use') || lower.includes('work')) && 
      (lower.includes('focusup') || lower.includes('website') || lower.includes('app') || lower.includes('this'))) {
    return websiteHelp.general
  }
  if (lower.includes('help') && (lower.includes('me') || lower.includes('need') || lower.includes('please'))) {
    return websiteHelp.general
  }
  if (lower.includes('what') && (lower.includes('can') || lower.includes('do')) && 
      (lower.includes('here') || lower.includes('this') || lower.includes('focusup'))) {
    return websiteHelp.general
  }
  if (lower.includes('feature') || lower.includes('tutorial') && lower.includes('focusup')) {
    return websiteHelp.general
  }
  
  return null
}

// Build system prompt for the AI
const buildSystemPrompt = (materials, sessionContext) => {
  return `You are FocusUp AI Study Buddy - an intelligent, friendly AI assistant similar to ChatGPT. You help students with ANY question they have.

YOUR PERSONALITY:
- Be friendly, helpful, and encouraging 🎯
- Use emojis appropriately to make responses engaging
- Explain concepts clearly with examples
- Be thorough but concise in your answers
- Crack jokes when asked (be genuinely funny!)
- Provide motivation when users seem tired

WHAT YOU CAN DO:
1. **EXPLAIN ANY TOPIC** - Answer ANY educational question like ChatGPT does. Explain concepts, solve problems, teach subjects.
2. **SEARCH MATERIALS** - When user asks for their study materials, search the list below
3. **WEBSITE HELP** - Explain FocusUp features when asked
4. **MOTIVATION & JOKES** - Keep students energized and motivated!

ABOUT FOCUSUP (only mention when asked about the website):
- 📚 Learn Section: Store PDFs, YouTube tutorials, and study materials
- 👥 Groups: Join study groups, share resources, compete on leaderboards  
- ⏱️ Focus Timer: Track study sessions with distraction monitoring
- 📊 Analytics: View focus scores, streaks, study patterns

USER'S STUDY MATERIALS (only search when user asks for their materials):
${materials.length > 0 ? materials.map(m => `- "${m.title}" (${m.type}) - Location: ${m.location}`).join('\n') : 'No materials in library yet.'}

${sessionContext ? `CURRENT SESSION: User is studying "${sessionContext.contentTitle}" for ${sessionContext.targetMinutes} minutes.` : ''}

IMPORTANT GUIDELINES:
1. For educational questions (teach me, explain, what is, how does, etc.) - ALWAYS provide a helpful, detailed answer like ChatGPT would
2. For material searches (do I have, find my, where is my) - Search the materials list above
3. Use bullet points, numbered lists, and formatting for clarity
4. Include examples when explaining concepts
5. Be encouraging and supportive!

Remember: You're an intelligent AI tutor. Answer ANY question the student asks! 🎓`
}

// Parse AI response to extract material references
const parseAIResponse = (responseText, materials) => {
  let parsedMaterials = []
  let cleanText = responseText
  
  // Try to extract JSON materials block
  const jsonMatch = responseText.match(/\{"materials":\s*\[([\s\S]*?)\]\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      parsedMaterials = parsed.materials || []
      // Remove JSON from display text
      cleanText = responseText.replace(jsonMatch[0], '').trim()
    } catch (e) {
      console.log('Failed to parse materials JSON:', e)
    }
  }
  
  // If no JSON found, try to match materials mentioned in text
  if (parsedMaterials.length === 0) {
    materials.forEach(m => {
      if (responseText.toLowerCase().includes(m.title.toLowerCase())) {
        parsedMaterials.push({
          title: m.title,
          type: m.type,
          location: m.location,
          contentId: m.id,
          groupId: m.groupId
        })
      }
    })
  }
  
  return { text: cleanText || responseText, materials: parsedMaterials }
}

// Simple fuzzy/material search without external libraries
const searchMaterials = (query, materials, maxResults = 10) => {
  const tokens = (query || '')
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .slice(0, 12)

  if (tokens.length === 0) return []

  const scored = materials.map((m) => {
    const title = (m.title || '').toLowerCase()
    const desc = (m.description || '').toLowerCase()
    const tags = (m.tags || []).join(' ').toLowerCase()
    const url = (m.url || '').toLowerCase()
    const location = (m.location || '').toLowerCase()

    let score = 0

    tokens.forEach((t) => {
      if (!t) return
      if (title.includes(t)) score += 5
      if (title.startsWith(t)) score += 3
      if (desc.includes(t)) score += 2
      if (tags.includes(t)) score += 3
      if (url.includes(t)) score += 1
      if (location.includes(t)) score += 1
    })

    // small boost for exact phrase
    if (title === query.toLowerCase()) score += 6

    return { material: m, score }
  })

  const filtered = scored.filter(s => s.score > 0)
  filtered.sort((a, b) => b.score - a.score)
  return filtered.slice(0, maxResults).map(f => f.material)
}


// Main chat handler
export const chatWithAI = async (req, res) => {
  try {
    const { message, sessionContext, conversationHistory = [] } = req.body
    const userId = req.user._id
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      })
    }
    
    // Check for joke request
    if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('funny')) {
      const randomJoke = studyJokes[Math.floor(Math.random() * studyJokes.length)]
      return res.json({
        success: true,
        response: {
          text: randomJoke,
          materials: [],
          type: 'joke'
        }
      })
    }
    
    // Check for motivation request
    if (message.toLowerCase().includes('motivat') || message.toLowerCase().includes('tired') || 
        message.toLowerCase().includes('can\'t focus') || message.toLowerCase().includes('give up')) {
      const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)]
      return res.json({
        success: true,
        response: {
          text: randomMotivation,
          materials: [],
          type: 'motivation'
        }
      })
    }
    
    // Check for website help questions
    const helpResponse = getWebsiteHelpResponse(message)
    if (helpResponse) {
      return res.json({
        success: true,
        response: {
          text: helpResponse,
          materials: [],
          type: 'help'
        }
      })
    }
    
    // Fetch user's materials from library and groups
    const [userContents, userGroups] = await Promise.all([
      Content.find({ userId }).lean(),
      Group.find({ 'members.userId': userId }).lean()
    ])
    
    // Format materials for AI context
    const materials = []
    
    // Add library contents
    userContents.forEach(content => {
      materials.push({
        id: content._id.toString(),
        title: content.title,
        type: content.type === 'link' ? (content.url?.includes('youtube') ? 'youtube' : 'link') : content.type,
        url: content.url,
        description: content.description || '',
        tags: content.tags || [],
        location: 'Your Library',
        groupId: null
      })
    })
    
    // Add group resources
    userGroups.forEach(group => {
      (group.resources || []).forEach(resource => {
        materials.push({
          id: resource.id,
          title: resource.title,
          type: resource.type || 'link',
          url: resource.link,
          description: resource.description || '',
          tags: resource.tags || [],
          location: `Group: ${group.name}`,
          groupId: group._id.toString(),
          groupName: group.name
        })
      })
    })

    // If user intent looks like a materials search, run server-side fuzzy search first
    const searchIntentRegex = /\b(find|search|where is|do i have|looking for|i want|show me|any pdf|pdf on|youtube tutorial|tutorial|find me|where can i find)\b/i
    const isSearchIntent = searchIntentRegex.test(message)
    if (isSearchIntent) {
      const matches = searchMaterials(message, materials, 12)
      if (matches.length > 0) {
        const text = `📚 I found ${matches.length} material(s) matching your request:`
        return res.json({
          success: true,
          response: {
            text,
            materials: matches.map(m => ({
              title: m.title,
              type: m.type,
              location: m.location,
              description: m.description || '',
              tags: m.tags || [],
              url: m.url || '',
              contentId: m.id,
              groupId: m.groupId || null
            })),
            type: 'search'
          }
        })
      }
      // if no matches, let the LLM handle broader suggestions later
    }
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(materials, sessionContext)
    
    // Prepare messages for API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ]
    
    // Call OpenRouter API
    if (process.env.NODE_ENV !== 'production') {
      console.log('Calling OpenRouter API (message snippet):', (message || '').slice(0,200))
    }
    
    // Try multiple models in case one is rate limited
    const models = [
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ]
    
    let lastError = null
    let aiResponseText = null
    
    for (const model of models) {
      try {
        console.log('Trying model:', model)
        
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'FocusUp HelpBot'
          },
          body: JSON.stringify({
            model: model,
            messages,
            max_tokens: 2000,
            temperature: 0.7
          })
        })
        
        console.log('Response status for', model, ':', response.status)
        
        if (response.ok) {
          const data = await response.json()
          aiResponseText = data.choices?.[0]?.message?.content
          if (aiResponseText) {
            console.log('Success with model:', model)
            break
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.log('Model', model, 'failed:', errorData.error?.message || response.status)
          lastError = errorData
        }
      } catch (err) {
        console.log('Model', model, 'error:', err.message)
        lastError = err
      }
    }
    
    if (!aiResponseText) {
      console.error('All models failed. Last error:', lastError)
      return handleLocalSearch(message, materials, res)
    }
    
    // Parse response for material references
    const parsedResponse = parseAIResponse(aiResponseText, materials)
    
    res.json({
      success: true,
      response: {
        text: parsedResponse.text,
        materials: parsedResponse.materials,
        type: 'ai'
      }
    })
    
  } catch (error) {
    console.error('AI Chat Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process your request. Please try again.',
      error: error.message
    })
  }
}

// Fallback when API unavailable - try to give helpful response
const handleLocalSearch = (query, materials, res) => {
  const lower = query.toLowerCase()
  
  // Check if it's a material search query
  const isMaterialSearch = lower.includes('do i have') || lower.includes('find my') || 
    lower.includes('where is') || lower.includes('my materials') || lower.includes('my library') ||
    lower.includes('what materials') || lower.includes('show me my')
  
  if (isMaterialSearch) {
    const matches = materials.filter(m => 
      m.title.toLowerCase().includes(lower) || 
      m.type.toLowerCase().includes(lower) ||
      m.location.toLowerCase().includes(lower)
    )
    
    if (matches.length > 0) {
      const text = `📚 I found ${matches.length} matching material(s):\n\n${matches.map(m => 
        `• **${m.title}** (${m.type})\n  📍 Location: ${m.location}`
      ).join('\n\n')}\n\nClick on any material to start learning! 🎯`
      
      return res.json({
        success: true,
        response: {
          text,
          materials: matches.map(m => ({
            title: m.title,
            type: m.type,
            location: m.location,
            contentId: m.id,
            groupId: m.groupId
          })),
          type: 'search'
        }
      })
    }
    
    return res.json({
      success: true,
      response: {
        text: '📚 You don\'t have any materials in your library yet!\n\n**To add materials:**\n1. Go to the **Learn** section\n2. Upload PDFs or add YouTube links\n3. Come back and ask me to find them! 🎯',
        materials: [],
        type: 'search'
      }
    })
  }
  
  // For educational questions when API is down, give a helpful message
  return res.json({
    success: true,
    response: {
      text: `🤖 I'm having trouble connecting to my AI brain right now!\n\n**But I can still help you with:**\n• 😄 **Jokes** - Click the Joke button\n• 💪 **Motivation** - Click the Motivate button\n• ❓ **FocusUp Help** - Ask "How do I use FocusUp?"\n• 📚 **Your Materials** - Ask "What materials do I have?"\n\nPlease try your question again in a moment! 🙏`,
      materials: [],
      type: 'error'
    }
  })
}

// Get all user materials (for search suggestions)
export const getUserMaterials = async (req, res) => {
  try {
    const userId = req.user._id
    
    const [userContents, userGroups] = await Promise.all([
      Content.find({ userId }).select('title type url').lean(),
      Group.find({ 'members.userId': userId }).select('name resources').lean()
    ])
    
    const materials = []
    
    userContents.forEach(content => {
      materials.push({
        id: content._id.toString(),
        title: content.title,
        type: content.type,
        location: 'Library'
      })
    })
    
    userGroups.forEach(group => {
      (group.resources || []).forEach(resource => {
        materials.push({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          location: group.name,
          groupId: group._id.toString()
        })
      })
    })
    
    res.json({
      success: true,
      materials
    })
  } catch (error) {
    console.error('Get Materials Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials'
    })
  }
}
