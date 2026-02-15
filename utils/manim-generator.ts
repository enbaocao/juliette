import { anthropic } from '@/lib/anthropic';

export interface ManimGenerationRequest {
  context: string;
  duration?: number; // Target duration in seconds
}

export async function generateManimCode(request: ManimGenerationRequest): Promise<string> {
  const { context, duration = 15 } = request;

  // Calculate timing breakdown for animations
  const numAnimations = Math.max(3, Math.floor(duration / 3)); // Roughly 3 seconds per animation
  const avgAnimationTime = (duration * 0.9) / numAnimations; // 90% for animations, 10% for waits

  const systemPrompt = `You are an expert Manim (Mathematical Animation Engine) programmer. Your task is to generate Python code that creates a visually compelling and DIRECTLY RELEVANT animation for the given concept.

🎯 CRITICAL RULES - MUST FOLLOW:

1. **DIRECT RELEVANCE**: The animation MUST visually demonstrate the EXACT concept described. Do not create generic shapes unless the concept is about those shapes.

2. **PRECISE TIMING**: The total animation must run for EXACTLY ${duration} seconds:
   - Create ${numAnimations} distinct animations
   - Each animation should use run_time=${avgAnimationTime.toFixed(1)}
   - Total: ${numAnimations} × ${avgAnimationTime.toFixed(1)}s = ${duration}s
   - Add minimal waits (0.3-0.5s) between major sections only
   - NO long pauses or unnecessary waiting

3. **CONCEPT-SPECIFIC VISUALS**: Choose visualization based on the concept type:
   - **Math Equations/Formulas**: Show the actual equations with MathTex, demonstrate transformations
   - **Functions/Calculus**: Use Axes and plot() to graph functions, show derivatives, integrals
   - **Physics**: Show vectors, forces, motion, wave propagation with appropriate diagrams
   - **Geometry**: Show the actual shapes, angles, constructions mentioned
   - **Processes/Algorithms**: Show step-by-step progression with clear labels
   - **Comparisons**: Show side-by-side or before/after
   - **Wave phenomena**: Use sine waves, interference patterns, not random circles

4. **CODE STRUCTURE**:
\`\`\`python
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # Animation 1: Introduction (${avgAnimationTime.toFixed(1)}s)
        # Show the main concept elements

        # Animation 2: Development (${avgAnimationTime.toFixed(1)}s)
        # Show the process or transformation

        # Animation 3+: Key Insight (${avgAnimationTime.toFixed(1)}s each)
        # Demonstrate the core idea visually
\`\`\`

5. **MANIM TOOLKIT**:
   - **Math**: MathTex("x^2 + y^2 = r^2"), Axes(), NumberLine, plot(lambda x: ...)
   - **Shapes**: Circle, Square, Arrow, Line, Dot, Arc, Polygon
   - **Text**: Text("label"), always use for explanations
   - **Animations**: Create(), Write(), FadeIn(), Transform(), Indicate(), Circumscribe()
   - **Motion**: .animate.shift(), .animate.scale(), .animate.rotate()
   - **Colors**: BLUE, RED, GREEN, YELLOW, ORANGE, PURPLE, PINK, GOLD
   - **Positioning**: move_to(), next_to(), shift(UP), to_edge(LEFT)

6. **QUALITY STANDARDS**:
   - Use descriptive variable names that match the concept
   - Add Text labels for clarity
   - Use colors meaningfully (e.g., BLUE for positive, RED for negative)
   - Ensure mathematical accuracy
   - Keep code clean and well-organized

7. **OUTPUT FORMAT**:
   - Return ONLY Python code
   - NO markdown code blocks (\`\`\`), NO explanations, NO comments outside the code
   - Code must be immediately executable

EXAMPLES OF GOOD vs BAD:

❌ BAD (Generic, irrelevant):
Context: "Pythagorean theorem states a² + b² = c²"
Code: Creates random circles and squares transforming

✅ GOOD (Specific, relevant):
Context: "Pythagorean theorem states a² + b² = c²"
Code: Shows right triangle, labels sides a/b/c, draws squares on each side, shows area calculation

❌ BAD (Ignores timing):
Uses self.wait(2) everywhere, creates 20 animations for 10s video

✅ GOOD (Precise timing):
For 10s video: 3-4 animations, each 2.5-3s, minimal waits`;

  const userPrompt = `Generate a ${duration}-second Manim animation for:

"${context}"

BEFORE YOU CODE, THINK:
1. What is the CORE concept here? (What exactly needs to be visualized?)
2. What visual elements directly represent this? (Equations? Graphs? Diagrams? Motion?)
3. How can I show this in ${numAnimations} clear steps?

THEN CODE:
- ${numAnimations} animations, each ${avgAnimationTime.toFixed(1)}s long
- DIRECTLY visualize the concept (not generic shapes)
- Use appropriate math/physics notation if relevant
- Make the concept's key insight visually obvious
- Total runtime: ${duration} seconds

Return ONLY the Python code, no markdown formatting:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6', // Opus 4.6 is optimized for code generation and reasoning
      max_tokens: 4096,
      temperature: 0.7, // Lower temperature for more consistent, focused output
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    let code = '';
    if (message.content[0].type === 'text') {
      code = message.content[0].text;
    }

    // Clean up the response
    code = cleanManimCode(code);

    // Validate the code
    validateManimCode(code, duration);

    return code;
  } catch (error) {
    console.error('Error generating Manim code with Claude:', error);
    throw new Error('Failed to generate animation code: ' + (error as Error).message);
  }
}

function cleanManimCode(code: string): string {
  // Remove markdown code blocks if present
  let cleaned = code.replace(/```python\n/g, '').replace(/```\n?/g, '');

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // Manim compatibility cleanup:
  // Some Manim versions don't accept `font_size` in axis label helpers
  // (Axes.get_x_axis_label / get_y_axis_label -> CoordinateSystem._get_axis_label)
  // Example failing code: axes.get_x_axis_label("x", font_size=24)
  // We strip only the `font_size=...` kwarg and keep the rest intact.
  cleaned = cleaned.replace(
    /(\bget_[xy]_axis_label\s*\([^\)]*?),\s*font_size\s*=\s*[\d.]+\s*(\))/g,
    '$1$2'
  );
  cleaned = cleaned.replace(
    /(\bget_[xy]_axis_label\s*\([^\)]*?)\s*font_size\s*=\s*[\d.]+\s*,\s*/g,
    '$1'
  );

  // Ensure imports are present
  if (!cleaned.includes('from manim import')) {
    cleaned = 'from manim import *\n\n' + cleaned;
  }

  // Ensure there's a GeneratedScene class
  if (!cleaned.includes('class GeneratedScene')) {
    throw new Error('Generated code must contain a GeneratedScene class');
  }

  return cleaned;
}

function validateManimCode(code: string, expectedDuration: number): void {
  // Check for required elements
  if (!code.includes('def construct(self):')) {
    throw new Error('Generated code must have a construct method');
  }

  if (!code.includes('self.play(')) {
    throw new Error('Generated code must contain at least one animation');
  }

  // Rough timing validation: count animations and check timing
  const playMatches = code.match(/self\.play\(/g);
  const numPlays = playMatches ? playMatches.length : 0;

  if (numPlays === 0) {
    throw new Error('No animations found in generated code');
  }

  // Extract run_time values
  const runTimeMatches = code.match(/run_time\s*=\s*([\d.]+)/g);
  let totalRunTime = 0;

  if (runTimeMatches) {
    runTimeMatches.forEach(match => {
      const time = parseFloat(match.split('=')[1]);
      if (!isNaN(time)) {
        totalRunTime += time;
      }
    });
  } else {
    // If no run_time specified, Manim defaults to 1s per animation
    totalRunTime = numPlays * 1.0;
  }

  // Extract wait times
  const waitMatches = code.match(/self\.wait\(([\d.]+)\)/g);
  if (waitMatches) {
    waitMatches.forEach(match => {
      const time = parseFloat(match.match(/\(([\d.]+)\)/)?.[1] || '0');
      if (!isNaN(time)) {
        totalRunTime += time;
      }
    });
  }

  // Check if timing is roughly correct (allow 30% margin)
  const minDuration = expectedDuration * 0.6;
  const maxDuration = expectedDuration * 1.5;

  if (totalRunTime < minDuration || totalRunTime > maxDuration) {
    console.warn(`⚠️  Generated animation timing (${totalRunTime.toFixed(1)}s) differs from expected (${expectedDuration}s)`);
  }
}

export function createFallbackAnimation(context: string, duration: number = 12): string {
  // Simplified fallback animation with proper timing
  const firstLine = context.split('\n')[0].substring(0, 60);
  const animTime = duration / 4; // Divide into 4 equal parts

  return `from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # Show the topic
        title = Text("${firstLine.replace(/"/g, '\\"')}", font_size=28)
        title.to_edge(UP)
        self.play(Write(title), run_time=${animTime.toFixed(1)})

        # Create visual representation
        concept = VGroup(
            Circle(radius=1, color=BLUE, fill_opacity=0.5),
            Text("?", font_size=72, color=WHITE)
        )
        concept[-1].move_to(concept[0].get_center())

        self.play(FadeIn(concept), run_time=${animTime.toFixed(1)})

        # Show transformation
        self.play(
            concept.animate.scale(1.5).set_color(GREEN),
            run_time=${animTime.toFixed(1)}
        )

        # Conclusion
        self.play(
            FadeOut(title), FadeOut(concept),
            run_time=${animTime.toFixed(1)}
        )
`;
}
