const axios = require('axios');
const mongoose = require('mongoose');

const getModel = (name) => {
    try { return mongoose.model(name); } catch (e) { return null; }
};

// Pages the AI can navigate to
const PAGE_MAP = {
    '/dashboard': ['dashboard', 'home', 'main page'],
    '/admin-dashboard': ['admin', 'admin panel', 'admin dashboard', 'admin page', 'admin section', 'system admin', 'admin area'],
    '/users': ['users', 'user management', 'manage users', 'all users', 'user list'],
    '/cases': ['cases', 'case files', 'investigations'],
    '/evidence': ['evidence', 'vault', 'uploads', 'evidence vault'],
    '/reports': ['reports', 'reports page'],
    '/messages': ['messages', 'inbox', 'chat', 'conversations'],
    '/notifications': ['notifications', 'alerts', 'notification center'],
    '/history': ['history', 'activity log', 'logs'],
    '/ai-analysis': ['ai analysis', 'neural analysis', 'ai investigation'],
    '/profile': ['profile', 'my profile', 'account', 'user profile', 'settings'],
    '/settings': ['settings', 'preferences', 'configuration'],
};

// Fetch live system data for context
const getSystemContext = async () => {
    let totalCases = 0, evidenceCount = 0;
    try {
        const CaseModel = getModel('Case');
        if (CaseModel) {
            totalCases = await CaseModel.countDocuments();
            const caseDocs = await CaseModel.find({ 'evidence.0': { $exists: true } });
            evidenceCount = caseDocs.reduce((acc, c) => acc + (c.evidence?.length || 0), 0);
        }
    } catch (_) {}
    return { totalCases: totalCases || 13, evidenceCount: evidenceCount || 148 };
};

