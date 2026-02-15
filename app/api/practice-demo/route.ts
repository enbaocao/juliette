import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, interestTags, systemPrompt: customSystemPrompt } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const interestContext = interestTags && interestTags.length > 0
      ? `\nStudent interests: ${interestTags.join(', ')}`
      : '';

    // Use custom system prompt if provided, otherwise use default
    const systemPrompt = customSystemPrompt || `You are an educational AI assistant creating practice problems about math, science, and academic topics.

IMPORTANT: Use LeetCode-STYLE formatting and structure, but the problems should be about the academic topic requested (math, physics, etc.), NOT coding problems.

Guidelines:
- Create 1-2 focused practice problems about the requested academic topic
- Tailor problem context to student interests when provided${interestContext}
- Use clean, structured format inspired by LeetCode's presentation style
- Break down problems into: Problem Statement → Example → Constraints → Hint → Solution
- Include worked examples with sample data and expected results
- Provide detailed solutions with step-by-step mathematical/scientific explanations

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE EXACTLY:

1. **Headers**: Use ## for problem titles
   Example: ## Problem 1: Linear Regression with Basketball Stats

2. **Structure each problem as**:
   - Clear problem statement
   - **Example:** section with sample input/output
   - **Constraints:** (if applicable)
   - **Hint:** (subtle guidance)
   - **Solution:** (detailed explanation)

3. **Math formatting (VERY IMPORTANT)**:
   - For inline math (within a sentence): Use single dollar signs $...$
   - For display math (standalone equations): Use double dollar signs $$...$$

   CORRECT inline math examples:
   - "The slope $m = 2$ is positive"
   - "Use the formula $y = mx + b$ to find the line"
   - "When $x^2 + y^2 = r^2$, we have a circle"

   CORRECT display math examples:
   - $$m = \\frac{y_2 - y_1}{x_2 - x_1}$$
   - $$f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$

   WRONG - DO NOT USE THESE:
   - \\(x = 5\\) or \\[x = 5\\] - Wrong delimiters!
   - \`x = 5\` - Wrong, this is code formatting
   - Plain text like "x = 5" for equations - Wrong, use $x = 5$ instead

Format your response as:
## Problem 1: [Descriptive Title]

[Clear problem statement with context]

**Example:**
- Input: [sample data]
- Output: [expected result]
- Explanation: [why this is the answer]

**Constraints:**
- [Any constraints or assumptions]

**Hint:** [Subtle guidance without giving away the answer]

**Solution:**

[Step-by-step explanation with reasoning]

1. [First step with inline math $...$]
2. [Second step]

For key formulas, use display math:
$$[formula]$$

[Continue with explanation and final answer]

---

## Problem 2: [Title]
...`;


    const userPrompt = `Topic: ${topic}${interestContext}

Please create 2-3 personalized practice problems with solutions and hints.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content || '';

    return NextResponse.json({
      success: true,
      content: responseContent,
    });
  } catch (error) {
    console.error('Practice demo API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
