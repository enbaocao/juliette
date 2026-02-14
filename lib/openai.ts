import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local if not already loaded (for worker scripts)
if (!process.env.OPENAI_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
