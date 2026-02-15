import OpenAI from 'openai';

// Next.js automatically loads environment variables from .env.local
// For standalone worker scripts, load dotenv at the top of the worker file instead
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
