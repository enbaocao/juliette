# Zoom Panel with Manim Integration

## Overview

Enhanced Zoom panel that uses meeting context to provide context-aware features for students during live lectures. Features a tabbed interface with full Manim animation generation and scaffolding for future personalized learning features.

---

## Features

### 1. **Q&A Tab** (Existing Feature - Enhanced)
- Ask questions about the lecture in real-time
- Three response modes:
  - 💡 **Simple**: Quick explanations
  - 📝 **Practice**: Practice problems with interest-based customization
  - 🎬 **Animation**: Animated visualizations (redirects to Manim tab)
- View recent questions and AI-generated answers
- References to lecture timestamps

### 2. **🎬 Manim Animations Tab** (FULLY IMPLEMENTED)
Context-aware animation generation using Claude Opus 4.6 + Manim:

**Features:**
- **Context Integration**: Automatically uses lecture title and topic in prompts
- **Suggested Prompts**: Quick-start buttons based on current lecture
  - "Visualize Current Topic" - Creates animation for the main lecture topic
  - "Quick Concept" - Simple visual for key formulas
  - "Step-by-Step Process" - Breaks down problem-solving

**How It Works:**
1. Student enters a description of what to visualize
2. System adds meeting context: `"Context: We're in a live lecture about '{lecture_title}'. {student_prompt}"`
3. Claude Opus 4.6 generates relevant Manim code
4. Manim renders the animation (30-60 seconds)
5. Video displayed inline with download option

**Technical Details:**
- Uses `/api/generate-animation` endpoint
- Duration: 8-25 seconds (adjustable slider)
- Stores generated animations in session
- Shows generation status with progress indicator
- Marks fallback animations when AI generation fails

**Example Use Cases:**
- Lecture on "Derivatives" → Student asks for "tangent line visualization"
- Discussion of "Wave Interference" → Student generates sine wave superposition
- Explaining "Pythagorean Theorem" → Student creates visual proof animation

### 3. **✨ Personalized Learning Tab** (SCAFFOLD ONLY)
Placeholder for future features:
- Interest-based problem generation
- Adaptive difficulty levels
- Learning style preferences
- Progress tracking

Currently displays:
- Coming soon message
- Feature list preview
- Uses session context for personalization messaging

---

## Architecture

### Component Structure

```
app/zoom/panel/page.tsx
  ↓
components/zoom/LiveSessionPanel.tsx
  ↓
components/zoom/StudentView.tsx (Updated)
  ├── Tab: Q&A (existing)
  ├── Tab: ManimVideoTab.tsx (NEW - fully implemented)
  └── Tab: Personalized (scaffold)
```

### Context Flow

```
Zoom Meeting Context
  ├── meetingUUID: Unique meeting identifier
  ├── userName: Student's display name
  ├── role: 'host' | 'attendee'
  └── (future: meetingTopic, participantCount, etc.)
         ↓
Live Session Data
  ├── id: Session ID
  ├── title: Lecture title
  ├── video_id: Associated video (optional)
  └── created_at: Session start time
         ↓
Contextual Features
  ├── Manim prompts include lecture title
  ├── Suggested prompts based on topic
  └── Personalized learning considers discussion
```

---

## API Integration

### Generate Animation

**Endpoint:** `POST /api/generate-animation`

**Request:**
```json
{
  "context": "Context: We're in a live lecture about 'Calculus - Derivatives'. Show how the secant line becomes the tangent line",
  "duration": 15
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "/animations/animation_1234567890.mp4",
  "duration": 15,
  "usedFallback": false,
  "code": "from manim import *\n..."
}
```

---

## User Flow

### Student Joins Zoom Meeting

1. Opens Juliette app panel in Zoom
2. Sees "🟢 Live Session Active" with lecture title
3. Chooses from 3 tabs:

#### Scenario A: Quick Question
- Stays on **Q&A Tab**
- Types question: "What's the derivative of x²?"
- Selects "Simple" mode
- Gets instant AI answer with lecture references

#### Scenario B: Visual Learner
- Switches to **🎬 Animations Tab**
- Clicks "Visualize Current Topic" (auto-fills prompt)
- Adjusts duration to 15s
- Clicks "Generate Animation"
- Waits 30-60s
- Watches animation explaining derivatives visually
- Downloads for later review

#### Scenario C: Personalized Practice (Future)
- Switches to **✨ Personalized Tab**
- Sees "Coming Soon" with feature preview
- Looking forward to interest-based problems

---

## Implementation Details

