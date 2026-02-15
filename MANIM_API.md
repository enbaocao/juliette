# Manim Animation Generation API

## Overview

An API that takes educational content/transcription and generates unique, concept-specific animated videos using **Claude Opus 4.6** + Manim code generation. Each animation is custom-designed from scratch to directly visualize the specific educational concept with appropriate formulas, graphs, diagrams, and technical visual elements. Supports complex mathematical and scientific visualizations with precise timing control.

---

## 🎉 Recent Improvements (Claude Opus 4.6 Upgrade)

**Model Upgrade:**
- ⬆️ Upgraded from Claude Sonnet 3.5 → **Claude Opus 4.6** (Anthropic's most capable model)
- 🎯 **Much better relevance**: Animations now directly visualize the specific concept, not generic shapes
- 🧠 **Smarter design**: Claude Opus understands complex mathematical and scientific concepts better

**Timing Control:**
- ⏱️ **Precise duration matching**: Animations now accurately respect the requested duration (8-40s)
- 📊 **Smart breakdown**: Automatically calculates optimal number of animations and timing per scene
- ✅ **Validation**: Pre-execution code validation ensures timing requirements are met

**Quality Improvements:**
- 🎬 **Medium quality default**: Better visual quality (720p30) vs previous low quality (480p15)
- 🔍 **Enhanced error handling**: Detailed diagnostics when rendering fails
- 📝 **Better prompts**: More specific instructions to Claude for creating relevant visualizations

**Better Examples:**
- 6 detailed example prompts showing how to write effective requests
- Each example includes optimal duration preset
- Demonstrates best practices for getting high-quality animations

---

## API Endpoint

### `POST /api/generate-animation`

Generate an animated video from text context.

**Request Body:**
```json
{
  "context": "The derivative represents the instantaneous rate of change. As we zoom in on a curve, the secant line becomes the tangent line.",
  "duration": 15  // Optional, defaults to 15 seconds
}
```

**Response (Success):**
```json
{
  "success": true,
  "videoUrl": "/animations/animation_1234567890.mp4",
  "message": "Animation generated successfully",
  "code": "from manim import *\n\nclass GeneratedScene..."
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "logs": "Detailed logs...",
  "code": "Generated code (for debugging)"
}
```

### `GET /api/generate-animation`

Check Manim installation status.

**Response:**
```json
{
  "status": "Manim is installed",
  "ready": true
}
```

---

## How It Works

1. **AI Code Generation (Claude Opus 4.6)**
   - User sends educational content/transcription with target duration
   - **Claude Opus 4.6** (Anthropic's most capable model) analyzes the concept deeply
   - Designs a DIRECTLY RELEVANT custom visualization (not generic shapes)
   - Each animation is built from scratch specifically for the concept
   - Supports complex technical demonstrations: calculus graphs, geometric proofs, physics simulations, algebraic transformations
   - Uses appropriate mathematical notation (LaTeX), function graphs, diagrams, and visual effects
   - **Precise timing control**: Animations match the requested duration (8-40 seconds)
   - **Smart animation breakdown**: Automatically calculates optimal number of animations and timing
   - Validates generated code before execution

2. **Code Execution (Manim)**
   - Generated code is validated and saved to temporary file
   - Manim renders the animation (medium quality by default)
   - Output MP4 is saved to `public/animations/`
   - Enhanced error handling with detailed diagnostics

3. **Video Delivery**
   - Returns URL to the generated video
   - Video can be played, downloaded, or embedded
   - Includes generated code for debugging/reference

---

## Setup Requirements

### 1. Add Claude API Key

The animation generation uses Claude (Anthropic API):

```bash
# Add to .env.local
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at: https://console.anthropic.com

See `SETUP_CLAUDE_API.md` for detailed instructions.

### 2. Install Manim

**macOS:**
```bash
brew install py3cairo ffmpeg
pip3 install manim
```

**Linux:**
```bash
sudo apt-get install python3-cairo ffmpeg
pip3 install manim
```

**Windows:**
```bash
# Install ffmpeg from https://ffmpeg.org/download.html
pip install manim
```

**Verify Installation:**
```bash
manim --version
```

### 2. Test the API

Visit: **http://localhost:3001/test-animation**

---

## Testing Interface

The test page at `/test-animation` provides:

- **Quick Examples** - 6 pre-filled educational concepts (Derivative, Pythagorean Theorem, Wave Interference, Quadratic Formula, Vector Addition, Limits)
- **Context Input** - Enter any educational text (up to 1000 characters)
- **Duration Slider** - Set target animation length (8-40s) - animations will precisely match this duration
- **Live Preview** - Watch generated animation with auto-play
- **Download Option** - Save video locally
- **Code Viewer** - See generated Manim code
- **Status Indicators** - Shows Manim installation status and if fallback mode was used

### Quick Start Testing:

1. Visit http://localhost:3001/test-animation
2. Click a quick example (recommended: "Wave Interference" or "Derivative Definition")
3. Adjust duration if needed (each example has an optimal duration preset)
4. Click "Generate Animation"
5. Wait 30-60 seconds (Claude Opus generates code, then Manim renders)
6. Watch the result and view the generated code!

---

## Example Usage

### Using cURL:

```bash
curl -X POST http://localhost:3001/api/generate-animation \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Visual proof of the Pythagorean theorem using squares on each side of a right triangle",
    "duration": 15
  }'
```

### Using JavaScript:

```javascript
const response = await fetch('/api/generate-animation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: 'Wave interference: when two sine waves meet, they combine constructively or destructively based on their phase',
    duration: 18
  })
});

