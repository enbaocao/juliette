import { TranscriptChunk } from '@/lib/types';
import { formatChunksForPrompt } from './retrieval';

export function buildSimpleModePrompt(
  question: string,
  chunks: TranscriptChunk[]
): { system: string; user: string } {
  return {
    system: `You are an educational AI assistant helping students understand video content.
Your task is to provide clear, simple explanations based on the video transcript.

Guidelines:
- Explain concepts in simple, easy-to-understand language
- Use examples and analogies when helpful
- Reference specific timestamps from the transcript when relevant
- End with 1-2 check questions to verify understanding
- Keep your response concise (2-3 paragraphs max)`,
    user: `Video Transcript Excerpts:
${formatChunksForPrompt(chunks)}

Student Question: ${question}

Please provide a clear explanation based on the video content above, and include 1-2 check questions at the end.`,
  };
}

export function buildPracticeModePrompt(
  question: string,
  chunks: TranscriptChunk[],
  interestTags?: string[]
): { system: string; user: string } {
  const interestContext = interestTags && interestTags.length > 0
    ? `\nStudent interests: ${interestTags.join(', ')}`
    : '';

  return {
    system: `You are an educational AI assistant creating personalized practice problems.
Your task is to generate practice problems based on video content and student interests.

Guidelines:
- Create 2-3 practice problems of increasing difficulty
- Tailor problems to student interests when provided${interestContext}
- Include detailed solutions with step-by-step explanations
- Provide hints for each problem
- Reference relevant timestamps from the video transcript`,
    user: `Video Transcript Excerpts:
${formatChunksForPrompt(chunks)}${interestContext}

Student Question: ${question}

Please create 2-3 personalized practice problems with solutions, hints, and video references.`,
  };
}

export interface AnimationTemplate {
  name: string;
  description: string;
  parameters: string[];
}

export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  {
    name: 'function_graph',
    description: 'Plot a mathematical function with optional tangent line',
    parameters: ['function', 'x_range', 'tangent_point?'],
  },
  {
    name: 'vector_addition',
    description: 'Visualize vector addition in 2D',
    parameters: ['vector1_x', 'vector1_y', 'vector2_x', 'vector2_y'],
  },
  {
    name: 'probability_tree',
    description: 'Draw a probability tree diagram',
    parameters: ['branches', 'probabilities', 'labels'],
  },
  {
    name: 'calculus_derivative',
    description: 'Show derivative as rate of change',
    parameters: ['function', 'point', 'show_tangent'],
  },
  {
    name: 'geometry_diagram',
    description: 'Draw geometric shapes and relationships',
    parameters: ['shapes', 'labels', 'measurements'],
  },
];

export function buildAnimationModePrompt(
  question: string,
  chunks: TranscriptChunk[],
  prerenderedSuggestion?: { title: string; description: string; filename: string } | null
): { system: string; user: string } {
  const templatesDesc = ANIMATION_TEMPLATES.map(
    (t) => `- ${t.name}: ${t.description} (params: ${t.parameters.join(', ')})`
  ).join('\n');

  // If we found a pre-rendered match, strongly suggest it
  const prerenderedContext = prerenderedSuggestion
    ? `\n\n🎯 PRE-RENDERED MATCH FOUND (INSTANT, PREFERRED):
Title: ${prerenderedSuggestion.title}
Description: ${prerenderedSuggestion.description}
Filename: ${prerenderedSuggestion.filename}

This animation is ALREADY RENDERED and can be served INSTANTLY. Only use custom rendering if this pre-rendered animation is clearly insufficient for the student's question.`
    : '';

  return {
    system: `You are an educational AI assistant creating animation specifications.
Your task is to analyze the question and video content, then decide:
1. Use a pre-rendered animation if one matches (instant, preferred)
2. OR specify a custom template to render (20-30s delay)

Available custom templates:
${templatesDesc}${prerenderedContext}

Guidelines:
- PREFER pre-rendered animations when available (instant delivery)
- Only use custom rendering if the student needs specific parameters
- Include a brief explanation of what the animation will show
- Reference the relevant video timestamps

Response format (JSON):
{
  "strategy": "prerendered" | "custom",
  "prerendered_filename": "filename.mp4" (if strategy=prerendered),
  "template": "template_name" (if strategy=custom),
  "parameters": { "param1": "value1", ... } (if strategy=custom),
  "explanation": "Brief explanation of what the animation shows",
  "video_references": [{"start_sec": 120, "end_sec": 180, "text": "..."}]
}`,
    user: `Video Transcript Excerpts:
${formatChunksForPrompt(chunks)}

Student Question: ${question}

Please specify the animation strategy (prerendered or custom) as JSON.`,
  };
}
