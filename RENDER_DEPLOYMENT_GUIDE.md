# 🚀 Manim API - Render Deployment Guide

## What We Created

✅ **Complete Docker setup for Manim Animation API on Render**

### Files Created:
1. `docker/manim-api.Dockerfile` - Multi-stage Docker build with Manim + Node.js
2. `docker/manim-api-server.ts` - Express server wrapping Manim functionality
3. `docker/.dockerignore` - Optimizes Docker build

### Files Modified:
4. `utils/manim-executor.ts` - Now uploads videos to Supabase Storage (critical for Render's ephemeral filesystem)
5. `app/api/generate-animation/route.ts` - Proxies to Render in production, runs locally in dev
6. `.env.local.example` - Added Render environment variables

---

## 🎯 What You Need to Do

### Step 1: Ensure Supabase Storage Bucket Exists

The Manim executor now uploads videos to Supabase Storage. You need a bucket called `videos`:

1. Go to your Supabase project dashboard
2. Navigate to **Storage**
3. Create a new bucket named `videos` if it doesn't exist
4. Make the bucket **public** (so video URLs work without authentication)
   - Click on the bucket → Settings → Make Public

### Step 2: Test Locally (Optional but Recommended)

Before deploying to Render, test the Docker setup locally:

```bash
# From the project root
cd /Users/jayuk/Projects/julliette/juliette

# Build the Docker image
docker build -f docker/manim-api.Dockerfile -t juliette-manim-api .

# Run the container
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key_here \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e NODE_ENV=development \
  juliette-manim-api
```

Test it:
```bash
# Health check
curl http://localhost:3001/health

# Generate animation
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{"context":"Show a circle transforming into a square","duration":10}'
```

### Step 3: Deploy to Render

#### Option A: Using Render Dashboard (Easiest)

1. Go to [render.com](https://render.com) and sign up/login

2. Click **"New +"** → **"Web Service"**

3. **Connect your GitHub repository:**
   - Connect your GitHub account
   - Select the `julliette/juliette` repository

4. **Configure the service:**
   - **Name:** `juliette-manim-api`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main` (or your current branch)
   - **Root Directory:** Leave empty (uses repo root)
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `docker/manim-api.Dockerfile`
   - **Docker Context:** `.` (current directory)

5. **Instance Type:**
   - **Plan:** Standard ($25/mo)
   - Why: Manim rendering is CPU-intensive, needs at least 2 cores

6. **Environment Variables** - Add these:
   ```
   ANTHROPIC_API_KEY = your_anthropic_key_here
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
   NODE_ENV = production
   PORT = 3001
   RENDER_API_SECRET = [Generate a random secret - see below]
   ```

   **To generate RENDER_API_SECRET:**
   ```bash
   # In your terminal
   openssl rand -hex 32
   ```
   Copy the output and use it as the secret.

7. **Auto-Deploy:**
   - Enable "Auto-Deploy" so it redeploys on git push

8. Click **"Create Web Service"**

9. Wait for deployment (takes 5-10 minutes for first build)

10. Once deployed, copy the service URL (e.g., `https://juliette-manim-api.onrender.com`)

#### Option B: Using render.yaml (Advanced)

Create this file at the project root:

```yaml
# render.yaml
services:
  - type: web
    name: juliette-manim-api
    runtime: docker
    dockerfilePath: ./docker/manim-api.Dockerfile
    dockerContext: .
    region: oregon
    plan: standard
    scaling:
      minInstances: 1
      maxInstances: 3
      targetCPUPercent: 70
    healthCheckPath: /health
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3001"
      - key: RENDER_API_SECRET
        generateValue: true
```

Then:
1. Go to Render dashboard
2. Click "New" → "Blueprint"
3. Connect repository and select `render.yaml`
4. Fill in secret environment variables manually

### Step 4: Update Your Vercel Deployment

Once your Render service is live:

1. Go to your Vercel project dashboard

2. Navigate to **Settings** → **Environment Variables**

3. Add these variables:
   ```
   MANIM_API_URL = https://juliette-manim-api.onrender.com
   RENDER_API_SECRET = [Same secret you used in Render]
   ```

4. Redeploy your Vercel app (or it will auto-deploy on next git push)

### Step 5: Verify Everything Works

#### Test 1: Health Check
```bash
curl https://juliette-manim-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "manim-api",
  "timestamp": "2024-02-14T...",
  "uptime": 123.45
}
```

#### Test 2: Manim Check
```bash
curl https://juliette-manim-api.onrender.com/check-manim
```

Expected response:
```json
{
  "status": "Manim is installed",
  "ready": true,
  "version": "Manim Community v0.19.2"
}
```

#### Test 3: Generate Animation
```bash
curl -X POST https://juliette-manim-api.onrender.com/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RENDER_API_SECRET" \
  -d '{"context": "Show a blue circle transforming into a red square", "duration": 10}'
```

Expected response (after 30-60 seconds):
```json
{
  "success": true,
  "videoUrl": "https://your-supabase-project.supabase.co/storage/v1/object/public/videos/animations/animation_1234567890.mp4",
  "message": "Animation generated successfully",
  "duration": 10,
  "usedFallback": false
}
```

#### Test 4: End-to-End from Your App

1. Visit your deployed Next.js app
2. Go to `/test-animation`
3. Enter a prompt: "Graph the function y = x² and show the derivative"
4. Click "Generate Animation"
5. Wait 30-60 seconds
6. Verify the video appears and plays

---

## 🔒 Security Notes

### Authentication
The Manim API requires the `RENDER_API_SECRET` bearer token for all requests except `/health`. This prevents unauthorized access.

**Example authenticated request:**
```bash
curl -X POST https://juliette-manim-api.onrender.com/generate \
  -H "Authorization: Bearer your_secret_here" \
  -d '{"context":"...", "duration":10}'
```

### CORS
The API currently allows requests from:
- `localhost:3000` and `localhost:3001` (development)
- Any origin if `ALLOWED_ORIGINS=*` is set

**To restrict to your Vercel domain only:**

Add this environment variable in Render:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
```

---

## 📊 Monitoring & Logs

### View Logs in Render Dashboard

1. Go to your Render dashboard
2. Click on `juliette-manim-api` service
3. Go to "Logs" tab

**What to look for:**
- ✅ `🚀 Manim API Server started` - Service started successfully
- ✅ `🤖 Generating Manim code with Claude Opus 4.6...` - Code generation started
- ✅ `🎥 Rendering animation with Manim...` - Manim rendering started
- ✅ `📤 Uploading to Supabase Storage...` - Video upload started
- ✅ `✅ Animation generated successfully!` - Complete success
- ❌ `❌ Failed to generate code with AI:` - Claude API issue
- ❌ `❌ Animation rendering failed` - Manim execution issue

### Metrics to Monitor

In Render dashboard → Metrics tab:
- **CPU Usage:** Should spike to ~90% during rendering, then drop to ~5%
- **Memory Usage:** Should stay under 1GB
- **Response Time:** 30-90 seconds for `/generate` endpoint
- **Request Volume:** Track how many animations are being generated

### Auto-Scaling

The service is configured to auto-scale 1-3 instances based on CPU:
- 1 instance when idle
- Scales up if CPU > 70% for 2 minutes
- Scales down if CPU < 30% for 5 minutes

**Cost impact:**
- 1 instance: $25/month
- 2 instances: $50/month
- 3 instances: $75/month

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Cannot find module '@/lib/anthropic'"

**Solution:** Make sure all TypeScript paths are resolved. The `tsconfig.json` needs `baseUrl` and `paths` configured:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

**Error:** "LaTeX not found"

**Solution:** The Dockerfile should already include LaTeX installation. If not, add:
```dockerfile
RUN apt-get update && apt-get install -y \
    texlive-latex-extra \
    texlive-fonts-extra \
    dvisvgm
```

### Runtime Fails

**Error:** "ANTHROPIC_API_KEY is not set"

**Solution:** Double-check environment variables in Render dashboard are saved correctly.

---

**Error:** "Failed to upload to Supabase Storage"

**Solution:**
1. Verify the `videos` bucket exists in Supabase
2. Verify `SUPABASE_SERVICE_ROLE_KEY` has storage permissions
3. Check if bucket is public (Settings → Make Public)

---

**Error:** "Video file is empty"

**Solution:** Manim rendering failed. Check logs for Python errors. Common causes:
- Syntax error in generated Python code (Claude made a mistake)
- Missing LaTeX package
- Invalid Manim objects/functions

### Performance Issues

**Problem:** Animations taking >2 minutes

**Solutions:**
1. Check CPU usage in Render metrics - if <50%, scale to Standard Plus plan
2. Reduce quality from `medium` to `low` in production
3. Reduce duration in requests (8-12s instead of 20-30s)

---

**Problem:** Frequent timeouts

**Solutions:**
1. Increase timeout in `manim-executor.ts` (currently 90s)
2. Add retry logic in the proxy route
3. Scale to more powerful instance

---

## 💰 Cost Optimization

### Current Setup: $25-75/month

**Ways to reduce cost:**

1. **Start with Starter plan ($7/mo)** for MVP testing
   - Slower rendering (1-2 minutes per animation)
   - Only 0.5 CPU, 512MB RAM
   - Acceptable for low traffic

2. **Disable auto-scaling**
   - Stay on 1 instance always
   - Saves $25-50/month
   - Risk: Slow responses during high traffic

3. **Use low quality rendering**
   - Change `'medium'` to `'low'` in `manim-api-server.ts` line 136
   - Renders 2x faster
   - Smaller video files (500KB vs 2MB)

4. **Implement caching**
   - Store generated animations by content hash
   - Reuse if same prompt requested again
   - Can reduce 50-80% of rendering load

---

## 🔄 Updating the Service

### Deploy Code Changes

**Automatic (if Auto-Deploy enabled):**
```bash
git add .
git commit -m "Update Manim API"
git push origin main
```
Render will automatically rebuild and deploy.

**Manual:**
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

### Update Environment Variables

1. Render dashboard → Service → Environment
2. Edit variable → Save
3. Service will automatically restart

### Update Docker Configuration

If you modify `docker/manim-api.Dockerfile`:
1. Commit and push changes
2. Render will rebuild from scratch (takes 5-10 minutes)
3. Monitor logs during rebuild

---

## 📚 Next Steps

Once this is working, you can:

1. **Deploy the Workers** (Phase 2)
   - Transcription worker
   - YouTube download worker
   - YouTube transcript worker
   - Combined into one Render Background Worker ($7/mo)

2. **Deploy RTMS Service** (Phase 3)
   - Real-time Zoom audio streaming
   - Render Web Service ($25/mo)

3. **Add Production Hardening** (Phase 4)
   - Python code sandboxing
   - Rate limiting
   - Animation caching
   - Monitoring/alerting

---

## 📞 Support Resources

**Render Docs:**
- [Docker deploys](https://render.com/docs/docker)
- [Environment variables](https://render.com/docs/environment-variables)
- [Auto-scaling](https://render.com/docs/scaling)

**Manim Docs:**
- [Installation](https://docs.manim.community/en/stable/installation.html)
- [Configuration](https://docs.manim.community/en/stable/guides/configuration.html)

**Supabase Storage:**
- [Storage guide](https://supabase.com/docs/guides/storage)
- [Making buckets public](https://supabase.com/docs/guides/storage/buckets#public-buckets)

---

## ✅ Deployment Checklist

Before you start:
- [ ] Supabase `videos` bucket created and public
- [ ] Anthropic API key ready
- [ ] Render account created
- [ ] GitHub repo connected to Render

Deployment steps:
- [ ] Test Docker build locally (optional)
- [ ] Create Render web service
- [ ] Configure environment variables
- [ ] Wait for initial deployment
- [ ] Test health endpoint
- [ ] Test Manim check endpoint
- [ ] Test animation generation
- [ ] Update Vercel environment variables
- [ ] Test end-to-end from your app
- [ ] Monitor logs for any errors

Post-deployment:
- [ ] Set up monitoring alerts
- [ ] Configure auto-scaling rules
- [ ] Document your Render service URL
- [ ] Update team on new architecture

---

🎉 **You're ready to deploy!** Follow the steps above and your Manim API will be live on Render with full Docker support.