const data = await response.json();
console.log('Video URL:', data.videoUrl);
```

### Using Python:

```python
import requests

response = requests.post('http://localhost:3001/api/generate-animation', json={
    'context': 'Probability is expressed as a number between 0 and 1',
    'duration': 10
})

data = response.json()
print(f"Video URL: {data['videoUrl']}")
```

---

## Integration Examples

### 1. Add to Q&A System

In `app/api/ask/route.ts`:

```typescript
// After getting answer in animation mode
if (mode === 'animation') {
  // Generate animation from answer
  const animResponse = await fetch('http://localhost:3001/api/generate-animation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: responseContent,
      duration: 12
    })
  });

  const animData = await animResponse.json();
  if (animData.success) {
    answer.animation_url = animData.videoUrl;
  }
}
```

### 2. Add to Zoom Panel

Students can request animations during live meetings, and they're generated on-the-fly.

### 3. Batch Generation

Generate animations for all transcript chunks:

```typescript
for (const chunk of transcriptChunks) {
  const response = await fetch('/api/generate-animation', {
    method: 'POST',
    body: JSON.stringify({
      context: chunk.text,
      duration: 10
    })
  });
  // Save animation URL with chunk
}
```

---

## Configuration

### Adjust Animation Quality

In `app/api/generate-animation/route.ts`, change the quality parameter:

```typescript
// Low quality (fast, smaller files)
const result = await executeManimCode(manimCode, outputName, 'low');

// Medium quality - Current default (balanced)
const result = await executeManimCode(manimCode, outputName, 'medium');

// High quality (slow, larger files, best for production)
const result = await executeManimCode(manimCode, outputName, 'high');
```

Quality comparison:
- **Low** (-ql): 480p15, ~10-20s render time, ~500KB files
- **Medium** (-qm): 720p30, ~20-40s render time, ~1-2MB files ⭐ DEFAULT
- **High** (-qh): 1080p60, ~60-120s render time, ~3-5MB files

### Adjust Generation Prompts

Edit `utils/manim-generator.ts` to customize:
- Animation style
- Complexity level
- Visual preferences
- Code patterns

---

## Troubleshooting

### "Manim not installed"

**Solution:**
```bash
pip3 install manim
manim --version  # Verify
```

### "Execution timeout"

The default timeout is 60 seconds. For complex animations:

In `utils/manim-executor.ts`:
```typescript
timeout: 120000  // 2 minutes
```

### "No video file generated"

Check logs in the error response. Common issues:
- Syntax error in generated code
- Missing Manim dependencies
- ffmpeg not installed

### Generated video is too long

Reduce the duration parameter:
```json
{
  "context": "...",
  "duration": 8  // Shorter animation
}
```

---

## Supported Concepts

The API excels at visualizing technical educational content:

**Mathematics:**
- Calculus: derivatives, integrals, limits, function behavior
- Geometry: proofs, constructions, transformations
- Algebra: equation solving, factoring, function graphs
- Linear Algebra: vector operations, matrix transformations
- Number Theory: prime factorization, divisibility, patterns

**Physics:**
- Mechanics: forces, motion, energy diagrams
- Waves: interference, superposition, frequency
- Vectors: addition, components, dot/cross products

**Computer Science:**
- Algorithms: sorting, searching, recursion visualization
- Data Structures: trees, graphs, linked lists
- Complexity: Big-O growth comparisons

**Other:**
- Statistics/Probability: distributions, sample spaces
- Chemistry: molecular structures, reactions
- Logic: truth tables, proof trees

## Performance Tips

1. **Be VERY Specific** - Claude Opus works best with detailed instructions:
   - ❌ BAD: "Explain derivatives"
   - ✅ GOOD: "Graph f(x)=x² and show a secant line between x=1 and x=3. Animate the second point approaching x=1, showing how the secant line becomes the tangent line. Display the limit definition formula."

2. **Mention Visual Elements** - Tell Claude exactly what to show:
   - "Draw a right triangle with sides a=3, b=4, c=5"
   - "Plot the sine wave y = sin(x) in blue"
   - "Show the equation x² + 5x + 6 = 0 and solve it step by step"

3. **Optimal Duration** - Match duration to complexity:
   - 8-12s: Simple concepts (single equation, basic shape relationship)
   - 12-18s: Moderate concepts (multi-step process, theorem proof)
   - 18-30s: Complex concepts (detailed derivation, multiple transformations)

4. **Keep Context Focused** - Max 1000 characters, one main concept per animation

5. **Use Medium Quality** - Good balance of speed and visual quality (default)

---

## Limitations

- Requires Manim installed locally (working on Docker solution)
- Generation takes 30-90 seconds total:
  - Claude Opus code generation: 5-15 seconds
  - Manim rendering: 25-75 seconds
- AI generates unique animations but may occasionally produce syntax errors (automatic fallback animation used)
- Works best with clear, focused educational concepts that have visual components
- Very abstract or philosophical concepts may be challenging to animate effectively
- Claude Opus 4.6 requires Anthropic API key (paid service)

---

## Future Enhancements

1. **Docker Container** - Pre-built Manim environment
2. **Queue System** - Handle multiple requests
3. **Template Library** - Faster generation for common patterns
4. **Caching** - Reuse animations for similar content
5. **Style Customization** - User-selectable themes

---

## Quick Reference

| Task | Command/URL |
|------|-------------|
| Test Interface | http://localhost:3001/test-animation |
| Check Status | GET /api/generate-animation |
| Generate Video | POST /api/generate-animation |
| View Video | http://localhost:3001/animations/{filename}.mp4 |

---

**Ready to test?** Visit http://localhost:3001/test-animation and try it out! 🎬
