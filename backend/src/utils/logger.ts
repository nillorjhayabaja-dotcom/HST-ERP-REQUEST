import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;

  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage);

  if (level === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
}

export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, meta?: any) => log('error', msg, meta),
};