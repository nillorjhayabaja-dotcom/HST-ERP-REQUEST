import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, "../../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }

  try {
    await execAsync(`pg_dump "${databaseUrl}" > "${backupFile}"`);
    return backupFile;
  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  }
}

export async function restoreBackup(backupFile: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }

  try {
    await execAsync(`psql "${databaseUrl}" < "${backupFile}"`);
  } catch (error) {
    console.error("Restore failed:", error);
    throw error;
  }
}

export function listBackups(): string[] {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir).filter((f) => f.endsWith(".sql"));
}
