import fs from 'fs/promises';
import path from 'path';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Session {
  id: string;
  birthData: {
    solarDatetime: string;
    gender: 'male' | 'female';
    timezone: string;
    name?: string;
  };
  history: Message[];
  chart?: any;
  updatedAt: string;
}

const SESSIONS_DIR = path.join(process.cwd(), 'sessions');

export async function ensureSessionsDir() {
  try {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  } catch (err) {
    // Already exists or error
  }
}

export async function saveSession(session: Session) {
  await ensureSessionsDir();
  const filePath = path.join(SESSIONS_DIR, `${session.id}.json`);
  session.updatedAt = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(session, null, 2));
}

export async function getSession(id: string): Promise<Session | null> {
  const filePath = path.join(SESSIONS_DIR, `${id}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

export async function listSessions(): Promise<Omit<Session, 'history' | 'chart'>[]> {
  await ensureSessionsDir();
  const files = await fs.readdir(SESSIONS_DIR);
  const sessions = await Promise.all(
    files
      .filter(f => f.endsWith('.json'))
      .map(async f => {
        const data = await fs.readFile(path.join(SESSIONS_DIR, f), 'utf-8');
        const s = JSON.parse(data) as Session;
        const { history, chart, ...rest } = s;
        return rest;
      })
  );
  return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
