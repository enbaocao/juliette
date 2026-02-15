import { NextRequest, NextResponse } from 'next/server';
import { generateManimCode, createFallbackAnimation } from '@/utils/manim-generator';
import { executeManimCode } from '@/utils/manim-executor';

// Manim API URL for production (Render deployment)
const MANIM_API_URL = process.env.MANIM_API_URL;
const RENDER_API_SECRET = process.env.RENDER_API_SECRET;

export async function POST(request: NextRequest) {
  // If MANIM_API_URL is set, proxy to the Render-hosted Manim API service
  if (MANIM_API_URL) {
    try {
      const body = await request.json();

      console.log('🔄 Proxying animation request to Render:', MANIM_API_URL);

      const response = await fetch(`${MANIM_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(RENDER_API_SECRET && { 'Authorization': `Bearer ${RENDER_API_SECRET}` }),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Render API error:', data);
        return NextResponse.json(data, { status: response.status });
      }

      console.log('✅ Animation generated via Render');
      return NextResponse.json(data);
    } catch (error) {
      console.error('❌ Proxy error:', error);
      return NextResponse.json(
        {
          error: 'Failed to connect to animation service',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }

  // Fallback to local execution for development
  console.log('🏠 Running Manim locally (development mode)');

  try {
    const body = await request.json();
    const { context, duration = 12 } = body;

    // Validation
    if (!context || typeof context !== 'string') {
      return NextResponse.json(
        { error: 'Context text is required' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || duration < 5 || duration > 60) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 60 seconds' },
        { status: 400 }
      );
    }

    // Limit context length
    const limitedContext = context.substring(0, 1000);

    console.log('\n🎬 Starting animation generation...');
    console.log('📝 Context:', limitedContext.substring(0, 100) + '...');
    console.log('⏱️  Duration:', duration, 'seconds');

    // Step 1: Generate Manim code using AI
    let manimCode: string;
    let usedFallback = false;

    try {
      console.log('🤖 Generating Manim code with Claude Opus 4.6...');
      manimCode = await generateManimCode({
        context: limitedContext,
        duration,
      });
      console.log('✅ Code generated successfully');
      console.log('📄 Code preview:', manimCode.substring(0, 300) + '...');
    } catch (error) {
      console.error('❌ Failed to generate code with AI:', error);
      console.log('⚠️  Using fallback animation');
      usedFallback = true;
      manimCode = createFallbackAnimation(limitedContext, duration);
    }

    // Step 2: Execute Manim code to generate video
    console.log('🎥 Rendering animation...');
    const outputName = `animation_${Date.now()}`;
    const result = await executeManimCode(manimCode, outputName, 'medium');

    if (!result.success) {
      console.error('❌ Animation rendering failed');
      return NextResponse.json(
        {
          error: result.error || 'Failed to generate animation',
          logs: result.logs,
          code: manimCode, // Return code for debugging
          usedFallback,
        },
        { status: 500 }
      );
    }

    console.log('✅ Animation generated successfully!');
    console.log('📹 Video URL:', result.videoPath);

    // Step 3: Return video URL
    return NextResponse.json({
      success: true,
      videoUrl: result.videoPath,
      message: 'Animation generated successfully',
      code: manimCode, // Include code for reference
      usedFallback,
      duration,
    });
  } catch (error) {
    console.error('❌ Generate animation API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking Manim installation
export async function GET() {
  // If using remote Manim API, check that service
  if (MANIM_API_URL) {
    try {
      const response = await fetch(`${MANIM_API_URL}/check-manim`, {
        headers: {
          ...(RENDER_API_SECRET && { 'Authorization': `Bearer ${RENDER_API_SECRET}` }),
        },
      });

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({
        status: 'Cannot reach Manim API service',
        ready: false,
        message: error instanceof Error ? error.message : 'Service unreachable',
      });
    }
  }

  // Check local Manim installation for development
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    await execAsync('manim --version');
    return NextResponse.json({
      status: 'Manim is installed locally',
      ready: true,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Manim not installed locally',
      ready: false,
      message: 'Install Manim with: pip install manim',
    });
  }
}
