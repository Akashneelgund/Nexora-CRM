import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'nexora.db');

export class DatabaseWrapper {
  private db: DatabaseSync;

  constructor(filePath: string = DB_PATH) {
    this.db = new DatabaseSync(filePath);
    // Enable WAL mode & foreign keys
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  public getRaw(): DatabaseSync {
    return this.db;
  }

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public all<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.length > 0 ? (rows[0] as T) : undefined;
  }

  public run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
    const stmt = this.db.prepare(sql);
    const res = stmt.run(...params);
    return {
      changes: typeof res.changes === 'number' ? res.changes : Number(res.changes || 0),
      lastInsertRowid: res.lastInsertRowid
    };
  }

  public transaction<T>(callback: () => T): T {
    this.exec('BEGIN TRANSACTION;');
    try {
      const result = callback();
      this.exec('COMMIT;');
      return result;
    } catch (error) {
      this.exec('ROLLBACK;');
      throw error;
    }
  }

  public close(): void {
    this.db.close();
  }
}

export const db = new DatabaseWrapper();
export default db;
