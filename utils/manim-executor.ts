import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ManimExecutionResult {
  success: boolean;
  videoPath?: string;
  error?: string;
  logs?: string;
}

export async function executeManimCode(
  code: string,
  outputName: string = `animation_${Date.now()}`,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<ManimExecutionResult> {
  const tempDir = path.join(os.tmpdir(), 'manim_render_' + Date.now());
  const sceneFile = path.join(tempDir, 'scene.py');
  const outputDir = path.join(tempDir, 'media');

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Validate code before writing
    if (!code.includes('class GeneratedScene')) {
      throw new Error('Code must contain GeneratedScene class');
    }

    if (!code.includes('def construct')) {
      throw new Error('Code must contain construct method');
    }

    // Write code to file
    fs.writeFileSync(sceneFile, code);

    console.log('Executing Manim code...');
    console.log('Temp dir:', tempDir);
    console.log('Code preview:', code.substring(0, 200) + '...');

    // Build Manim command with quality flag
    const qualityFlag = quality === 'low' ? '-ql' : quality === 'high' ? '-qh' : '-qm';
    const manimCommand = `cd "${tempDir}" && manim ${qualityFlag} --format=mp4 --media_dir="${outputDir}" scene.py GeneratedScene`;

    console.log('Running command:', manimCommand);

    try {
      const { stdout, stderr } = await execAsync(manimCommand, {
        timeout: 90000, // 90 second timeout (increased for higher quality)
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for output
      });

      console.log('Manim execution completed');
      if (stderr) console.log('Manim stderr (progress info):', stderr.substring(0, 500));

      // Find the generated video file
      const videoFiles = findVideoFiles(outputDir);

      if (videoFiles.length === 0) {
        // More detailed error
        const dirContents = listDirectoryRecursive(tempDir);
        throw new Error(`No video file generated. Directory contents:\n${dirContents}`);
      }

      const videoPath = videoFiles[0];
      console.log('Found video at:', videoPath);

      // Verify video file is not empty
      const stats = fs.statSync(videoPath);
      if (stats.size === 0) {
        throw new Error('Generated video file is empty');
      }

      console.log('Video size:', (stats.size / 1024).toFixed(2), 'KB');

      // Copy to public/animations directory
      const publicDir = path.join(process.cwd(), 'public', 'animations');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const finalPath = path.join(publicDir, `${outputName}.mp4`);
      fs.copyFileSync(videoPath, finalPath);

      console.log('✅ Video saved to:', finalPath);

      // Cleanup temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Warning: Could not cleanup temp directory:', cleanupError);
      }

      return {
        success: true,
        videoPath: `/animations/${outputName}.mp4`,
        logs: stdout,
      };
    } catch (execError: any) {
      console.error('❌ Manim execution error:', execError);

      // Check if Manim is installed
      if (execError.message?.includes('command not found') || execError.code === 127) {
        return {
          success: false,
          error: 'Manim not installed. Install with: pip3 install manim',
          logs: execError.message,
        };
      }

      // Check for Python syntax errors
      if (execError.stderr?.includes('SyntaxError') || execError.stderr?.includes('IndentationError')) {
        return {
          success: false,
          error: 'Python syntax error in generated code',
          logs: execError.stderr || execError.message,
        };
      }

      // Check for Manim-specific errors
      if (execError.stderr?.includes('Error')) {
        const errorMatch = execError.stderr.match(/Error: (.+)/);
        const errorMsg = errorMatch ? errorMatch[1] : 'Unknown Manim error';
        return {
          success: false,
          error: `Manim error: ${errorMsg}`,
          logs: execError.stderr,
        };
      }

      return {
        success: false,
        error: `Execution failed: ${execError.message}`,
        logs: (execError.stdout || '') + '\n' + (execError.stderr || ''),
      };
    }
  } catch (error: any) {
    console.error('❌ Error in executeManimCode:', error);

    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Warning: Could not cleanup temp directory:', cleanupError);
      }
    }

    return {
      success: false,
      error: error.message,
      logs: error.stack,
    };
  }
}

function findVideoFiles(dir: string): string[] {
  const videoFiles: string[] = [];

  function searchDir(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (file.endsWith('.mp4')) {
        videoFiles.push(fullPath);
      }
    }
  }

  searchDir(dir);
  return videoFiles;
}

function listDirectoryRecursive(dir: string, indent: string = ''): string {
  if (!fs.existsSync(dir)) return `${indent}[Directory not found]\n`;

  let result = '';
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          result += `${indent}📁 ${file}/\n`;
          result += listDirectoryRecursive(fullPath, indent + '  ');
        } else {
          const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
          result += `${indent}📄 ${file} (${sizeMB} MB)\n`;
        }
      } catch (err) {
        result += `${indent}❌ ${file} (error reading)\n`;
      }
    }
  } catch (err) {
    result += `${indent}[Error listing directory]\n`;
  }
  return result;
}
