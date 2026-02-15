import OpenAI from 'openai';

// Next.js automatically loads environment variables from .env.local
// For standalone worker scripts, load dotenv at the top of the worker file instead

let openaiClient: OpenAI | null = null;

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY. Set it in .env.local (or export it in your shell before running workers).'
    );
  }

  return new OpenAI({ apiKey });
}

// Lazy proxy avoids import-time crashes when env vars load later in worker startup.
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    if (!openaiClient) {
      openaiClient = createOpenAIClient();
    }

    return Reflect.get(openaiClient as object, prop, receiver);
  },
}) as OpenAI;
