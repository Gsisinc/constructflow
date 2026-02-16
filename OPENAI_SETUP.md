# OpenAI API Setup Guide

## Overview
The Constructflow application uses OpenAI's API to power the AI agents. This guide explains how to set up and configure the API key.

## Prerequisites
- OpenAI API account (https://platform.openai.com)
- Valid API key with GPT-4 access
- Node.js and npm installed

## Setup Instructions

### Step 1: Add API Key to Environment
1. Create a `.env` file in the project root directory:
   ```
   /constructflow/.env
   ```

2. Add the following line with your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=sk-proj-YOUR_API_KEY_HERE
   ```

3. (Optional) Add provider priority configuration:
   ```
   VITE_AI_PROVIDER_PRIORITY=openai,deepseek
   ```

### Step 2: Verify Configuration
The application will automatically detect the API key from the `.env` file during startup.

### Step 3: Test the Setup
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Agents page
3. Open any agent (e.g., Central Orchestrator)
4. Click "Chat Now"
5. Type a test message
6. You should receive a response from OpenAI

## Configuration Details

### Environment Variables
- `VITE_OPENAI_API_KEY` - Your OpenAI API key (required)
- `VITE_AI_PROVIDER_PRIORITY` - Comma-separated list of LLM providers (optional, default: openai)

### File Locations
- `.env` - Your actual API key (not committed to Git)
- `.env.example` - Template for environment variables (safe to commit)

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to Git
- Never share your API key
- The `.env` file is already in `.gitignore`
- For production, use environment variables in your deployment platform (Vercel, Netlify, etc.)

## Troubleshooting

### "OpenAI API key not configured" Error
- Ensure `.env` file exists in project root
- Verify the key starts with `sk-proj-`
- Restart the development server after adding the key

### "Authentication failed" Error
- Check that the API key is valid
- Verify the key has GPT-4 access
- Ensure no extra spaces in the `.env` file

### "Rate limit exceeded" Error
- Your OpenAI account has hit rate limits
- Wait a few minutes before retrying
- Consider upgrading your OpenAI plan

### Empty Responses from Agents
- Check browser console for errors
- Verify API key is set correctly
- Ensure OpenAI API is accessible from your network

## API Usage

The application uses the following OpenAI API endpoint:
- **URL:** `https://api.openai.com/v1/chat/completions`
- **Model:** `gpt-4-mini` (fast and cost-effective)
- **Temperature:** 0.7 (balanced creativity and consistency)
- **Max Tokens:** 2000 (maximum response length)

## Cost Estimation

OpenAI API usage is charged per token:
- **Input tokens:** Approximately $0.0003 per 1K tokens
- **Output tokens:** Approximately $0.0006 per 1K tokens

For typical agent interactions (500 input + 500 output tokens):
- Cost per interaction: ~$0.00045
- 1000 interactions: ~$0.45

## Services Using OpenAI API

The following services use the OpenAI API key:

1. **llmService.js** - Core LLM communication
   - `callOpenAI()` - Direct OpenAI API calls
   - `callAgent()` - Agent-specific responses
   - `streamAgent()` - Streaming responses (if supported)

2. **AgentChat.jsx** - AI agent chat interface
   - Uses `callAgent()` from llmService
   - Handles user messages and agent responses

3. **bidDocumentAnalysisService.js** - Bid document analysis
   - Uses API key for analyzing RFPs

## Supported AI Agents

All 10 AI agents can now use OpenAI API:
1. Central Orchestrator
2. Market Intelligence
3. Bid Package Assembly
4. Proposal Generation
5. Regulatory Intelligence
6. Risk Prediction
7. Quality Assurance
8. Safety Compliance
9. Sustainability Optimization
10. Stakeholder Communication

## Advanced Configuration

### Using Different OpenAI Models
To use a different model, modify `src/services/llmService.js`:
```javascript
model: 'gpt-4-turbo'  // Instead of 'gpt-4-mini'
```

### Custom Temperature Settings
Modify agent calls in `src/components/agents/AgentChat.jsx`:
```javascript
const response = await callAgent(systemPrompt, messageText, {
  temperature: 0.9,  // More creative (0-1)
  maxTokens: 3000
});
```

## Production Deployment

### Vercel
1. Go to project settings
2. Add environment variable: `VITE_OPENAI_API_KEY`
3. Paste your API key
4. Redeploy

### Netlify
1. Go to Site settings → Build & deploy → Environment
2. Add new variable: `VITE_OPENAI_API_KEY`
3. Paste your API key
4. Trigger redeploy

### Docker/Server
Set environment variable before running:
```bash
export VITE_OPENAI_API_KEY=sk-proj-...
npm run build
npm run preview
```

## Support & Resources

- OpenAI Documentation: https://platform.openai.com/docs
- API Status: https://status.openai.com
- Community Forum: https://community.openai.com

## Next Steps

1. Set up your API key in `.env`
2. Test the agents by sending messages
3. Monitor API usage in OpenAI dashboard
4. Adjust temperature and token settings as needed
5. Deploy to production with environment variables

---

**Last Updated:** February 16, 2026  
**Status:** ✅ Production Ready
