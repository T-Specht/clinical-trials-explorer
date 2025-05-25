import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import fs from "fs";
import { app, BrowserWindow, dialog } from "electron";
import path, { join, resolve } from "path";
import { DefaultLogger, LogWriter, sql } from "drizzle-orm";
import { setLastOpenDbPath } from "../main_process/settings";
import { selectDbFileWithDialog } from "../main_process/app_menu";

const IS_DEV = process.env.NODE_ENV === "development";

console.log(app.getPath("userData"));

export const DEFAULT_DB_PATH = IS_DEV
  ? "sqlite.db"
  : path.join(app.getPath("userData"), "data.db");

export const DEFAULT_BACKUP_PATH = path.join(
  app.getPath("userData"),
  "db_backups"
);

let dbPath: string | null = null;

const migrationsFolder = IS_DEV
  ? path.join(__dirname, "../../drizzle")
  : path.join(process.resourcesPath, "drizzle");

//const dbPath = "sqlite.db";

console.log(dbPath, migrationsFolder);

class MyLogWriter implements LogWriter {
  write(message: string) {
    if (IS_DEV) {
      console.log(`### drizzle log ##\n${message}\n`);
    }
  }
}

let sqlite: Database.Database | null = null;
const logger = new DefaultLogger({ writer: new MyLogWriter() });
export let db: BetterSQLite3Database<typeof schema> | null = null;

function toDrizzleResult(
  rows: Record<string, any> | Array<Record<string, any>>
) {
  if (!rows) {
    return [];
  }
  if (Array.isArray(rows)) {
    return rows.map((row) => {
      return Object.keys(row).map((key) => row[key]);
    });
  } else {
    return Object.keys(rows).map((key) => rows[key]);
  }
}

export const execute = async (
  e: any,
  sqlstr: string,
  params: any,
  method: "run" | "all" | "values" | "get"
) => {
  if (!sqlite) {
    throw new Error("No database connected.");
  }

  if (IS_DEV) {
    console.log(sqlstr, params);
    console.log("\n\n\n");
  }

  const result = sqlite.prepare(sqlstr);
  //@ts-expect-error asdhkjashdkj
  const ret = result[method](...params);

  //console.log(ret);

  return toDrizzleResult(ret);
};

export const runMigrate = async () => {
  if (!db) {
    throw new Error("No database connected.");
  }

  let dbNameWithoutExt = path.parse(dbPath || '').name;

  fs.mkdirSync(DEFAULT_BACKUP_PATH, { recursive: true });
  await sqlite?.backup(
    join(DEFAULT_BACKUP_PATH, `backup-${dbNameWithoutExt}-${Date.now()}.db`)
  );

  // https://github.com/drizzle-team/drizzle-orm/issues/1813#issuecomment-2460509578
  
  db.run(sql`PRAGMA auto_vacuum = FULL;`)
  db.run(sql`PRAGMA foreign_keys=OFF;`);
  try {
    migrate(db, {
      migrationsFolder: migrationsFolder,
    });
  } catch (error) {
    dialog.showErrorBox("Migration Error", (error as any).message);
  } finally {
    db.run(sql`PRAGMA foreign_keys=ON;`);
  }
};

// export const backupDatabase = async () => {

// }

export const getCurrentDbPath = () => resolve(dbPath || "");

export const openDatabase = async (path: string, createNew = false) => {
  if (sqlite) sqlite.close();

  if (!createNew && !fs.existsSync(path)) {
    dialog.showErrorBox(
      "Database file does not exist",
      `Last used path: ${path}\n\nDid you move or rename it? Please select a valid file next. If you click on cancel, we will fallback to the default database. Please be aware that this database may contain outdated information if you have since moved or renamed the original database.`
    );

    path = (await selectDbFileWithDialog()) || DEFAULT_DB_PATH;
  }

  console.log("ATTCHING TO NEW DB INSTANCE");

  setLastOpenDbPath(path);

  app.addRecentDocument(path);

  //fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  dbPath = path;
  sqlite = new Database(dbPath);
  db = drizzle(sqlite, {
    schema,
    logger,
  });

  let window = BrowserWindow.getFocusedWindow();
  window?.reload(); // Only reloads if the window was already open because database connection happens before window creation
  window?.setTitle(`Clinical Trials Explorer - ${await getCurrentDbPath()}`);

  await runMigrate();
};

export const exportDatabaseBackup = async (path: string) => {
  if (sqlite) {
    await sqlite.backup(path);
  }
};