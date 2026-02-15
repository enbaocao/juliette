import * as fs from 'fs';
import * as path from 'path';

type Level = 'INFO' | 'WARN' | 'ERROR';

function serializeArg(arg: unknown): string {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack || ''}`.trim();
  }

  if (typeof arg === 'string') {
    return arg;
  }

  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

export function createFileLogger(workerName: string) {
  const logDir = path.resolve(process.cwd(), 'logs');
  const logFilePath = path.join(logDir, `${workerName}.log`);

  fs.mkdirSync(logDir, { recursive: true });

  function write(level: Level, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const message = args.map(serializeArg).join(' ');
    const line = `[${timestamp}] [${workerName}] [${level}] ${message}\n`;

    fs.appendFileSync(logFilePath, line, 'utf-8');
    if (level === 'ERROR') {
      console.error(message);
    } else if (level === 'WARN') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  return {
    info: (...args: unknown[]) => write('INFO', ...args),
    warn: (...args: unknown[]) => write('WARN', ...args),
    error: (...args: unknown[]) => write('ERROR', ...args),
    filePath: logFilePath,
  };
}
