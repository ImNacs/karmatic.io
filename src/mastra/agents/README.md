# 🤖 Mastra AI Agents

This directory contains the AI agent configurations for Karmatic using the Mastra framework.

## 📋 Current Setup

### basic.ts
The minimal agent configuration for getting started with Mastra.

```typescript
import { Agent } from "@mastra/core";

export const basicAgent = new Agent({
  name: "Basic Assistant",
  description: "A simple helpful assistant powered by OpenRouter",
  instructions: "You are a helpful assistant. Answer questions concisely and accurately.",
  model: {
    provider: "OPENROUTER",
    name: "anthropic/claude-3-5-sonnet",
  },
});
```

## 🛠️ Configuration

The agent is configured to use OpenRouter, which provides access to multiple AI models through a single API. You can change the model by setting the `AI_MODEL` environment variable:

```bash
# In your .env file
AI_MODEL=moonshotai/kimi-k2  # Default
```

### Available Models

#### Premium Models
- `moonshotai/kimi-k2` - **Default** - Best for agentic tasks, 128K context ($0.57/1M in, $2.30/1M out)
- `anthropic/claude-3-5-sonnet` - Best for general conversation ($3/1M in, $15/1M out)
- `openai/gpt-4-turbo-preview` - Latest GPT-4, versatile

#### Fast & Affordable
- `anthropic/claude-3-haiku` - Very fast, good quality
- `openai/gpt-3.5-turbo` - Fast and cost-effective

#### Open Source
- `google/gemini-pro` - Google's model with free tier
- `meta-llama/llama-3-70b-instruct` - Open source alternative

### Model Comparison

| Model | Context | Agentic Tasks | Speed | Cost |
|-------|---------|---------------|-------|------|
| Kimi K2 | 128K | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Claude 3.5 Sonnet | 200K | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| GPT-4 Turbo | 128K | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Claude 3 Haiku | 200K | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🚀 Usage

The agent is automatically registered with Mastra and can be accessed through the API:

```typescript
// In API routes
import { mastra } from '@/mastra';

const agent = mastra.getAgent('basic');
const response = await agent.generate(messages);
```

## 📦 Adding Tools

To extend the agent with custom tools:

```typescript
import { createTool } from "@mastra/core";

const searchTool = createTool({
  name: "search",
  description: "Search for information",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // Tool implementation
    return { results: [] };
  },
});

// Add to agent
export const basicAgent = new Agent({
  // ... existing config
  tools: {
    search: searchTool,
  },
});
```

## 🔗 Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

**Last updated**: July 2025