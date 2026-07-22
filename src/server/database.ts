import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

let client: Database.Database | undefined;
export function dbPath() {
  return resolve(process.env.INTERVIEW_DOJO_DB_PATH ?? "data/interview-dojo.db");
}
export function sqlite() {
  if (!client) {
    const path = dbPath();
    mkdirSync(dirname(path), { recursive: true });
    client = new Database(path);
    client.pragma("journal_mode = WAL");
    client.exec(`CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, question_id TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, include_answer INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS answers (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rubric_scores (session_id TEXT NOT NULL, criterion_id TEXT NOT NULL, score INTEGER NOT NULL, note TEXT NOT NULL, PRIMARY KEY(session_id, criterion_id));
CREATE TABLE IF NOT EXISTS timeline_events (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, type TEXT NOT NULL, detail TEXT NOT NULL, occurred_at TEXT NOT NULL);`);
  }
  return client;
}
export function database() {
  return drizzle(sqlite());
}
export function closeDatabaseForTests() {
  client?.close();
  client = undefined;
}
