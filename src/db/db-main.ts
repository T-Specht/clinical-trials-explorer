import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import fs from "fs";
import { app, dialog } from "electron";
import path from "path";
import { DefaultLogger, LogWriter } from "drizzle-orm";

const IS_DEV = process.env.NODE_ENV === "development";

const dbPath = IS_DEV
  ? "sqlite.db"
  : path.join(app.getPath("userData"), "data.db");
const migrationsFolder = IS_DEV
  ? path.join(__dirname, "../../drizzle")
  : path.join(process.resourcesPath, "drizzle");

//const dbPath = "sqlite.db";

console.log(dbPath, migrationsFolder);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

class MyLogWriter implements LogWriter {
  write(message: string) {
    console.log(`### drizzle log ##\n${message}\n`);
  }
}

const logger = new DefaultLogger({ writer: new MyLogWriter() });

export const db = drizzle(sqlite, { schema, logger });

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
  console.log(sqlstr, params);

  const result = sqlite.prepare(sqlstr);
  //@ts-expect-error asdhkjashdkj
  const ret = result[method](...params);

  // console.log(ret);

  return toDrizzleResult(ret);
};

export const runMigrate = async () => {
  try {
    migrate(db, {
      migrationsFolder: migrationsFolder,
    });
  } catch (error) {
    dialog.showErrorBox("Migration Error", (error as any).message);
  }
};
