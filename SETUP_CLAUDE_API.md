# Setup Claude API for Animation Generation

## Quick Setup

The animation generation now uses **Claude (Anthropic API)** instead of OpenAI for better code generation!

---

## Get Your Claude API Key

### Option 1: Use Existing Key (If you have one)
If you already have an Anthropic API key, skip to "Add to Environment".

### Option 2: Create New Key
1. Go to https://console.anthropic.com
2. Sign in or create account
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy your key (starts with `sk-ant-...`)

---

## Add to Environment

Add this line to your `.env.local` file:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Your `.env.local` should now have:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI (for transcription)
OPENAI_API_KEY=sk-proj-...

# Anthropic (for animation generation)
ANTHROPIC_API_KEY=sk-ant-...

# Zoom (optional)
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
```

---

## Restart Server

After adding the key:

```bash
# The dev server will auto-reload, but if not:
# Stop server (Ctrl+C) and restart:
npm run dev
```

---

## Test It

Visit http://localhost:3001/test-animation and try generating an animation!

---

## Why Claude?

- ✅ **Better at following templates** - Understands structured patterns
- ✅ **More reliable code generation** - Fewer syntax errors
- ✅ **Follows constraints better** - Keeps code minimal
- ✅ **Great with instructions** - Respects the template guidelines

---

## Cost Comparison

**Claude Sonnet 3.5:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- ~$0.01-0.02 per animation

**OpenAI GPT-4:**
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens
- ~$0.03-0.05 per animation

**Claude is cheaper and better for this use case!** 💰

---

## Troubleshooting

**Error: "API key not found"**
- Make sure you added `ANTHROPIC_API_KEY=...` to `.env.local`
- Check there are no quotes around the key
- Restart dev server

**Error: "Invalid API key"**
- Verify key starts with `sk-ant-`
- Check you copied the full key
- Regenerate key in Anthropic Console if needed

---

Ready to test? Add your key and visit http://localhost:3001/test-animation! 🎬
