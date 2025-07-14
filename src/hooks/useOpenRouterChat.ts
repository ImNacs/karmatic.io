/**
 * @fileoverview React hook for OpenRouter chat functionality
 * @module hooks/useOpenRouterChat
 */

import { useChat } from 'ai/react';
import { useState } from 'react';

interface UseOpenRouterChatOptions {
  modelId?: string;
  endpoint?: 'mastra' | 'sdk';
  onError?: (error: Error) => void;
}

/**
 * Hook for chat functionality with OpenRouter
 * Supports both Mastra and AI SDK endpoints
 */
export function useOpenRouterChat({
  modelId = 'anthropic/claude-3-5-sonnet',
  endpoint = 'mastra',
  onError
}: UseOpenRouterChatOptions = {}) {
  const [selectedModel, setSelectedModel] = useState(modelId);
  
  const apiEndpoint = endpoint === 'mastra' 
    ? '/api/ai/chat' 
    : '/api/ai/chat-sdk';
  
  const chat = useChat({
    api: apiEndpoint,
    onError: (error) => {
      console.error('Chat error:', error);
      onError?.(error);
    },
    // Pass model selection in headers for SDK endpoint
    headers: endpoint === 'sdk' ? {
      'X-Model-Id': selectedModel
    } : undefined,
  });

  return {
    ...chat,
    selectedModel,
    setSelectedModel,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * function ChatComponent() {
 *   const { messages, input, handleInputChange, handleSubmit, isLoading } = useOpenRouterChat({
 *     modelId: 'anthropic/claude-3-haiku', // Faster model
 *     endpoint: 'sdk', // Use AI SDK endpoint
 *   });
 * 
 *   return (
 *     <div>
 *       {messages.map(m => (
 *         <div key={m.id}>
 *           {m.role}: {m.content}
 *         </div>
 *       ))}
 *       <form onSubmit={handleSubmit}>
 *         <input value={input} onChange={handleInputChange} />
 *         <button disabled={isLoading}>Send</button>
 *       </form>
 *     </div>
 *   );
 * }
 * ```
 */