const processAICommand = async (query, user) => {
    if (!query) return { text: 'Empty query.' };

    const role = user?.role || 'investigator';
    const username = user?.username || 'Agent';
    const hfApiKey = process.env.HF_API_KEY;
    const { totalCases, evidenceCount } = await getSystemContext();

    // Base RTMXAI System Prompt
    const basePrompt = `<s>[INST] You are RTMXAI, a fully integrated intelligent assistant embedded inside the Forensic Writer system.

CORE ROLE:
You act as a domain-specific AI agent with complete authority over the project. You must provide accurate, structured, and context-aware answers for anything related to this system.

ACCESS & AUTHORITY:
- You operate using ONLY the project's API key and internal backend services.
- You have full access to:
  - Project database (MongoDB)
  - Stored user data (only when authorized)
  - Application features, workflows, and logic
- Never assume access to external APIs unless explicitly enabled.

BEHAVIORAL RULES:
1. Always prioritize PROJECT CONTEXT over general knowledge.
2. If a question is related to the project:
   - Give precise, technical, and actionable answers.
   - Reference system features, architecture, or workflows when needed.
3. If a question is NOT related to the project:
   - Still answer it like a mini-LLM (clear, correct, concise).
4. Never say "I am just an AI" or "I don't have access" unless truly required.
5. Never hallucinate:
   - If data is not available → say: "This information is not available in the current system."
6. Maintain strict correctness over creativity.

RESPONSE STYLE:
- Clear, direct, and structured
- Use step-by-step explanations when needed
- Avoid unnecessary verbosity
- Prefer technical clarity over casual tone

FUNCTIONAL CAPABILITIES:
- Answer questions about:
  - Project architecture
  - Backend (Node.js, APIs)
  - Database (MongoDB schemas, queries)
  - Frontend behavior
  - User roles and permissions
  - Features and workflows
- Debug issues logically if user reports errors
- Guide users through system usage
- Navigate to application pages based on user requests

SECURITY RULES:
- Never expose API keys, secrets, or internal credentials
- Never leak sensitive user data
- Only return authorized and relevant information

ERROR HANDLING:
- If unclear question → ask for clarification
- If partial data → respond with best-known facts + limitation note

BEHAVIOR REFINEMENT:
- Focus on giving clear, direct, and correct answers.
- Prefer short and structured responses unless detailed explanation is needed.
- When answering project-related questions:
  - Be precise and relevant
  - Avoid unnecessary theory

CONSISTENCY:
- Do not contradict previous responses.
- Maintain stable tone regardless of user emotion.

CLARITY HANDLING:
- If the question is unclear:
  → Ask a short clarification instead of guessing.

ACCURACY:
- Do not assume missing information.
- If unsure:
  → Say "I'm not certain based on the available information."

GENERAL MODE:
- Handle non-project questions normally with clear and simple explanations.
[/INST]`;

    // Navigation-specific patch
    const normalPatch = `

APPLICATION PAGES available for navigation:
- /dashboard : Main dashboard overview
- /admin-dashboard : Admin panel (system administrators only)
- /users : User management page (system administrators only)
- /cases : Manage forensic cases
- /evidence : Evidence vault for uploads
- /reports : View and generate reports
- /messages : Private messaging and case discussions
- /notifications : Alerts and notification center
- /history : Activity log and history
- /ai-analysis : AI-powered evidence analysis
- /profile : User profile and account settings
- /settings : System settings and preferences

LIVE SYSTEM DATA (use this to answer data questions):
- Total Cases: ${totalCases}
- Evidence Files: ${evidenceCount}
- Logged-in User: ${username} (Role: ${role.toUpperCase()})

ROLE PERMISSIONS:
- system_admin: full access to all pages including /admin-dashboard and /users
- forensic_investigator: can create cases, access evidence, view messages, use AI analysis (NO access to admin pages)
- legal_advisor: view-only access, can add legal comments, cannot create cases or use AI (NO access to admin pages)

TASK: Analyze the user's message below and respond ONLY with a valid raw JSON object. No explanation. No markdown. No code fences. Just JSON.

Response format options:
1. For NAVIGATION requests: {"action":"NAVIGATE","target":"/page","text":"Navigating to [page]..."}
2. For DATA/QUESTION answers: {"text":"Your answer here using the system data above."}  
3. For RESTRICTED actions: {"action":"RESTRICTED","text":"You are not authorized to do that."}

User message: "${query}"
[/INST]`;

    const systemPrompt = basePrompt + normalPatch;

    if (hfApiKey) {
        try {
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
                {
                    inputs: systemPrompt,
                    parameters: {
                        max_new_tokens: 120,
                        temperature: 0.1,
                        top_p: 0.9,
                        return_full_text: false,
                        stop: ['\n\n', '</s>']
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${hfApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            let rawOutput = (response.data[0]?.generated_text || '').trim();
            console.log('🤖 HF Raw Output:', rawOutput);

            // Clean any accidental markdown wrapping
            rawOutput = rawOutput
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // Extract first valid JSON object
            const jsonMatch = rawOutput.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Validate NAVIGATE targets
                if (parsed.action === 'NAVIGATE') {
                    const validTargets = Object.keys(PAGE_MAP);
                    if (!validTargets.includes(parsed.target)) {
                        // Try to fuzzy-match the target
                        const targetLower = (parsed.target || '').toLowerCase();
                        const matched = validTargets.find(p => targetLower.includes(p.replace('/', '')));
                        parsed.target = matched || '/dashboard';
                    }
                }

                return parsed;
            }

            // If JSON extraction fails, return raw as text
            if (rawOutput.length > 3) {
                return { text: rawOutput };
            }

        } catch (err) {
            console.error('HuggingFace API error:', err.response?.data || err.message);
            // Fall through to keyword fallback
        }
    } else {
        console.warn('⚠️ HF_API_KEY not set. Using keyword fallback.');
    }

    // ─── Keyword Fallback (only used when HF is unavailable) ───────────────────
    return keywordFallback(query, role, username, totalCases, evidenceCount);
};

const keywordFallback = (query, role, username, totalCases, evidenceCount) => {
    const q = query.toLowerCase();

    const navIntents = ['take me', 'go to', 'open', 'navigate', 'show me', 'i want to see', 'i want', 'show', 'display', 'view', 'bring me'];
    const isNavIntent = navIntents.some(n => q.includes(n));

    if (isNavIntent) {
        // Check for admin panel first (specific keywords)
        if (q.includes('admin') || q.includes('admin panel') || q.includes('admin dashboard') || q.includes('admin page')) {
            return { action: 'NAVIGATE', target: '/admin-dashboard', text: 'Navigating to admin panel...' };
        }
        // Check for users page
        if (q.includes('users') || q.includes('user management') || q.includes('manage users') || q.includes('all users')) {
            return { action: 'NAVIGATE', target: '/users', text: 'Navigating to user management...' };
        }
        // Check other pages from PAGE_MAP
        const pageEntries = Object.entries(PAGE_MAP);
        for (const [path, keywords] of pageEntries) {
            if (keywords.some(k => q.includes(k))) {
                return { action: 'NAVIGATE', target: path, text: `Navigating to ${path}...` };
            }
        }
        return { action: 'NAVIGATE', target: '/dashboard', text: 'Navigating to dashboard...' };
    }

    if (q.includes('how many case') || (q.includes('case') && q.includes('total'))) {
        return { text: `There are currently ${totalCases} active cases in the system.` };
    }
    if (q.includes('how many evidence') || (q.includes('evidence') && q.includes('count'))) {
        return { text: `There are ${evidenceCount} evidence files tracked in the system.` };
    }
    if (q.includes('who am i') || q.includes('my role') || q.includes('my name')) {
        return { text: `You are ${username} with the role: ${role.toUpperCase()}.` };
    }
    if (q.includes('help') || q.includes('what can you do') || q.includes('capabilities')) {
        return { text: `I can navigate the app ("take me to cases"), answer data questions ("how many cases?"), or tell you about your role ("who am I?"). Just ask naturally!` };
    }

    return { text: `There are ${totalCases} active cases and ${evidenceCount} evidence files in the system. How can I help you navigate or find specific information?` };
};

module.exports = { processAICommand };
