import OpenAI from 'openai';
import type { LLMProvider, CompletionRequest, CompletionResponse } from './types.js';
import { getApiKey } from './config.js';

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export class NimProvider implements LLMProvider {
  readonly name = 'nim' as const;

  private client(): OpenAI {
    const apiKey = getApiKey('nim');
    if (!apiKey)
      throw new Error('NVIDIA NIM API key not configured. Run: aiwb config set nim.apiKey <key>');
    return new OpenAI({ apiKey, baseURL: NIM_BASE_URL });
  }

  isConfigured(): boolean {
    return !!getApiKey('nim');
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const client = this.client();
    const start = Date.now();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const m of request.messages) {
      if (m.role === 'tool') {
        messages.push({ role: 'tool', tool_call_id: m.toolCallId, content: m.content });
      } else {
        messages.push({ role: m.role, content: m.content });
      }
    }

    const response = await client.chat.completions.create({
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });

    const choice = response.choices[0];
    if (!choice) throw new Error('NIM returned no choices');

    return {
      content: choice.message.content ?? '',
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      durationMs: Date.now() - start,
      model: response.model,
      provider: 'nim',
    };
  }
}