### ManimVideoTab Component

**Key Functions:**

```typescript
// Adds lecture context to student prompt
const contextualPrompt = session?.title
  ? `Context: We're in a live lecture about "${session.title}". ${prompt}`
  : prompt;

// Stores animations in component state
interface GeneratedAnimation {
  id: string;
  prompt: string;
  videoUrl: string;
  duration: number;
  timestamp: Date;
  usedFallback?: boolean;
}
```

**State Management:**
- `generatedAnimations[]`: Array of all animations generated in this session
- `selectedAnimation`: Currently displayed animation
- `isGenerating`: Shows loading state
- `error`: Displays generation errors

**Suggested Prompts Logic:**
```typescript
const suggestedPrompts = [
  {
    label: 'Visualize Current Topic',
    prompt: session?.title
      ? `Create an animation explaining: ${session.title}...`
      : 'Explain the main concept...',
    duration: 15,
  },
  // ... more suggestions
];
```

---

## Docker Considerations

When deploying with Docker:

### Environment Variables
```dockerfile
ENV ANTHROPIC_API_KEY=your_key_here
ENV NEXT_PUBLIC_ZOOM_APP_CLIENT_ID=your_client_id
ENV NEXT_PUBLIC_ZOOM_APP_CLIENT_SECRET=your_secret
```

### Dependencies
```dockerfile
# Install Manim and LaTeX in container
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    dvisvgm

RUN pip3 install manim
```

### Volume Mounts
```yaml
volumes:
  - ./public/animations:/app/public/animations
```

This ensures generated animations persist across container restarts.

---

## Testing the Integration

### Local Development

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Test Manim Generation:**
   - Visit: http://localhost:3001/test-animation
   - Try "Wave Interference" example
   - Verify animation generates successfully

3. **Test Zoom Panel (Simulation):**
   - Visit: http://localhost:3001/zoom/panel
   - Will show "Not Configured" (expected - needs actual Zoom meeting)

### In Zoom Meeting

1. **Install Zoom App** (see TEACHER_FEATURES.md)
2. **Start Meeting** with Juliette app enabled
3. **Open Panel** as student
4. **Test Animation Generation:**
   - Switch to 🎬 Animations tab
   - Click "Visualize Current Topic"
   - Wait for generation
   - Verify video plays inline

---

## Future Enhancements

### Near-Term (Ready for Implementation)

1. **Enhance Context Awareness:**
   - Capture meeting transcript snippets
   - Use recent discussion for better prompts
   - Auto-suggest animations based on keywords

2. **Collaboration Features:**
   - Share animations with class
   - Vote on best animations
   - Teacher can feature student animations

3. **Animation Library:**
   - Save animations to course library
   - Tag by topic/concept
   - Reuse in future sessions

### Long-Term (Requires Planning)

4. **Personalized Learning Tab:**
   - Student interest profiles
   - Adaptive difficulty
   - Progress tracking
   - Personalized problem sets

5. **Real-Time Collaboration:**
   - Collaborative prompt editing
   - Live voting on animation requests
   - Teacher queue management

---

## Troubleshooting

### "Context: We're in a live lecture about 'undefined'"
**Cause:** Session doesn't have a title set
**Solution:** Ensure teacher sets session title when starting

### Animations Take Too Long
**Cause:** Complex prompts or high duration
**Solution:**
- Keep duration 8-15s for Zoom use
- Use "Quick Concept" suggestions
- Consider low quality renders in Docker

### LaTeX Errors in Animations
**Cause:** Missing LaTeX packages in environment
**Solution:**
- Locally: Install via `sudo tlmgr install <package>`
- Docker: Include in Dockerfile (see above)

---

## Metrics & Analytics (Future)

Track engagement:
- Animation generation frequency
- Most common topics requested
- Average wait time
- Student satisfaction ratings
- Correlation with learning outcomes

---

## Summary

**What We Built:**
- ✅ Tabbed Zoom panel interface
- ✅ Context-aware Manim animation generation
- ✅ Suggested prompts based on lecture topic
- ✅ Real-time video generation (Claude Opus 4.6)
- ✅ Session-persistent animation history
- ✅ Inline video playback and downloads
- ✅ Error handling and fallback animations
- ⏳ Scaffolding for personalized learning

**Docker Ready:**
- All environment variables externalized
- Dependencies documented
- Volume mounts identified
- Ready for containerization

**Next Steps:**
1. Test in actual Zoom meeting
2. Gather student feedback
3. Implement animation sharing
4. Build out personalized learning features
