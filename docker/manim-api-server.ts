import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateManimCode, createFallbackAnimation } from '../utils/manim-generator';
import { executeManimCode } from '../utils/manim-executor';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - restrict to your Vercel domains in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Authentication middleware
const authMiddleware = (req: Request, res: Response, next: Function) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  // Check for API secret if configured
  const apiSecret = process.env.RENDER_API_SECRET;
  if (apiSecret) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== apiSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  next();
};

app.use(authMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'manim-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Check Manim installation endpoint
app.get('/check-manim', async (req: Request, res: Response) => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync('manim --version');
    res.json({
      status: 'Manim is installed',
      ready: true,
      version: stdout.trim(),
    });
  } catch (error) {
    res.json({
      status: 'Manim not installed',
      ready: false,
      message: 'Install Manim with: pip install manim',
    });
  }
});

// Generate animation endpoint
app.post('/generate', async (req: Request, res: Response) => {
  try {
    const { context, duration = 12 } = req.body;

    // Validation
    if (!context || typeof context !== 'string') {
      return res.status(400).json({
        error: 'Context text is required',
      });
    }

    if (typeof duration !== 'number' || duration < 5 || duration > 60) {
      return res.status(400).json({
        error: 'Duration must be between 5 and 60 seconds',
      });
    }

    // Limit context length
    const limitedContext = context.substring(0, 1000);

    console.log('\n🎬 Starting animation generation...');
    console.log('📝 Context:', limitedContext.substring(0, 100) + '...');
    console.log('⏱️  Duration:', duration, 'seconds');

    // Step 1: Generate Manim code using Claude Opus 4.6
    let manimCode: string;
    let usedFallback = false;

    try {
      console.log('🤖 Generating Manim code with Claude Haiku 4.5...');
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
    console.log('🎥 Rendering animation with Manim...');
    const outputName = `animation_${Date.now()}`;
    const result = await executeManimCode(manimCode, outputName, 'low'); // Use 'low' quality for 3x faster rendering

    if (!result.success) {
      console.error('❌ Animation rendering failed');
      return res.status(500).json({
        error: result.error || 'Failed to generate animation',
        logs: result.logs,
        code: manimCode,
        usedFallback,
      });
    }

    console.log('✅ Animation generated successfully!');
    console.log('📹 Video URL:', result.videoPath);

    // Step 3: Return video URL
    res.json({
      success: true,
      videoUrl: result.videoPath,
      message: 'Animation generated successfully',
      code: manimCode,
      usedFallback,
      duration,
    });
  } catch (error) {
    console.error('❌ Generate animation API error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Manim API Server started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Auth: ${process.env.RENDER_API_SECRET ? 'Enabled' : 'Disabled'}`);
  console.log('\n✅ Ready to generate animations!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
