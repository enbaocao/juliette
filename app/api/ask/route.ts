import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { retrieveRelevantChunks, retrieveRelevantChunksEnhanced } from '@/utils/retrieval';
import {
  buildSimpleModePrompt,
  buildPracticeModePrompt,
  buildAnimationModePrompt,
} from '@/utils/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_id, question, mode, interest_tags, live_session_id, is_live } = body;

    // Support both camelCase (old) and snake_case (new) for backwards compatibility
    const videoId = video_id;
    const interestTags = interest_tags;
    const liveSessionId = live_session_id;

    if (!question || !mode) {
      return NextResponse.json(
        { error: 'question and mode are required' },
        { status: 400 }
      );
    }

    if (!['simple', 'practice', 'animation'].includes(mode)) {
      return NextResponse.json(
        { error: 'mode must be simple, practice, or animation' },
        { status: 400 }
      );
    }

    // For MVP, use hardcoded user ID
    const userId = process.env.DEMO_USER_ID || 'demo-user-' + Date.now();

    // Retrieve relevant transcript chunks
    // For live sessions, prioritize real-time chunks
    let chunks = [];
    if (liveSessionId || videoId) {
      chunks = await retrieveRelevantChunksEnhanced(question, {
        videoId: videoId,
        liveSessionId: liveSessionId,
        topK: 5
      });
    }

    // For non-live sessions without video chunks, return error
    if (chunks.length === 0 && videoId && !is_live) {
      return NextResponse.json(
        { error: 'No transcript found for this video. Please wait for transcription to complete.' },
        { status: 404 }
      );
    }

    // For live sessions without chunks yet, continue with empty context
    // (AI can still answer general questions)

    // Build prompt based on mode
    let prompt;
    switch (mode) {
      case 'simple':
        prompt = buildSimpleModePrompt(question, chunks);
        break;
      case 'practice':
        prompt = buildPracticeModePrompt(question, chunks, interestTags);
        break;
      case 'animation':
        prompt = buildAnimationModePrompt(question, chunks);
        break;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content || '';

    // Prepare answer object
    let answer: any = {
      content: responseContent,
      references: chunks.slice(0, 3).map((c) => ({
        start_sec: c.start_sec,
        end_sec: c.end_sec,
        text: c.text.substring(0, 200) + '...',
      })),
    };

    // If animation mode, parse JSON response and create render job
    if (mode === 'animation') {
      try {
        const animationSpec = JSON.parse(responseContent);
        answer = {
          ...answer,
          animation_spec: animationSpec,
        };

        // Create render job (for future implementation)
        await supabaseAdmin.from('jobs').insert({
          type: 'render',
          payload: {
            video_id: videoId,
            template: animationSpec.template,
            params: animationSpec.parameters,
          },
          status: 'pending',
        });

        answer.animation_status = 'rendering';
      } catch (e) {
        // If JSON parsing fails, treat as text response
        console.error('Failed to parse animation JSON:', e);
      }
    }

    // Save question and answer to database
    const { data: savedQuestion, error: dbError } = await supabaseAdmin
      .from('questions')
      .insert({
        video_id: videoId || null,
        user_id: userId,
        question,
        mode,
        interest_tags: interestTags || [],
        answer,
        live_session_id: liveSessionId || null,
        is_live: is_live || false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save question:', dbError);
      // Don't fail the request, just log it
    }

    return NextResponse.json({
      success: true,
      answer,
      question: savedQuestion,
      questionId: savedQuestion?.id,
    });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
