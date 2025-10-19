// lib/logger.ts
import fs from 'fs';
import path from 'path';

/**
 * Sistema di logging su file con rotazione giornaliera
 * - Crea file giornalieri nella cartella logs/
 * - Elimina automaticamente log più vecchi di 30 giorni
 * - Supporta diversi livelli di log (info, warn, error)
 */

const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_AGE_DAYS = 30;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component?: string;
  message: string;
  data?: any;
}

/**
 * Assicura che la directory dei log esista
 */
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Ottiene il nome del file di log per la data odierna
 */
function getLogFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `app-${year}-${month}-${day}.log`;
}

/**
 * Elimina i file di log più vecchi di MAX_LOG_AGE_DAYS
 */
function cleanOldLogs() {
  try {
    ensureLogDirectory();
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const maxAge = MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      if (file.endsWith('.log')) {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`[Logger] Deleted old log file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('[Logger] Error cleaning old logs:', error);
  }
}

/**
 * Scrive una voce di log nel file
 */
function writeLog(entry: LogEntry) {
  // Solo server-side
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    ensureLogDirectory();

    const logFile = path.join(LOG_DIR, getLogFileName());
    const logLine = JSON.stringify(entry) + '\n';

    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (error) {
    console.error('[Logger] Error writing log:', error);
  }
}

/**
 * Funzione principale di logging
 */
export function log(
  level: LogLevel,
  message: string,
  options?: {
    component?: string;
    data?: any;
  }
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component: options?.component,
    message,
    data: options?.data,
  };

  // Log su console (development)
  if (process.env.NODE_ENV === 'development') {
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${entry.component ? ` [${entry.component}]` : ''}`;
    consoleMethod(prefix, message, entry.data || '');
  }

  // Log su file
  writeLog(entry);
}

/**
 * Helper per log di tipo info
 */
export function logInfo(message: string, options?: { component?: string; data?: any }) {
  log('info', message, options);
}

/**
 * Helper per log di tipo warn
 */
export function logWarn(message: string, options?: { component?: string; data?: any }) {
  log('warn', message, options);
}

/**
 * Helper per log di tipo error
 */
export function logError(message: string, options?: { component?: string; data?: any }) {
  log('error', message, options);
}

/**
 * Helper per log di tipo debug
 */
export function logDebug(message: string, options?: { component?: string; data?: any }) {
  log('debug', message, options);
}

/**
 * Inizializza il logger (pulisce vecchi log)
 * Chiamare all'avvio dell'applicazione
 */
export function initLogger() {
  if (typeof window === 'undefined') {
    cleanOldLogs();
    logInfo('Logger initialized', { component: 'Logger' });
  }
}

// Auto-inizializzazione
if (typeof window === 'undefined') {
  initLogger();
}
