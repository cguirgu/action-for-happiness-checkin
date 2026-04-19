import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'checkin.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    reflect TEXT,
    gratitude TEXT,
    intention TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Idempotent migrations — safe to re-run on an existing DB volume.
function hasColumn(table: string, col: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === col);
}
if (!hasColumn('users', 'name')) db.exec(`ALTER TABLE users ADD COLUMN name TEXT`);
if (!hasColumn('checkins', 'expires_at')) db.exec(`ALTER TABLE checkins ADD COLUMN expires_at DATETIME`);
if (!hasColumn('checkins', 'reminded_at')) db.exec(`ALTER TABLE checkins ADD COLUMN reminded_at DATETIME`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_checkins_user_completed ON checkins(user_id, completed_at)`);

export default db;

export type User = { id: number; email: string; name: string | null };
export type Checkin = {
  id: number;
  token: string;
  user_id: number;
  reflect: string | null;
  gratitude: string | null;
  intention: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
};

/**
 * Last N completed check-ins for a user, most recent first.
 */
export function getUserCheckinHistory(userId: number, limit = 7): Checkin[] {
  return db
    .prepare(
      `SELECT * FROM checkins
       WHERE user_id = ? AND completed_at IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT ?`
    )
    .all(userId, limit) as Checkin[];
}

/**
 * Count of consecutive calendar days (ending today or yesterday) with a completed check-in.
 * Example: if the user completed today and yesterday, streak = 2.
 * Uses server-local date; precise enough for our single-instance scope.
 */
export function getStreak(userId: number): number {
  const rows = db
    .prepare(
      `SELECT DISTINCT date(completed_at) AS day
       FROM checkins
       WHERE user_id = ? AND completed_at IS NOT NULL
       ORDER BY day DESC`
    )
    .all(userId) as { day: string }[];

  if (rows.length === 0) return 0;

  const days = new Set(rows.map((r) => r.day));
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // Streak must end today or yesterday (we give a 1-day grace).
  let cursor = new Date(today);
  if (!days.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(iso(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(iso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Users who haven't completed a check-in in >24h and don't currently have an unexpired,
 * un-completed token waiting for them. Used by the daily cron.
 */
export function getUsersDueForReminder(): User[] {
  return db
    .prepare(
      `SELECT u.id, u.email, u.name
       FROM users u
       LEFT JOIN (
         SELECT user_id, MAX(completed_at) AS last_completed
         FROM checkins
         GROUP BY user_id
       ) c ON c.user_id = u.id
       WHERE (c.last_completed IS NULL OR c.last_completed < datetime('now', '-24 hours'))
         AND NOT EXISTS (
           SELECT 1 FROM checkins x
           WHERE x.user_id = u.id
             AND x.completed_at IS NULL
             AND x.expires_at IS NOT NULL
             AND x.expires_at > datetime('now')
         )`
    )
    .all() as User[];
}

/**
 * Look up a user by email, case-insensitive.
 */
export function getUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email.toLowerCase()) as User | undefined;
}

/**
 * UPSERT user: creates if new, updates name if a new name was provided on re-signup.
 */
export function upsertUser(email: string, name?: string | null): User {
  const clean = email.trim().toLowerCase();
  const cleanName = (name ?? '').trim().slice(0, 60) || null;
  const existing = getUserByEmail(clean);
  if (existing) {
    if (cleanName && cleanName !== existing.name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(cleanName, existing.id);
      return { ...existing, name: cleanName };
    }
    return existing;
  }
  const result = db.prepare('INSERT INTO users (email, name) VALUES (?, ?)').run(clean, cleanName);
  return { id: Number(result.lastInsertRowid), email: clean, name: cleanName };
}

/**
 * Create a check-in token for a user with a TTL.
 */
export function createCheckinToken(userId: number, token: string, ttlHours = 48): void {
  db.prepare(
    `INSERT INTO checkins (token, user_id, expires_at)
     VALUES (?, ?, datetime('now', ?))`
  ).run(token, userId, `+${ttlHours} hours`);
}

export function deleteCheckinToken(token: string): void {
  db.prepare('DELETE FROM checkins WHERE token = ?').run(token);
}

export function getCheckinByToken(token: string):
  | (Checkin & { user_email: string; user_name: string | null })
  | undefined {
  return db
    .prepare(
      `SELECT c.*, u.email AS user_email, u.name AS user_name
       FROM checkins c JOIN users u ON u.id = c.user_id
       WHERE c.token = ?`
    )
    .get(token) as (Checkin & { user_email: string; user_name: string | null }) | undefined;
}
